/**
 * Products ドメイン契約定義（admin CRUD 専用）
 * CQRS Command 側: 商品の作成・更新・削除操作
 *
 * 読み取り専用の ProductRepository は @/contracts/catalog を参照
 */

import { z } from 'zod';
import { ProductSchema, ProductStatusSchema } from '@/contracts/catalog';

export type { Product, ProductStatus } from '@/contracts/catalog';

// ─────────────────────────────────────────────────────────────────
// 管理者向け商品一覧取得 (GET /api/admin/products)
// ─────────────────────────────────────────────────────────────────

export const GetAdminProductsInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: ProductStatusSchema.optional(),
  q: z.string().optional(),
});
export type GetAdminProductsInput = z.infer<typeof GetAdminProductsInputSchema>;

export const GetAdminProductsOutputSchema = z.object({
  products: z.array(ProductSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
export type GetAdminProductsOutput = z.infer<typeof GetAdminProductsOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// 管理者向け商品詳細取得 (GET /api/admin/products/:id)
// ─────────────────────────────────────────────────────────────────

export const GetAdminProductByIdInputSchema = z.object({
  id: z.string().uuid(),
});
export type GetAdminProductByIdInput = z.infer<typeof GetAdminProductByIdInputSchema>;

export const GetAdminProductByIdOutputSchema = ProductSchema;
export type GetAdminProductByIdOutput = z.infer<typeof GetAdminProductByIdOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// 商品登録 (POST /api/admin/products)
// ─────────────────────────────────────────────────────────────────

export const CreateProductInputSchema = z.object({
  name: z.string().min(1, '商品名を入力してください').max(200, '商品名は200文字以内で入力してください'),
  price: z.coerce.number().int().min(0, '価格は0以上で入力してください'),
  description: z.string().max(2000, '商品説明は2000文字以内で入力してください').optional(),
  imageUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  stock: z.coerce.number().int().min(0, '在庫数は0以上で入力してください').optional(),
});
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;

export const CreateProductOutputSchema = ProductSchema;
export type CreateProductOutput = z.infer<typeof CreateProductOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// 商品更新 (PUT /api/admin/products/:id)
// ─────────────────────────────────────────────────────────────────

export const UpdateProductInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, '商品名を入力してください').max(200, '商品名は200文字以内で入力してください').optional(),
  price: z.coerce.number().int().min(0, '価格は0以上で入力してください').optional(),
  description: z.string().max(2000, '商品説明は2000文字以内で入力してください').optional(),
  imageUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  stock: z.coerce.number().int().min(0, '在庫数は0以上で入力してください').optional(),
});
export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;

export const UpdateProductOutputSchema = ProductSchema;
export type UpdateProductOutput = z.infer<typeof UpdateProductOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// ステータス更新 (PATCH /api/admin/products/:id/status)
// ─────────────────────────────────────────────────────────────────

export const UpdateProductStatusInputSchema = z.object({
  id: z.string().uuid(),
  status: ProductStatusSchema,
});
export type UpdateProductStatusInput = z.infer<typeof UpdateProductStatusInputSchema>;

export const UpdateProductStatusOutputSchema = ProductSchema;
export type UpdateProductStatusOutput = z.infer<typeof UpdateProductStatusOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// 商品削除 (DELETE /api/admin/products/:id)
// ─────────────────────────────────────────────────────────────────

export const DeleteProductInputSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteProductInput = z.infer<typeof DeleteProductInputSchema>;

export const DeleteProductOutputSchema = z.object({
  success: z.literal(true),
});
export type DeleteProductOutput = z.infer<typeof DeleteProductOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// リポジトリインターフェース（読み書き - products ドメイン用）
// ─────────────────────────────────────────────────────────────────

import type { Product } from '@/contracts/catalog';

export interface ProductCommandRepository {
  findAll(params: {
    status?: Product['status'];
    offset: number;
    limit: number;
    query?: string;
  }): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  count(status?: Product['status'], query?: string): Promise<number>;
  create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(id: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product>;
  updateStatus(id: string, status: Product['status']): Promise<Product>;
  delete(id: string): Promise<void>;
}
