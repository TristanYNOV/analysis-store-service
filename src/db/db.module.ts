import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app-config.module';
import { DbService } from './db.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}
