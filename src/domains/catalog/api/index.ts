/**
 * Catalog ドメイン - API 実装
 */
// @see barrel: Layout, Header, Footer, ToastProvider, useToast, ConfirmDialog, Loading,
//              Error, Empty, AlertBanner, ProductCard, ImagePlaceholder, QuantitySelector,
//              Button, FormField, TextInput, TextArea, Select, SearchBar, Pagination,
//              BackButton, StatusBadge, DataView, useFetch, useFormSubmit,
//              formatPrice, formatDateTime, formatDate, deserializeDates, emitCartUpdated (@/components)
import type { SessionData } from '@/foundation/auth/session';
import { validate } from '@/foundation/validation/runtime';
import {
  GetProductsInputSchema,
  GetProductByIdInputSchema,
  type ProductRepository,
  type GetProductsOutput,
  type GetProductByIdOutput,
  type CreateProductOutput,
  type UpdateProductOutput,
  type DeleteProductOutput,
} from '@/contracts/catalog';
import { NotImplementedError, NotFoundError } from '@/foundation/errors/domain-errors';

// re-export for consumers
export { NotImplementedError, NotFoundError };

/**
 * Catalog ドメインコンテキスト
 */
export interface CatalogContext {
  session: SessionData;
  repository: ProductRepository;
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
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { products, pagination: { page, limit, total, totalPages } };
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

export function createProduct(_rawInput: unknown, _context: CatalogContext): Promise<CreateProductOutput> {
  throw new NotImplementedError('catalog', 'createProduct');
}

export function updateProduct(_rawInput: unknown, _context: CatalogContext): Promise<UpdateProductOutput> {
  throw new NotImplementedError('catalog', 'updateProduct');
}

export function deleteProduct(_rawInput: unknown, _context: CatalogContext): Promise<DeleteProductOutput> {
  throw new NotImplementedError('catalog', 'deleteProduct');
}
