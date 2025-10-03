import { z } from 'zod';

export const searchByFieldSchema = z.strictObject({
  key: z.string().min(1, { message: 'The "key" parameter is required.' }),
  value: z.string().min(1, { message: 'The "value" parameter is required.' }),
});

export type SearchByFieldDto = z.infer<typeof searchByFieldSchema>;

export const searchByKeywordSchema = z.strictObject({
  keyword: z
    .string()
    .min(3, { message: 'The "keyword" must be at least 3 characters long.' }),
  limit: z.coerce.number().int().positive().optional().default(100),
});

export type SearchByKeywordDto = z.infer<typeof searchByKeywordSchema>;
