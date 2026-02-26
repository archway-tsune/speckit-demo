/** Catalog ドメイン - ユースケース（authorize → validate → ビジネスロジック） */
import type { Session } from '@/foundation/auth/session';
import { authorize } from '@/foundation/auth/authorize';
import { validate } from '@/foundation/validation/runtime';
import {
  GetProductsInputSchema, GetProductByIdInputSchema,
  CreateProductInputSchema, UpdateProductInputSchema, DeleteProductInputSchema,
  type GetProductsOutput, type GetProductByIdOutput,
  type CreateProductOutput, type UpdateProductOutput, type DeleteProductOutput,
  type ProductRepository,
} from '@/samples/contracts/catalog';

export type { ProductRepository } from '@/samples/contracts/catalog';

export interface CatalogContext {
  session: Session;
  repository: ProductRepository;
}

export class NotFoundError extends Error {
  constructor(message: string) { super(message); this.name = 'NotFoundError'; }
}

export async function getProducts(rawInput: unknown, context: CatalogContext): Promise<GetProductsOutput> {
  const input = validate(GetProductsInputSchema, rawInput);
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const status = context.session.role === 'buyer' ? 'published' : (input.status || undefined);
  const offset = (page - 1) * limit;
  const [products, total] = await Promise.all([
    context.repository.findAll({ status, offset, limit }),
    context.repository.count(status),
  ]);
  return { products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getProductById(rawInput: unknown, context: CatalogContext): Promise<GetProductByIdOutput> {
  const input = validate(GetProductByIdInputSchema, rawInput);
  const product = await context.repository.findById(input.id);
  if (!product) throw new NotFoundError('商品が見つかりません');
  if (context.session.role === 'buyer' && product.status !== 'published') {
    throw new NotFoundError('商品が見つかりません');
  }
  return product;
}

export async function createProduct(rawInput: unknown, context: CatalogContext): Promise<CreateProductOutput> {
  authorize(context.session, 'admin');
  const input = validate(CreateProductInputSchema, rawInput);
  return context.repository.create({
    name: input.name, price: input.price,
    description: input.description, imageUrl: input.imageUrl,
    status: input.status || 'draft',
  });
}

export async function updateProduct(rawInput: unknown, context: CatalogContext): Promise<UpdateProductOutput> {
  authorize(context.session, 'admin');
  const input = validate(UpdateProductInputSchema, rawInput);
  const existing = await context.repository.findById(input.id);
  if (!existing) throw new NotFoundError('商品が見つかりません');
  return context.repository.update(input.id, {
    name: input.name, price: input.price,
    description: input.description, imageUrl: input.imageUrl,
    status: input.status,
  });
}

export async function deleteProduct(rawInput: unknown, context: CatalogContext): Promise<DeleteProductOutput> {
  authorize(context.session, 'admin');
  const input = validate(DeleteProductInputSchema, rawInput);
  const existing = await context.repository.findById(input.id);
  if (!existing) throw new NotFoundError('商品が見つかりません');
  await context.repository.delete(input.id);
  return { success: true };
}
