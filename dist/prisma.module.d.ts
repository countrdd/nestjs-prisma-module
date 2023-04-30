import { DynamicModule } from '@nestjs/common';
import type { ClassLike, PluginConfig } from './types';
export declare class PrismaModule {
  static register<T extends ClassLike>(options: PluginConfig<T>): DynamicModule;
}
