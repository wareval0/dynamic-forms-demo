import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DynamicSchemaService } from 'src/dynamic-forms/dynamic-schema/dynamic-schema.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { ZodError } from 'zod';
import { InputJsonValue } from '@prisma/client/runtime/library';
import {
  SearchByFieldDto,
  SearchByKeywordDto,
} from './dto/search-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamicSchemaService: DynamicSchemaService,
  ) {}

  async create(tenantId: string, dto: CreateConsultationDto) {
    const formDefinition = await this.prisma.formDefinition.findFirst({
      where: {
        tenantId: tenantId,
        formCode: dto.formCode,
        isActive: true,
      },
      orderBy: {
        version: 'desc',
      },
    });

    if (!formDefinition) {
      throw new NotFoundException(
        `No active form definition found for tenant '${tenantId}' with code '${dto.formCode}'`,
      );
    }

    const validator =
      await this.dynamicSchemaService.getValidatorForForm(formDefinition);

    try {
      const validatedFormData = validator.parse(dto.formData);

      return this.prisma.medicalConsultation.create({
        data: {
          patientId: dto.patientId,
          formDefinitionId: formDefinition.id,
          formData: validatedFormData as InputJsonValue,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Form data validation failed',
          errors: error.flatten(),
        });
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.medicalConsultation.findMany();
  }

  async findConsultationsByAnamnesis(keyword: string) {
    return this.prisma.medicalConsultation.findMany({
      where: {
        formData: {
          path: ['anamnesis'],
          string_contains: keyword,
        },
      },
    });
  }

  findByFormDataField(params: SearchByFieldDto) {
    const { key, value } = params;

    return this.prisma.medicalConsultation.findMany({
      where: {
        formData: {
          path: [key],
          equals: value,
        },
      },
      take: 100,
    });
  }

  searchByAnamnesisKeyword(params: SearchByKeywordDto) {
    const { keyword, limit } = params;

    return this.prisma.medicalConsultation.findMany({
      where: {
        formData: {
          path: ['anamnesis'],
          string_contains: keyword,
        },
      },
      take: limit,
    });
  }

  async update(id: string, dto: UpdateConsultationDto) {
    const consultation = await this.prisma.medicalConsultation.findUnique({
      where: { id },
      include: { formDefinition: true },
    });

    if (!consultation) {
      throw new NotFoundException(`Consultation with ID '${id}' not found.`);
    }

    const mergedFormData = {
      ...(consultation.formData as object),
      ...dto.formData,
    };

    const validator = await this.dynamicSchemaService.getValidatorForForm(
      consultation.formDefinition,
    );

    try {
      const validatedData = validator.parse(mergedFormData);

      return this.prisma.medicalConsultation.update({
        where: { id },
        data: {
          formData: validatedData as InputJsonValue,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Updated form data is invalid',
          errors: error.flatten(),
        });
      }
      throw error;
    }
  }
}
