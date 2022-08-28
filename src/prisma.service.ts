import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ClassLike, Initializer, PluginConfig } from './types';
import { ConnectionString } from 'connection-string';

@Injectable()
export default class PrismaService<T extends ClassLike>
  implements OnModuleDestroy
{
  connections = {};
  constructor(
    public PrismaClient: PluginConfig<T>['client'],
    public datasource: PluginConfig<T>['datasource'],
    public config: PluginConfig<T>['options'],
    public name: PluginConfig<T>['name'],
  ) {}

  getTenantDBUrl(name: string) {
    const string = new ConnectionString(this.datasource);
    if (!string.protocol) {
      console.info(
        `<${this.name}> | ⚠️ SQLite does not support multiple DBs. All tenants will use the same connection. <${this.name}>`,
      );
      return this.datasource;
    }
    switch (string.protocol) {
      case 'sqlserver':
        string.params = { ...string.params, database: name };
        break;
      case 'mongodb':
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
      datasources: {
        db: {
          url: this.getTenantDBUrl(name),
        },
      },
    });

    // Run the initializer and return the instance
    return initializer(instance, name);
  }

  getConnection(tenant: string) {
    if (!this.connections[tenant]) {
      console.info(`<${this.name}> | ✅ Creating new ${tenant} DB client`);
      this.connections[tenant] = this.generateClient(tenant);
      this.connections[tenant].$connect();
      this.connections[tenant].$on('beforeExit', async () => {
        console.log(`<${this.name}> | 🗑 Exiting ${tenant} db connections`);
        await this.connections[tenant].$disconnect();
      });
    } else {
      console.info(`<${this.name}> | ♻️ Using existing ${tenant} DB client`);
    }

    return this.connections[tenant];
  }

  async onModuleDestroy() {
    console.log(`<${this.name}> | 💣 Disconnecting prisma pools`);
    Object.keys(this.connections).forEach(async (tenant) => {
      console.log(`<${this.name}> | Disconnecting ${tenant}`);
      await this.connections[tenant].$disconnect();
    });
  }
}
