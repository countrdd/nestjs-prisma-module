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
var PrismaModule_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.PrismaModule = void 0;
const common_1 = require('@nestjs/common');
const connection_factory_1 = require('./connection.factory');
const prisma_service_1 = require('./prisma.service');
let PrismaModule = (PrismaModule_1 = class PrismaModule {
  static register(options) {
    const provider = (0, connection_factory_1.default)(
      options.name,
      options.multitenancy,
      new prisma_service_1.default(
        options.client,
        options.datasource,
        options.options,
        options.name,
        options.multitenancy,
        options.logging,
      ),
    );
    return {
      module: PrismaModule_1,
      providers: [provider],
      exports: [provider],
    };
  }
});
PrismaModule = PrismaModule_1 = __decorate(
  [(0, common_1.Module)({})],
  PrismaModule,
);
exports.PrismaModule = PrismaModule;
