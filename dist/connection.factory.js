'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const common_1 = require('@nestjs/common');
const core_1 = require('@nestjs/core');
exports.default = (name, multitenancy, _service) => ({
  provide: name,
  scope: common_1.Scope.REQUEST,
  useFactory: async (req) => {
    return new Promise((resolve, reject) => {
      if (!req.headers['x-tenant-id'] && multitenancy) {
        reject(
          new common_1.BadRequestException(
            '⛔️ Invalid Request Options - Tenant',
          ),
        );
      } else {
        const connection = _service.getConnection(
          multitenancy ? req.headers['x-tenant-id'] : 'DEFAULT',
        );
        resolve(connection);
      }
    });
  },
  inject: [core_1.REQUEST],
});
