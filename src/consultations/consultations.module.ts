import { Module } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { ConsultationsController } from './consultations.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DynamicFormsModule } from 'src/dynamic-forms/dynamic-forms.module';

@Module({
  imports: [PrismaModule, DynamicFormsModule],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
})
export class ConsultationsModule {}
