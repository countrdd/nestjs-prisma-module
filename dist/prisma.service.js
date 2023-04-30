'use strict';
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
          ? (desc = Object.getOwnPropertyDescriptor(target, key))
          : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v);
  };
Object.defineProperty(exports, '__esModule', { value: true });
const common_1 = require('@nestjs/common');
const connection_string_1 = require('connection-string');
const logger_1 = require('./logger');
let PrismaService = class PrismaService {
  constructor(
    PrismaClient,
    datasource,
    config,
    name,
    multitenancy = false,
    logging = false,
  ) {
    this.PrismaClient = PrismaClient;
    this.datasource = datasource;
    this.config = config;
    this.name = name;
    this.multitenancy = multitenancy;
    this.logging = logging;
    this.connections = {};
    this.logger = new logger_1.Logger(logging);
  }
  getTenantDBUrl(name) {
    const string = new connection_string_1.ConnectionString(this.datasource);
    if (!string.protocol) {
      this.logger.log(
        `<${this.name}> | ⚠️ SQLite does not support multiple DBs. All tenants will use the same connection. <${this.name}>`,
      );
      return this.datasource;
    }
    switch (string.protocol) {
      case 'sqlserver':
        string.params = Object.assign(Object.assign({}, string.params), {
          database: name,
        });
        break;
      case 'mongodb':
        console.log(string);
        console.log('Checking....d');
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
  generateClient(name) {
    let client,
      initializer = (client, _) => client;
    if ('initializer' in this.PrismaClient) {
      client = this.PrismaClient.class;
      initializer = this.PrismaClient.initializer;
    } else {
      client = this.PrismaClient;
    }
    const instance = new client(
      Object.assign(
        Object.assign({}, this.config),
        this.multitenancy
          ? {
              datasources: {
                db: {
                  url: this.getTenantDBUrl(name),
                },
              },
            }
          : {},
      ),
    );
    return initializer(instance, name);
  }
  getConnection(tenant) {
    if (!this.connections[tenant]) {
      this.logger.log(`<${this.name}> | ✅ Creating new ${tenant} DB client`);
      this.connections[tenant] = this.generateClient(tenant);
      this.connections[tenant].$connect();
      this.connections[tenant].$on('beforeExit', async () => {
        this.logger.log(`<${this.name}> | 🗑 Exiting ${tenant} db connections`);
        await this.connections[tenant].$disconnect();
      });
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
};
PrismaService = __decorate(
  [
    (0, common_1.Injectable)(),
    __metadata('design:paramtypes', [
      Object,
      Object,
      Object,
      Object,
      Object,
      Object,
    ]),
  ],
  PrismaService,
);
exports.default = PrismaService;
