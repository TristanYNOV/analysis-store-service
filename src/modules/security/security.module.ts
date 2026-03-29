import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AccessControlService } from './access/access-control.service';
import { SecurityController } from './security.controller';
import { IdentityContextExtractor } from './identity/identity-context.extractor';
import { IdentityContextGuard } from './identity/identity-context.guard';
import { IdentityContextMiddleware } from './identity/identity-context.middleware';

@Module({
  controllers: [SecurityController],
  providers: [
    AccessControlService,
    IdentityContextExtractor,
    IdentityContextGuard,
    IdentityContextMiddleware,
  ],
  exports: [AccessControlService, IdentityContextExtractor, IdentityContextGuard],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(IdentityContextMiddleware).forRoutes('*');
  }
}
