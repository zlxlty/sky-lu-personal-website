import { defineCollection } from "astro/content/config";
import { glob } from "astro/loaders";

import { blogSchema, projectSchema } from "@/content/schema";

const blog = defineCollection({
  loader: glob({
    base: "./src/content/blog",
    pattern: "**/*.{md,mdx}",
  }),
  schema: blogSchema,
});

const project = defineCollection({
  loader: glob({
    base: "./src/content/project",
    pattern: "**/*.mdx",
  }),
  schema: projectSchema,
});

export const collections = { blog, project };
