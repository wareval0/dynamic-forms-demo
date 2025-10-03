import { Controller, Get, Post, Body, UsePipes } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import {
  type CreateTenantDto,
  createTenantSchema,
} from './dto/create-tenant.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createTenantSchema))
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }
}
