import { z } from 'zod';

export const createPatientSchema = z.strictObject({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  documentId: z.string().min(5),
  tenantId: z.cuid(),
});

export type CreatePatientDto = z.infer<typeof createPatientSchema>;
