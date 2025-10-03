import { z } from 'zod';

const fieldValidationSchema = z.strictObject({
  required: z.boolean().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});

const formFieldSchema = z.strictObject({
  name: z.string(),
  label: z.string(),
  type: z.enum(['text', 'textarea', 'number', 'date']),
  validations: fieldValidationSchema.optional(),
});

const formStepSchema = z.strictObject({
  title: z.string(),
  fields: z.array(formFieldSchema),
});

export const formDefinitionSchema = z.strictObject({
  steps: z.array(formStepSchema),
});

export type FormDefinitionType = z.infer<typeof formDefinitionSchema>;
export type FormFieldType = z.infer<typeof formFieldSchema>;
