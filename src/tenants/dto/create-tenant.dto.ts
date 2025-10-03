import { z } from 'zod';

export const createTenantSchema = z.strictObject({
  name: z.string().min(3),
});

export type CreateTenantDto = z.infer<typeof createTenantSchema>;
