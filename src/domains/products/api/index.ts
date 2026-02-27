/**
 * Products ドメイン - API 実装（admin CRUD）
 */
// @see barrel: Layout, Header, Footer, NavLink, ToastProvider, useToast, ConfirmDialog, Loading,
//              Error, Empty, AlertBanner, ProductCard, ImagePlaceholder, QuantitySelector,
//              Button, FormField, TextInput, TextArea, Select, SearchBar, ButtonProps,
//              Pagination, BackButton, PaginationData, StatusBadge, orderStatusLabels,
//              orderStatusColors, DataView, DataViewProps, Forbidden, LoginPage, LogoutPage,
//              isAdmin, isBuyer, allowAny, AdminLayout, BuyerLayout, useFetch, useFormSubmit,
//              formatPrice, formatDateTime, formatDate, deserializeDates, emitCartUpdated (@/components)
import type { SessionData } from '@/foundation/auth/session';
import { authorize } from '@/foundation/auth/authorize';
import { validate } from '@/foundation/validation/runtime';
import { NotImplementedError, NotFoundError } from '@/foundation/errors/domain-errors';
import {
  GetAdminProductsInputSchema,
  CreateProductInputSchema,
  GetAdminProductByIdInputSchema,
  UpdateProductInputSchema,
  UpdateProductStatusInputSchema,
  DeleteProductInputSchema,
  type ProductCommandRepository,
  type GetAdminProductsOutput,
  type GetAdminProductByIdOutput,
  type CreateProductOutput,
  type UpdateProductOutput,
  type UpdateProductStatusOutput,
  type DeleteProductOutput,
} from '@/contracts/products';

// re-export for consumers
export { NotImplementedError, NotFoundError };

/**
 * Products ドメインコンテキスト
 */
export interface ProductsContext {
  session: SessionData;
  repository: ProductCommandRepository;
}

export async function getAdminProducts(rawInput: unknown, context: ProductsContext): Promise<GetAdminProductsOutput> {
  authorize(context.session, 'admin');
  const input = validate(GetAdminProductsInputSchema, rawInput);
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const status = input.status;
  const query = input.q || undefined;
  const offset = (page - 1) * limit;
  const [products, total] = await Promise.all([
    context.repository.findAll({ status, offset, limit, query }),
    context.repository.count(status, query),
  ]);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { products, pagination: { page, limit, total, totalPages } };
}

export async function getAdminProductById(rawInput: unknown, context: ProductsContext): Promise<GetAdminProductByIdOutput> {
  authorize(context.session, 'admin');
  const input = validate(GetAdminProductByIdInputSchema, rawInput);
  const product = await context.repository.findById(input.id);
  if (!product) throw new NotFoundError('商品が見つかりません');
  return product;
}

export async function createProduct(rawInput: unknown, context: ProductsContext): Promise<CreateProductOutput> {
  authorize(context.session, 'admin');
  const input = validate(CreateProductInputSchema, rawInput);
  return context.repository.create({
    name: input.name,
    price: input.price,
    description: input.description,
    imageUrl: input.imageUrl || undefined,
    stock: input.stock ?? 0,
    status: 'draft',
  });
}

export async function updateProduct(rawInput: unknown, context: ProductsContext): Promise<UpdateProductOutput> {
  authorize(context.session, 'admin');
  const input = validate(UpdateProductInputSchema, rawInput);
  const { id, ...fields } = input;
  const existing = await context.repository.findById(id);
  if (!existing) throw new NotFoundError('商品が見つかりません');
  const patch: Partial<Omit<typeof existing, 'id' | 'createdAt' | 'updatedAt'>> = {};
  if (fields.name !== undefined) patch.name = fields.name;
  if (fields.price !== undefined) patch.price = fields.price;
  if (fields.description !== undefined) patch.description = fields.description;
  if (fields.imageUrl !== undefined) patch.imageUrl = fields.imageUrl || undefined;
  if (fields.stock !== undefined) patch.stock = fields.stock;
  return context.repository.update(id, patch);
}

export async function updateProductStatus(rawInput: unknown, context: ProductsContext): Promise<UpdateProductStatusOutput> {
  authorize(context.session, 'admin');
  const input = validate(UpdateProductStatusInputSchema, rawInput);
  const existing = await context.repository.findById(input.id);
  if (!existing) throw new NotFoundError('商品が見つかりません');
  return context.repository.updateStatus(input.id, input.status);
}

export async function deleteProduct(rawInput: unknown, context: ProductsContext): Promise<DeleteProductOutput> {
  authorize(context.session, 'admin');
  const input = validate(DeleteProductInputSchema, rawInput);
  const existing = await context.repository.findById(input.id);
  if (!existing) throw new NotFoundError('商品が見つかりません');
  await context.repository.delete(input.id);
  return { success: true };
}
