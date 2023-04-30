import type PrismaService from './prisma.service';
import type { ClassLike } from './types';
declare const _default: (
  name: string,
  multitenancy: boolean,
  _service: PrismaService<ClassLike>,
) => FactoryProvider;
export default _default;
