import { Injectable } from '@nestjs/common';
import type { Stock as PrismaStock } from '@prisma/client';
import { StockItem, EntityId, BloodType, Quantity } from '@domain';

@Injectable()
export class StockPrismaMapper {
  toDomain(raw: PrismaStock): StockItem {
    return StockItem.create(
      new EntityId(raw.id),
      new EntityId(raw.companyId),
      BloodType.fromString(raw.bloodType),
      new Quantity(raw.quantityA),
      new Quantity(raw.quantityB),
      new Quantity(raw.quantityAB),
      new Quantity(raw.quantityO),
    );
  }

  toPersistence(domain: StockItem): PrismaStock {
    return {
      id: domain.getId().getValue(),
      companyId: domain.getCompanyId().getValue(),
      bloodType: domain.getBloodType().getValue() as any,
      quantityA: domain.getQuantityA().getValue(),
      quantityB: domain.getQuantityB().getValue(),
      quantityAB: domain.getQuantityAB().getValue(),
      quantityO: domain.getQuantityO().getValue(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
