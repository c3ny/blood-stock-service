import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextData = {
  requestId: string;
  method: string;
  path: string;
  ip: string;
};

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextData>();

  run(context: RequestContextData, callback: () => void): void {
    this.storage.run(context, callback);
  }

  get(): RequestContextData | undefined {
    return this.storage.getStore();
  }
}