import { Module } from '@nestjs/common';
import { FormDefinitionsService } from './form-definitions.service';
import { FormDefinitionsController } from './form-definitions.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FormDefinitionsController],
  providers: [FormDefinitionsService],
})
export class FormDefinitionsModule {}
