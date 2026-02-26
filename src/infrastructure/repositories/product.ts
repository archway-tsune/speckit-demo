/**
 * インメモリ商品リポジトリ
 * デモ・テスト用
 *
 * 注意: Next.js開発モードではHMRによりモジュールが再読み込みされるため、
 * グローバル変数を使用してデータを保持しています。
 */
import type { Product } from '@/contracts/catalog';
import type { ProductRepository } from '@/contracts/catalog';
import { generateId } from '@/infrastructure/id';
import { createStore } from '@/infrastructure/store';

/**
 * 商品データ（本番用）
 * 本番機能実装時に自由に変更可能。
 */
export const PRODUCTS: Product[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'E2Eテスト商品',
    price: 3000,
    description: 'E2Eテスト用のデモ商品です。',
    imageUrl: 'https://picsum.photos/seed/e2e/400/400',
    stock: 10,
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'ミニマルTシャツ',
    price: 4980,
    description: 'シンプルで上質なコットン100%のTシャツ。どんなスタイルにも合わせやすい定番アイテムです。',
    imageUrl: 'https://picsum.photos/seed/tshirt/400/400',
    stock: 50,
    status: 'published',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'レザーウォレット',
    price: 12800,
    description: '職人が一つ一つ手作りした本革財布。使い込むほど味わいが増します。',
    imageUrl: 'https://picsum.photos/seed/wallet/400/400',
    stock: 3,
    status: 'published',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'キャンバストートバッグ',
    price: 6800,
    description: '丈夫なキャンバス生地を使用したシンプルなトートバッグ。A4サイズも余裕で収納できます。',
    imageUrl: 'https://picsum.photos/seed/bag/400/400',
    stock: 15,
    status: 'published',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'ウールニット',
    price: 15800,
    description: 'メリノウール100%の上質なニット。軽くて暖かく、チクチクしません。',
    imageUrl: 'https://picsum.photos/seed/knit/400/400',
    stock: 8,
    status: 'published',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'デニムパンツ',
    price: 9800,
    description: '日本製セルビッジデニムを使用したストレートパンツ。長く愛用できる一本です。',
    imageUrl: 'https://picsum.photos/seed/denim/400/400',
    stock: 0,
    status: 'published',
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-06'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'レザースニーカー',
    price: 18000,
    description: '上質なレザーを使用したシンプルなスニーカー。履き込むほど馴染みます。',
    imageUrl: 'https://picsum.photos/seed/sneakers/400/400',
    stock: 5,
    status: 'published',
    createdAt: new Date('2024-01-07'),
    updatedAt: new Date('2024-01-07'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'コットンシャツ',
    price: 7500,
    description: '高品質なコットンを使用した清潔感あるオックスフォードシャツ。ビジネスにもカジュアルにも。',
    imageUrl: 'https://picsum.photos/seed/shirt/400/400',
    stock: 20,
    status: 'published',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    name: 'ウールコート',
    price: 45000,
    description: 'イタリア製ウールを使用したロングコート。上品なシルエットで冬の定番アイテムです。',
    imageUrl: 'https://picsum.photos/seed/coat/400/400',
    stock: 2,
    status: 'published',
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-09'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    name: 'シルクスカーフ',
    price: 8800,
    description: '100%シルクの滑らかなスカーフ。首元や髪に巻くだけで華やかさがプラスされます。',
    imageUrl: 'https://picsum.photos/seed/scarf/400/400',
    stock: 12,
    status: 'published',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '550e8400-e29b-41d4-a716-44665544000a',
    name: 'レザーベルト',
    price: 5500,
    description: '牛革を使用した丈夫なベルト。シンプルなデザインでどんなパンツにも合わせやすい。',
    imageUrl: 'https://picsum.photos/seed/belt/400/400',
    stock: 30,
    status: 'published',
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11'),
  },
  {
    id: '550e8400-e29b-41d4-a716-44665544000b',
    name: 'キャップ',
    price: 4200,
    description: 'コットン100%のベースボールキャップ。UVカット機能付きで日差しが強い日にも活躍します。',
    imageUrl: 'https://picsum.photos/seed/cap/400/400',
    stock: 0,
    status: 'published',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '550e8400-e29b-41d4-a716-44665544000c',
    name: 'サングラス',
    price: 22000,
    description: 'イタリア製フレームのUVカットサングラス。偏光レンズで眩しい光をしっかりカットします。',
    imageUrl: 'https://picsum.photos/seed/sunglasses/400/400',
    stock: 7,
    status: 'published',
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
  {
    id: '550e8400-e29b-41d4-a716-44665544000d',
    name: '腕時計',
    price: 68000,
    description: 'スイス製ムーブメントを搭載したシンプルな腕時計。ステンレスケースで耐久性も抜群です。',
    stock: 1,
    status: 'published',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: '550e8400-e29b-41d4-a716-44665544000e',
    name: 'リネンパンツ',
    price: 11800,
    description: '上質なリネンを使用した軽やかなパンツ。通気性が高く夏にも快適に着用できます。',
    imageUrl: 'https://picsum.photos/seed/linen/400/400',
    stock: 25,
    status: 'published',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '550e8400-e29b-41d4-a716-44665544000f',
    name: '非公開ドラフト商品',
    price: 9999,
    description: 'まだ公開されていないドラフト商品です。',
    imageUrl: 'https://picsum.photos/seed/draft/400/400',
    stock: 0,
    status: 'draft',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
];

// インメモリストア（HMR 対応: createStore で globalThis に保持）
const products = createStore<Product>('products', () =>
  new Map(PRODUCTS.map((p) => [p.id, p]))
);

export const productRepository: ProductRepository = {
  async findAll(params) {
    let items = Array.from(products.values());

    if (params.status) {
      items = items.filter((p) => p.status === params.status);
    }

    if (params.query) {
      const q = params.query.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false)
      );
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return items.slice(params.offset, params.offset + params.limit);
  },

  async findById(id) {
    return products.get(id) || null;
  },

  async create(data) {
    const now = new Date();
    const product: Product = {
      id: generateId(),
      name: data.name,
      price: data.price,
      description: data.description,
      imageUrl: data.imageUrl,
      stock: data.stock ?? 0,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    };
    products.set(product.id, product);
    return product;
  },

  async update(id, data) {
    const existing = products.get(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    const updated: Product = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      ),
      updatedAt: new Date(),
    };
    products.set(id, updated);
    return updated;
  },

  async delete(id) {
    products.delete(id);
  },

  async count(status, query) {
    let items = Array.from(products.values());
    if (status) {
      items = items.filter((p) => p.status === status);
    }
    if (query) {
      const q = query.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return items.length;
  },
};

// テスト用：商品ストアをリセット（サンプルデータを再投入）
export function resetProductStore(): void {
  products.clear();
  PRODUCTS.forEach((p) => products.set(p.id, { ...p }));
}
