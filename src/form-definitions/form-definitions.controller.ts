import { Controller, Get, Post, Body, UsePipes } from '@nestjs/common';
import { FormDefinitionsService } from './form-definitions.service';
import {
  type CreateFormDefinitionDto,
  createFormDefinitionSchema,
} from './dto/create-form-definition.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';

@Controller('form-definitions')
export class FormDefinitionsController {
  constructor(
    private readonly formDefinitionsService: FormDefinitionsService,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createFormDefinitionSchema))
  create(@Body() createFormDefinitionDto: CreateFormDefinitionDto) {
    return this.formDefinitionsService.create(createFormDefinitionDto);
  }

  @Get()
  findAll() {
    return this.formDefinitionsService.findAll();
  }
}
