const { PrismaClient, BloodType } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await prisma.stockMovement.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.stock.deleteMany();
  console.log('✅ Cleaned existing data');

  // Create company IDs for demonstration
  const companyIds = {
    hospitalA: randomUUID(),
    hospitalB: randomUUID(),
    bloodBankCenter: randomUUID(),
  };

  console.log('🏥 Company IDs created:', companyIds);

  // Create stock entries for each blood type and company
  const stockData = [];
  
  // Hospital A - All blood types with moderate stock
  for (const bloodType of Object.values(BloodType)) {
    stockData.push({
      id: randomUUID(),
      companyId: companyIds.hospitalA,
      bloodType: bloodType,
      quantityA: bloodType.startsWith('A_') ? 50 : 0,
      quantityB: bloodType.startsWith('B_') && !bloodType.startsWith('AB_') ? 40 : 0,
      quantityAB: bloodType.startsWith('AB_') ? 30 : 0,
      quantityO: bloodType.startsWith('O_') ? 100 : 0,
    });
  }

  // Hospital B - All blood types with lower stock
  for (const bloodType of Object.values(BloodType)) {
    stockData.push({
      id: randomUUID(),
      companyId: companyIds.hospitalB,
      bloodType: bloodType,
      quantityA: bloodType.startsWith('A_') ? 20 : 0,
      quantityB: bloodType.startsWith('B_') && !bloodType.startsWith('AB_') ? 15 : 0,
      quantityAB: bloodType.startsWith('AB_') ? 10 : 0,
      quantityO: bloodType.startsWith('O_') ? 60 : 0,
    });
  }

  // Blood Bank Center - All blood types with high stock
  for (const bloodType of Object.values(BloodType)) {
    stockData.push({
      id: randomUUID(),
      companyId: companyIds.bloodBankCenter,
      bloodType: bloodType,
      quantityA: bloodType.startsWith('A_') ? 150 : 0,
      quantityB: bloodType.startsWith('B_') && !bloodType.startsWith('AB_') ? 120 : 0,
      quantityAB: bloodType.startsWith('AB_') ? 80 : 0,
      quantityO: bloodType.startsWith('O_') ? 200 : 0,
    });
  }

  console.log(`📊 Creating ${stockData.length} stock entries...`);
  
  const createdStocks = await prisma.$transaction(
    stockData.map((data) => prisma.stock.create({ data }))
  );

  console.log(`✅ Created ${createdStocks.length} stock entries`);

  // Create some stock movements (entry and exit examples)
  const stockMovements = [];
  
  // Entry movements for Hospital A
  const hospitalAStocks = createdStocks.filter(s => s.companyId === companyIds.hospitalA);
  for (const stock of hospitalAStocks.slice(0, 3)) {
    const currentQuantity = getStockQuantityByType(stock, stock.bloodType);
    stockMovements.push({
      id: randomUUID(),
      stockId: stock.id,
      movement: 20,
      quantityBefore: currentQuantity - 20,
      quantityAfter: currentQuantity,
      actionBy: 'system@seed.com',
      notes: 'Initial stock entry from donation campaign',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    });
  }

  // Exit movements for Hospital B
  const hospitalBStocks = createdStocks.filter(s => s.companyId === companyIds.hospitalB);
  for (const stock of hospitalBStocks.slice(0, 2)) {
    const currentQuantity = getStockQuantityByType(stock, stock.bloodType);
    stockMovements.push({
      id: randomUUID(),
      stockId: stock.id,
      movement: -5,
      quantityBefore: currentQuantity + 5,
      quantityAfter: currentQuantity,
      actionBy: 'doctor@hospitalb.com',
      notes: 'Emergency surgery requirement',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });
  }

  console.log(`📝 Creating ${stockMovements.length} stock movements...`);
  
  const createdMovements = await prisma.$transaction(
    stockMovements.map((data) => prisma.stockMovement.create({ data }))
  );

  console.log(`✅ Created ${createdMovements.length} stock movements`);

  // Create batches
  const batches = [];
  
  // Blood Bank Center - Various batches
  const batchCodes = ['BATCH-2026-001', 'BATCH-2026-002', 'BATCH-2026-003', 'BATCH-2026-004'];
  const bloodTypesForBatch = [BloodType.O_POS, BloodType.A_POS, BloodType.B_POS, BloodType.AB_POS];
  
  for (let i = 0; i < batchCodes.length; i++) {
    batches.push({
      id: randomUUID(),
      companyId: companyIds.bloodBankCenter,
      code: batchCodes[i],
      bloodType: bloodTypesForBatch[i],
      entryQuantity: 100,
      exitQuantity: Math.floor(Math.random() * 30),
    });
  }

  // Hospital A - Smaller batches
  batches.push({
    id: randomUUID(),
    companyId: companyIds.hospitalA,
    code: 'HA-BATCH-001',
    bloodType: BloodType.O_NEG,
    entryQuantity: 50,
    exitQuantity: 10,
  });

  batches.push({
    id: randomUUID(),
    companyId: companyIds.hospitalA,
    code: 'HA-BATCH-002',
    bloodType: BloodType.A_POS,
    entryQuantity: 60,
    exitQuantity: 15,
  });

  console.log(`🏷️  Creating ${batches.length} batches...`);
  
  const createdBatches = await prisma.$transaction(
    batches.map((data) => prisma.batch.create({ data }))
  );

  console.log(`✅ Created ${createdBatches.length} batches`);

  // Summary
  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📈 Summary:');
  console.log(`   - Companies: ${Object.keys(companyIds).length}`);
  console.log(`   - Stock entries: ${createdStocks.length}`);
  console.log(`   - Stock movements: ${createdMovements.length}`);
  console.log(`   - Batches: ${createdBatches.length}`);
  console.log('\n🔑 Sample Stock IDs for testing:');
  console.log(`   Hospital A (O+): ${hospitalAStocks.find(s => s.bloodType === BloodType.O_POS)?.id}`);
  console.log(`   Hospital B (A+): ${hospitalBStocks.find(s => s.bloodType === BloodType.A_POS)?.id}`);
  console.log(`   Blood Bank (AB+): ${createdStocks.find(s => s.companyId === companyIds.bloodBankCenter && s.bloodType === BloodType.AB_POS)?.id}`);
}

function getStockQuantityByType(stock, bloodType) {
  if (bloodType.startsWith('A_')) return stock.quantityA;
  if (bloodType.startsWith('B_') && !bloodType.startsWith('AB_')) return stock.quantityB;
  if (bloodType.startsWith('AB_')) return stock.quantityAB;
  if (bloodType.startsWith('O_')) return stock.quantityO;
  return 0;
}

main()
  .catch((error) => {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
