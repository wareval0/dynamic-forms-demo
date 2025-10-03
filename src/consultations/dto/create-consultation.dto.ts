import { z } from 'zod';

export const createConsultationSchema = z.strictObject({
  tenantId: z.cuid(),
  patientId: z.cuid(),
  formCode: z.string().min(1),
  formData: z.record(z.string(), z.unknown()),
});

export type CreateConsultationDto = z.infer<typeof createConsultationSchema>;
