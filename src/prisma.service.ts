import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ClassLike, Initializer, PluginConfig } from './types';
import { ConnectionString } from 'connection-string';
import { Logger } from './logger';

@Injectable()
export default class PrismaService<T extends ClassLike>
  implements OnModuleDestroy
{
  logger: Logger;
  connections = {};
  constructor(
    public PrismaClient: PluginConfig<T>['client'],
    public datasource: PluginConfig<T>['datasource'],
    public config: PluginConfig<T>['options'],
    public name: PluginConfig<T>['name'],
    public multitenancy: PluginConfig<T>['multitenancy'] = false,
    public logging: PluginConfig<T>['logging'] = false,
  ) {
    this.logger = new Logger(logging);
  }

  getTenantDBUrl(name: string) {
    const string = new ConnectionString(this.datasource);
    if (!string.protocol) {
      this.logger.log(
        `<${this.name}> | ⚠️ SQLite does not support multiple DBs. All tenants will use the same connection. <${this.name}>`,
      );
      return this.datasource;
    }
    switch (string.protocol) {
      case 'sqlserver':
        string.params = { ...string.params, database: name };
        break;
      case 'mongodb':
        console.log('Checking.');
        console.log(string);
        //   const databaseUrl = process.env.DATABASE_URL!.replace('public', tenantId);
        break;
      case 'mysql':
      case 'postgresql':
        string.path = [name, ...(string.path || [])];
        break;
      default:
        throw new Error(
          `<${this.name}> | ‼️ This database provider is not supported!`,
        );
    }

    return string.toString();
  }

  generateClient(name: string) {
    // Default the initializer assuming no initializer was passed
    let client: T,
      initializer: Initializer<T> = (client, _) => client;

    // If the input was of the type { class: T, initializer: Initializer<T>} update the vars
    if ('initializer' in this.PrismaClient) {
      client = this.PrismaClient.class;
      initializer = this.PrismaClient.initializer;
    } else {
      client = this.PrismaClient;
    }

    // Create an instance of the client
    const instance = new client({
      ...this.config,
      ...(this.multitenancy
        ? {
            datasources: {
              db: {
                url: this.getTenantDBUrl(name),
              },
            },
          }
        : {}),
    });

    // Run the initializer and return the instance
    return initializer(instance, name);
  }

  getConnection(tenant: string) {
    if (!this.connections[tenant]) {
      this.logger.log(`<${this.name}> | ✅ Creating new ${tenant} DB client`);

      this.connections[tenant] = this.generateClient(tenant);
      this.connections[tenant].$connect();
   //   this.connections[tenant].$on('beforeExit', async () => {
   //     this.logger.log(`<${this.name}> | 🗑 Exiting ${tenant} db connections`);
   //     await this.connections[tenant].$disconnect();
   //   });
    } else {
      if (this.logging)
        this.logger.log(
          `<${this.name}> | ♻️ Using existing ${tenant} DB client`,
        );
    }

    return this.connections[tenant];
  }

  async onModuleDestroy() {
    this.logger.log(`<${this.name}> | 💣 Disconnecting prisma pools`);
    Object.keys(this.connections).forEach(async (tenant) => {
      this.logger.log(`<${this.name}> | Disconnecting ${tenant}`);
      await this.connections[tenant].$disconnect();
    });
  }
}
