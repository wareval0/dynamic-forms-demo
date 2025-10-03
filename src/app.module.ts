import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DynamicFormsModule } from './dynamic-forms/dynamic-forms.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { TenantsModule } from './tenants/tenants.module';
import { PatientsModule } from './patients/patients.module';
import { FormDefinitionsModule } from './form-definitions/form-definitions.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: async () =>
        await redisStore({
          socket: {
            host: 'localhost',
            port: 6379,
          },
          ttl: 60 * 60,
        }),
    }),
    PrismaModule,
    DynamicFormsModule,
    ConsultationsModule,
    TenantsModule,
    PatientsModule,
    FormDefinitionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
