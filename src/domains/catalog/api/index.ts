/**
 * Catalog ドメイン - API スタブ実装
 * 本番実装で置き換え予定。すべての関数は NotImplementedError をスローする。
 */
import type { SessionData } from '@/foundation/auth/session';
import type {
  ProductRepository,
  GetProductsOutput,
  GetProductByIdOutput,
  CreateProductOutput,
  UpdateProductOutput,
  DeleteProductOutput,
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

export function getProducts(_rawInput: unknown, _context: CatalogContext): Promise<GetProductsOutput> {
  throw new NotImplementedError('catalog', 'getProducts');
}

export function getProductById(_rawInput: unknown, _context: CatalogContext): Promise<GetProductByIdOutput> {
  throw new NotImplementedError('catalog', 'getProductById');
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
