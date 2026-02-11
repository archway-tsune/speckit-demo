/**
 * インメモリ商品リポジトリ
 * デモ・テスト用
 *
 * 注意: Next.js開発モードではHMRによりモジュールが再読み込みされるため、
 * グローバル変数を使用してデータを保持しています。
 */
import type { Product, ProductRepository } from '@/contracts/catalog';

/**
 * 商品データ型（stock はオプショナル、初期化時に 0 で補完）
 * BASE_PRODUCTS のサンプルコード保護のため、stock を必須にしない。
 */
type ProductData = Omit<Product, 'stock'> & { stock?: number };

/**
 * ベースデータ（サンプル互換・不変）
 * サンプルテストが依存するデータセット。変更禁止。
 * 本番機能追加時は EXTENSION_PRODUCTS に追加すること。
 */
export const BASE_PRODUCTS: ProductData[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'E2Eテスト商品',
    price: 3000,
    description: 'E2Eテスト用のデモ商品です。',
    imageUrl: 'https://picsum.photos/seed/test/400/400',
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
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'レザーウォレット',
    price: 12800,
    description: '職人が一つ一つ手作りした本革財布。使い込むほど味わいが増します。',
    imageUrl: 'https://picsum.photos/seed/wallet/400/400',
    status: 'published',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'キャンバストートバッグ',
    price: 6800,
    description: '丈夫なキャンバス生地を使用したシンプルなトートバッグ。A4サイズも余裕で収納できます。',
    imageUrl: 'https://picsum.photos/seed/bag/400/400',
    status: 'published',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'ウールニット',
    price: 15800,
    description: 'メリノウール100%の上質なニット。軽くて暖かく、チクチクしません。',
    imageUrl: 'https://picsum.photos/seed/knit/400/400',
    status: 'published',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'デニムパンツ',
    price: 9800,
    description: '日本製セルビッジデニムを使用したストレートパンツ。長く愛用できる一本です。',
    imageUrl: 'https://picsum.photos/seed/denim/400/400',
    status: 'draft',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
];

/**
 * 拡張データ（本番追加分）
 * 20件の商品（published）を追加し、ページネーションテスト（12件/ページ × 3ページ以上）を可能にする。
 * バリエーション: 在庫あり17件、在庫切れ2件、画像未設定1件
 */
