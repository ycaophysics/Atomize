import { z } from "zod";

export const BreakdownSchema = z.object({
  subtasks: z
    .array(
      z.object({
        title: z.string().min(1),
        estMinutes: z.coerce.number().int().positive(),
        tinyFirstStep: z.string().min(1),
        dependencyId: z.string().optional().nullable()
      })
    )
    .min(1)
});

export type BreakdownResult = z.infer<typeof BreakdownSchema>;
