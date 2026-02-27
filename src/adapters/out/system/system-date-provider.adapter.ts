import { Injectable } from '@nestjs/common';
import { DateProviderPort } from '@application/stock/ports';

@Injectable()
export class SystemDateProviderAdapter implements DateProviderPort {
  now(): Date {
    return new Date();
  }
}
