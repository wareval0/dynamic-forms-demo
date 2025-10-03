import { z } from 'zod';

export const updateConsultationSchema = z.strictObject({
  formData: z.object(),
});

export type UpdateConsultationDto = z.infer<typeof updateConsultationSchema>;
