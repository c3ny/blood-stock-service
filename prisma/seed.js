const { PrismaClient, BloodType, UserRole, MovementType, BloodBagStatus } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 V3 Schema - Starting database seeding...');

  // Clean existing V3 data
  try {
    await prisma.movement.deleteMany({});
    await prisma.bloodBag.deleteMany({});
    await prisma.batch.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.eventLog.deleteMany({});
    await prisma.stockAlert.deleteMany({});
    await prisma.stockView.deleteMany({});
  } catch (e) {
    console.log('⚠️  Could not delete tables:', e.message);
  }

  // Create companies
  const companies = await prisma.company.createMany({
    data: [
      {
        name: 'Central Blood Bank - São Paulo',
        cnpj: '12.345.678/0001-90',
        address: 'Rua 1, 100, São Paulo, SP',
        phone: '(11) 3456-7890',
        email: 'contact@bloodbank-sp.com.br',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        isActive: true,
      },
      {
        name: 'Hospital Regional - Teste',
        cnpj: '98.765.432/0001-12',
        address: 'Av Hospital, 500, Rio de Janeiro, RJ',
        phone: '(21) 9876-5432',
        email: 'blood@hospital-test.com.br',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '20000-000',
        isActive: true,
      },
    ],
  });

  console.log(`✅ Created ${companies.count} companies`);

  // Get companies
  const companyIds = await prisma.company.findMany();

  // Create users
  const users = [];
  for (const company of companyIds) {
    for (const role of [UserRole.ADMIN, UserRole.TECHNICIAN, UserRole.DOCTOR]) {
      users.push({
        companyId: company.id,
        name: `${role} User - ${company.name}`,
        email: `${role.toLowerCase()}@${company.cnpj.split('/')[0]}.local`,
        password: '$2b$10$hash_placeholder', // Dummy hash
        role: role,
        isActive: true,
      });
    }
  }

  const createdUsers = await prisma.user.createMany({ data: users });
  console.log(`✅ Created ${createdUsers.count} users`);

  // Create batches with blood bags
  const companyId = companyIds[0].id;
  let bloodBagCount = 0;

  for (const bloodType of Object.values(BloodType)) {
    // Create batch
    const batch = await prisma.batch.create({
      data: {
        companyId,
        code: `BATCH-${bloodType}-${Date.now()}`,
        bloodType,
        receivedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
        donorReference: 'Donation Campaign 2026',
        sourceLocation: 'Central Blood Bank',
      },
    });

    // Create blood bags for this batch
    const bagCount = Math.floor(Math.random() * 30) + 10; // 10-40 bags per type
    const bags = [];
    for (let i = 0; i < bagCount; i++) {
      bags.push({
        batchId: batch.id,
        bagCode: `${batch.code}-BAG-${String(i + 1).padStart(5, '0')}`,
        bloodType,
        volume: 450,
        status: i < Math.max(1, Math.floor(bagCount * 0.3)) ? BloodBagStatus.RESERVED : BloodBagStatus.AVAILABLE,
        expiresAt: batch.expiresAt,
      });
    }

    await prisma.bloodBag.createMany({ data: bags });
    bloodBagCount += bagCount;
  }

  console.log(`✅ Created ${Object.values(BloodType).length} batches with ${bloodBagCount} blood bags`);

  // Create some movements
  const user = await prisma.user.findFirst({ where: { companyId } });
  const movements = [];

  for (let i = 0; i < 5; i++) {
    const randomBloodType = Object.values(BloodType)[Math.floor(Math.random() * 8)];
    movements.push({
      companyId,
      userId: user.id,
      type: i % 2 === 0 ? MovementType.ENTRY_DONATION : MovementType.EXIT_TRANSFUSION,
      bloodType: randomBloodType,
      quantity: Math.floor(Math.random() * 5) + 1,
      origin: i % 2 === 0 ? 'Donor' : 'Patient',
      notes:  `Movement #${i + 1}`,
    });
  }

  await prisma.movement.createMany({ data: movements });
  console.log(`✅ Created ${movements.length} movements`);

  // Update StockView
  const stockViewData = Object.values(BloodType).map(bloodType => ({
    companyId,
    bloodType,
    availableCount: Math.floor(Math.random() * 20) + 5,
    reservedCount: Math.floor(Math.random() * 5),
    totalVolume: (Math.floor(Math.random() * 20) + 5) * 450,
    availableVolume: (Math.floor(Math.random() * 18) + 4) * 450,
  }));

  for (const data of stockViewData) {
    await prisma.stockView.upsert({
      where: {
        unique_stock_per_company_blood_type: {
          companyId: data.companyId,
          bloodType: data.bloodType,
        },
      },
      update: data,
      create: data,
    });
  }

  console.log(`✅ Updated StockView for ${stockViewData.length} blood types`);

  // Summary
  console.log('\n🎉 V3 Seeding completed successfully!');
  console.log('\n📈 Summary:');
  console.log(`   - Companies: ${companyIds.length}`);
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Batches: ${Object.values(BloodType).length}`);
  console.log(`   - Blood Bags: ${bloodBagCount}`);
  console.log(`   - Movements: ${movements.length}`);
  console.log(`   - StockView entries: ${stockViewData.length}`);
}

main()
  .catch((error) => {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
