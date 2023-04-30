import { OnModuleDestroy } from '@nestjs/common';
import type { ClassLike, PluginConfig } from './types';
import { Logger } from './logger';
export default class PrismaService<T extends ClassLike>
  implements OnModuleDestroy
{
  PrismaClient: PluginConfig<T>['client'];
  datasource: PluginConfig<T>['datasource'];
  config: PluginConfig<T>['options'];
  name: PluginConfig<T>['name'];
  multitenancy: PluginConfig<T>['multitenancy'];
  logging: PluginConfig<T>['logging'];
  logger: Logger;
  connections: {};
  constructor(
    PrismaClient: PluginConfig<T>['client'],
    datasource: PluginConfig<T>['datasource'],
    config: PluginConfig<T>['options'],
    name: PluginConfig<T>['name'],
    multitenancy?: PluginConfig<T>['multitenancy'],
    logging?: PluginConfig<T>['logging'],
  );
  getTenantDBUrl(name: string): any;
  generateClient(name: string): InstanceType<T>;
  getConnection(tenant: string): any;
  onModuleDestroy(): Promise<void>;
}
