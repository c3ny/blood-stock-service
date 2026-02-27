export interface DateProviderPort {
  now(): Date;
}

export const DATE_PROVIDER_PORT = Symbol('DATE_PROVIDER_PORT');
