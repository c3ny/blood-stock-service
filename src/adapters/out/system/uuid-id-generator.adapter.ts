import { Injectable } from '@nestjs/common';
import { IdGeneratorPort } from '@application/stock/ports';
import { randomUUID } from 'crypto';

@Injectable()
export class UuidIdGeneratorAdapter implements IdGeneratorPort {
  generate(): string {
    return randomUUID();
  }
}
