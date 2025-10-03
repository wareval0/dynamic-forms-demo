import { Module } from '@nestjs/common';
import { DynamicSchemaService } from './dynamic-schema/dynamic-schema.service';

@Module({
  providers: [DynamicSchemaService],
  exports: [DynamicSchemaService],
})
export class DynamicFormsModule {}
