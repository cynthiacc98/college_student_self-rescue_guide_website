import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

export const categoryUpdateSchema = categorySchema.partial();

export const resourceSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  coverImageUrl: z.string().url().optional(),
  quarkLink: z.string().url(),
  tags: z.array(z.string()).default([]),
  categoryId: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export const resourceUpdateSchema = resourceSchema.partial().extend({
  categoryId: z.string().nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
});
