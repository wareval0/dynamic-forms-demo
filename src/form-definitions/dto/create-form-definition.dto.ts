import { z } from 'zod';
import { formDefinitionSchema as schemaDefinitionContents } from 'src/dynamic-forms/schemas/form-definition.schema';

export const createFormDefinitionSchema = z.strictObject({
  formCode: z.string().min(3),
  version: z.number().int().positive(),
  isActive: z.boolean().optional().default(true),
  tenantId: z.cuid(),
  schemaDefinition: schemaDefinitionContents,
});

export type CreateFormDefinitionDto = z.infer<
  typeof createFormDefinitionSchema
>;
