import { z } from "zod";

export const ItemInput = z.object({
  categoryId: z.number().int(),
  nameAr: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().min(1).max(120),
  nameTr: z.string().trim().max(120).nullable().optional(),
  descAr: z.string().trim().max(600).nullable().optional(),
  descEn: z.string().trim().max(600).nullable().optional(),
  descTr: z.string().trim().max(600).nullable().optional(),
  price: z.number().int().min(0).max(100_000_000),
  image: z.string().trim().max(500).nullable().optional(),
  available: z.boolean().optional(),
  signature: z.boolean().optional(),
  tags: z.array(z.string().max(20)).max(12).optional(),
  role: z.enum(["breakfast", "mezza", "salad", "soup", "bread", "main", "side", "drink", "dessert", "shisha"]).optional(),
  serves: z.number().int().min(1).max(20).optional(),
  prepMinutes: z.number().int().min(0).max(240).optional(),
  sort: z.number().int().optional(),
});

export const CategoryInput = z.object({
  parentId: z.number().int().nullable().optional(),
  nameAr: z.string().trim().min(1).max(80),
  nameEn: z.string().trim().min(1).max(80),
  nameTr: z.string().trim().max(80).nullable().optional(),
  descAr: z.string().trim().max(200).nullable().optional(),
  descEn: z.string().trim().max(200).nullable().optional(),
  descTr: z.string().trim().max(200).nullable().optional(),
  image: z.string().trim().max(500).nullable().optional(),
  sort: z.number().int().optional(),
  active: z.boolean().optional(),
  dayparts: z.array(z.enum(["morning", "afternoon", "evening", "night"])).optional(),
});
