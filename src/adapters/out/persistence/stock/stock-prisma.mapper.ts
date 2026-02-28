import { Injectable } from '@nestjs/common';
import type { StockView as PrismaStockView } from '@prisma/client';
import { StockItem, EntityId, BloodType, Quantity } from '@domain';

@Injectable()
export class StockPrismaMapper {
  toDomain(raw: any): StockItem {
    return StockItem.create(
      new EntityId(raw.id),
      new EntityId(raw.companyId),
      BloodType.fromString(raw.bloodType),
      new Quantity(raw.quantityA || 0),
      new Quantity(raw.quantityB || 0),
      new Quantity(raw.quantityAB || 0),
      new Quantity(raw.quantityO || 0),
    );
  }

  toPersistence(domain: StockItem): any {
    return {
      id: domain.getId().getValue(),
      companyId: domain.getCompanyId().getValue(),
      bloodType: domain.getBloodType().getValue(),
      quantityA: domain.getQuantityA().getValue(),
      quantityB: domain.getQuantityB().getValue(),
      quantityAB: domain.getQuantityAB().getValue(),
      quantityO: domain.getQuantityO().getValue(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private prismaToBloodType(prismaType: string): string {
    // Convert Prisma enum format (A_POS) to domain format (A+)
    return prismaType.replace('_POS', '+').replace('_NEG', '-');
  }

  private bloodTypeToPrisma(domainType: string): string {
    // Convert domain format (A+) to Prisma enum format (A_POS)
    return domainType.replace('+', '_POS').replace('-', '_NEG');
  }
}
