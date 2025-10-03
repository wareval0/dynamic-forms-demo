import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { z, ZodTypeAny } from 'zod';
import { FormDefinitionType } from '../schemas/form-definition.schema';
import { Prisma } from '@prisma/client';

type ZodObjectValidator = z.ZodObject<Record<string, ZodTypeAny>>;

@Injectable()
export class DynamicSchemaService {
  private readonly logger = new Logger(DynamicSchemaService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getValidatorForForm(formDefinition: {
    id: string;
    tenantId: string;
    formCode: string;
    version: number;
    schemaDefinition: Prisma.JsonValue;
  }): Promise<ZodObjectValidator> {
    const cacheKey = `form-validator:${formDefinition.tenantId}:${formDefinition.formCode}:${formDefinition.version}`;

    const cachedValidator =
      await this.cacheManager.get<ZodObjectValidator>(cacheKey);
    if (cachedValidator) {
      this.logger.log(`Cache HIT for key: ${cacheKey}`);
      return cachedValidator;
    }

    this.logger.log(
      `Cache MISS for key: ${cacheKey}. Building new validator...`,
    );

    const schemaDefinition =
      formDefinition.schemaDefinition as unknown as FormDefinitionType;
    const validator = this.buildZodSchemaFromJson(schemaDefinition);

    await this.cacheManager.set(cacheKey, validator);

    return validator;
  }

  private buildZodSchemaFromJson(
    schema: FormDefinitionType,
  ): ZodObjectValidator {
    const shape: Record<string, ZodTypeAny> = {};

    schema.steps.forEach((step) => {
      step.fields.forEach((field) => {
        let fieldValidator: ZodTypeAny;

        switch (field.type) {
          case 'number':
            fieldValidator = z.number();
            break;
          case 'date':
            fieldValidator = z.coerce.date();
            break;
          case 'textarea':
          case 'text':
          default:
            fieldValidator = z.string();
            break;
        }

        if (field.validations) {
          if (field.validations.required) {
            if (field.type === 'text' || field.type === 'textarea') {
              fieldValidator = (fieldValidator as z.ZodString).min(1, {
                message: `${field.label} es requerido.`,
              });
            }
          } else {
            fieldValidator = fieldValidator.optional();
          }

          if (field.validations.minLength) {
            fieldValidator = (fieldValidator as z.ZodString).min(
              field.validations.minLength,
            );
          }
          if (field.validations.maxLength) {
            fieldValidator = (fieldValidator as z.ZodString).max(
              field.validations.maxLength,
            );
          }
          if (field.validations.min) {
            fieldValidator = (fieldValidator as z.ZodNumber).min(
              field.validations.min,
            );
          }
          if (field.validations.max) {
            fieldValidator = (fieldValidator as z.ZodNumber).max(
              field.validations.max,
            );
          }
        } else {
          fieldValidator = fieldValidator.optional();
        }

        shape[field.name] = fieldValidator;
      });
    });

    return z.strictObject(shape);
  }
}
