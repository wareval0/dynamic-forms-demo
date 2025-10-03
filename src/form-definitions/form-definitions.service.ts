import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFormDefinitionDto } from './dto/create-form-definition.dto';

@Injectable()
export class FormDefinitionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createFormDefinitionDto: CreateFormDefinitionDto) {
    return this.prisma.formDefinition.create({ data: createFormDefinitionDto });
  }

  findAll() {
    return this.prisma.formDefinition.findMany();
  }
}
