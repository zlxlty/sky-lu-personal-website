import { z } from "astro/zod";

const text = z.string().trim().min(1);
const tags = z.array(text).default([]);
const date = z.union([z.iso.date(), z.date()]).pipe(z.coerce.date());

export const blogSchema = z
  .object({
    title: text,
    description: text,
    publishedAt: date,
    updatedAt: date.optional(),
    tags,
    draft: z.boolean(),
  })
  .strict()
  .refine(
    ({ publishedAt, updatedAt }) => !updatedAt || updatedAt >= publishedAt,
    {
      message: "Updated date must not precede publication",
      path: ["updatedAt"],
    },
  );

export const projectSchema = z
  .object({
    title: text,
    description: text,
    category: z.enum(["Engineering", "Research", "Independent"]),
    context: text,
    order: z.number().int().nonnegative(),
    tags,
    draft: z.boolean(),
    results: z
      .array(z.object({ value: text, label: text }).strict())
      .min(1)
      .max(3),
  })
  .strict();