export const EXTENSION_PRODUCTS: ProductData[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    name: 'コットンポロシャツ',
    price: 5980,
    description: '通気性の良いコットン素材のポロシャツ。ビジネスカジュアルにも最適です。',
    imageUrl: 'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=400&h=400&fit=crop',
    stock: 25,
    status: 'published',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    name: 'リネンシャツ',
    price: 7980,
    description: 'フレンチリネン100%の涼しげなシャツ。夏の定番アイテムです。',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop',
    stock: 15,
    status: 'published',
    createdAt: new Date('2024-02-02'),
    updatedAt: new Date('2024-02-02'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    name: 'スリムチノパン',
    price: 8980,
    description: 'ストレッチの効いたスリムフィットのチノパン。オンオフ兼用で着回し力抜群。',
    imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop',
    stock: 30,
    status: 'published',
    createdAt: new Date('2024-02-03'),
    updatedAt: new Date('2024-02-03'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    name: 'オーガニックコットンパーカー',
    price: 9800,
    description: 'オーガニックコットンを使用した肌にやさしいパーカー。リラックスタイムに最適。',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
    stock: 20,
    status: 'published',
    createdAt: new Date('2024-02-04'),
    updatedAt: new Date('2024-02-04'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440014',
    name: 'シルクスカーフ',
    price: 6500,
    description: '上品な光沢のシルクスカーフ。首元のアクセントに。',
    imageUrl: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&h=400&fit=crop',
    stock: 10,
    status: 'published',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440015',
    name: 'レザーベルト',
    price: 4500,
    description: 'イタリアンレザーを使用したシンプルなベルト。ビジネスにもカジュアルにも。',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    stock: 40,
    status: 'published',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440016',
    name: 'カシミヤマフラー',
    price: 18000,
    description: '最高級カシミヤ100%のマフラー。軽くて暖かい冬の必需品です。',
    imageUrl: 'https://images.unsplash.com/photo-1457545195570-67f207084966?w=400&h=400&fit=crop',
    stock: 8,
    status: 'published',
    createdAt: new Date('2024-02-07'),
    updatedAt: new Date('2024-02-07'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440017',
    name: 'デニムジャケット',
    price: 14800,
    description: 'ヴィンテージ加工を施したデニムジャケット。一枚あると重宝する万能アウターです。',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
    stock: 12,
    status: 'published',
    createdAt: new Date('2024-02-08'),
    updatedAt: new Date('2024-02-08'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440018',
    name: 'キャンバススニーカー',
    price: 11800,
    description: '軽量キャンバス素材のスニーカー。デイリーユースに最適な快適さ。',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    stock: 50,
    status: 'published',
    createdAt: new Date('2024-02-09'),
    updatedAt: new Date('2024-02-09'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440019',
    name: 'クラシックサングラス',
    price: 8500,
    description: 'UV400カットのクラシックデザインサングラス。ドライブやアウトドアに。',
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
    stock: 35,
    status: 'published',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440020',
    name: 'ボーダーTシャツ',
    price: 3980,
    description: 'マリンテイストのボーダーTシャツ。爽やかな印象のカジュアルスタイルに。',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop',
    stock: 0,
    status: 'published',
    createdAt: new Date('2024-02-11'),
    updatedAt: new Date('2024-02-11'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440021',
    name: 'ウールチェスターコート',
    price: 29800,
    description: '上質なウール混紡のチェスターコート。寒い季節のフォーマルシーンに最適です。',
    imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=400&fit=crop',
    stock: 5,
    status: 'published',
    createdAt: new Date('2024-02-12'),
    updatedAt: new Date('2024-02-12'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440022',
    name: 'ナイロンバックパック',
    price: 7800,
    description: '軽量で丈夫なナイロン製バックパック。通勤・通学に便利なサイズ感。',
    imageUrl: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=400&h=400&fit=crop',
    stock: 22,
    status: 'published',
    createdAt: new Date('2024-02-13'),
    updatedAt: new Date('2024-02-13'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440023',
    name: 'ストローハット',
    price: 4200,
    description: '天然素材のストローハット。夏のお出かけに欠かせないアイテム。',
    imageUrl: 'https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=400&h=400&fit=crop',
    stock: 18,
    status: 'published',
    createdAt: new Date('2024-02-14'),
    updatedAt: new Date('2024-02-14'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440024',
    name: 'コットンソックス3足セット',
    price: 1980,
    description: '肌触りの良いコットンソックスのお得な3足セット。毎日の必需品。',
    imageUrl: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&h=400&fit=crop',
    stock: 100,
    status: 'published',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440025',
    name: 'レザーローファー',
    price: 19800,
    description: '上質な本革のローファー。ビジネスからカジュアルまで幅広く活躍します。',
    imageUrl: 'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=400&h=400&fit=crop',
    stock: 7,
    status: 'published',
    createdAt: new Date('2024-02-16'),
    updatedAt: new Date('2024-02-16'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440026',
    name: 'フリースジャケット',
    price: 8900,
    description: '軽量で保温性に優れたフリースジャケット。アウトドアにも普段使いにも。',
    imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&h=400&fit=crop',
    stock: 0,
    status: 'published',
    createdAt: new Date('2024-02-17'),
    updatedAt: new Date('2024-02-17'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440027',
    name: 'ビーズブレスレット',
    price: 2480,
    description: '天然石を使用したハンドメイドのビーズブレスレット。さりげないアクセントに。',
    imageUrl: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',
    stock: 45,
    status: 'published',
    createdAt: new Date('2024-02-18'),
    updatedAt: new Date('2024-02-18'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440028',
    name: 'リネンショートパンツ',
    price: 6800,
    description: '涼しげなリネン素材のショートパンツ。夏のリゾートスタイルに。',
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=400&fit=crop',
    stock: 28,
    status: 'published',
    createdAt: new Date('2024-02-19'),
    updatedAt: new Date('2024-02-19'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440029',
    name: 'キャンバスエプロン',
    price: 3500,
    description: '丈夫なキャンバス地のワークエプロン。料理やDIYに。',
    stock: 15,
    status: 'published',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
  },
];

// グローバル変数の型定義（HMR対策）
declare global {
  // eslint-disable-next-line no-var
  var __productStore: Map<string, Product> | undefined;
}

/**
 * 商品データを Product 型に変換（stock のデフォルト値を補完）
 */
function toProduct(data: ProductData): Product {
  return { ...data, stock: data.stock ?? 0 };
}

// インメモリストア
// HMR対策：グローバル変数を使用してデータを保持
function initializeProductStore(): Map<string, Product> {
  if (globalThis.__productStore) {
    return globalThis.__productStore;
  }
  const allProducts = [...BASE_PRODUCTS, ...EXTENSION_PRODUCTS].map(toProduct);
  const store = new Map<string, Product>(allProducts.map((p) => [p.id, p]));
  globalThis.__productStore = store;
  return store;
}

const products = initializeProductStore();

function generateId(): string {
  return crypto.randomUUID();
}

export const productRepository: ProductRepository = {
  async findAll(params) {
    let items = Array.from(products.values());

    if (params.status) {
      items = items.filter((p) => p.status === params.status);
    }

    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          (p.description?.toLowerCase().includes(kw) ?? false)
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

  async count(status, keyword) {
    let items = Array.from(products.values());
    if (status) {
      items = items.filter((p) => p.status === status);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          (p.description?.toLowerCase().includes(kw) ?? false)
      );
    }
    return items.length;
  },
};

// テスト用：商品ストアをリセット（サンプルデータを再投入）
export function resetProductStore(): void {
  products.clear();
  const allProducts = [...BASE_PRODUCTS, ...EXTENSION_PRODUCTS].map(toProduct);
  allProducts.forEach((p) => products.set(p.id, { ...p }));
}
