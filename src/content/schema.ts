import { z } from "astro/zod";

const nonEmptyText = z.string().trim().min(1);
const tagList = z.array(nonEmptyText);
const httpsUrl = z
  .url()
  .refine((url) => url.startsWith("https://"), "URL must use HTTPS");

export const blogSchema = z
  .object({
    title: nonEmptyText,
    description: nonEmptyText,
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: tagList.default([]),
    draft: z.boolean(),
    image: nonEmptyText.optional(),
    canonicalUrl: httpsUrl.optional(),
    series: nonEmptyText.optional(),
  })
  .strict()
  .refine(
    ({ publishedAt, updatedAt }) =>
      updatedAt === undefined || updatedAt >= publishedAt,
    {
      message: "updatedAt must not be earlier than publishedAt",
      path: ["updatedAt"],
    },
  );

export const projectSchema = z
  .object({
    title: nonEmptyText,
    description: nonEmptyText,
    kind: z.enum(["professional", "research", "independent"]),
    affiliation: nonEmptyText.optional(),
    tags: tagList.min(1),
    draft: z.boolean(),
    canonicalUrl: httpsUrl.optional(),
  })
  .strict();
