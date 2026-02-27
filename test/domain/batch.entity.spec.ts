import { Batch } from '../../src/domain/entities/batch.entity';
import { BloodType } from '../../src/domain/value-objects/blood-type.vo';
import { EntityId } from '../../src/domain/value-objects/entity-id.vo';
import { Quantity } from '../../src/domain/value-objects/quantity.vo';
import { InvalidBatchOperationError } from '../../src/domain/errors/invalid-batch-operation.error';

describe('Batch Entity', () => {
  it('should register entry for a batch', () => {
    const id = new EntityId();
    const companyId = new EntityId();
    const batch = Batch.create(id, companyId, 'BATCH-001', BloodType.fromString('O+'), new Quantity(0), new Quantity(0));

    batch.registerEntry(new Quantity(5));

    expect(batch.getEntryQuantity().getValue()).toBe(5);
  });

  it('should reject exit when batch would exceed entry quantity', () => {
    const id = new EntityId();
    const companyId = new EntityId();
    const batch = Batch.create(id, companyId, 'BATCH-002', BloodType.fromString('AB+'), new Quantity(1), new Quantity(0));

    expect(() => batch.registerExit(new Quantity(2))).toThrow(InvalidBatchOperationError);
  });

  it('should normalize batch code by trimming and uppercasing', () => {
    const id = new EntityId();
    const companyId = new EntityId();
    const batch = Batch.create(id, companyId, '  batch-trim  ', BloodType.fromString('A-'), new Quantity(0), new Quantity(0));

    expect(batch.getCode()).toBe('BATCH-TRIM');
  });
});
