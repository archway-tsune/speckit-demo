/** DataView コンポーネント - 単体テスト */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataView } from '@/components/data-display/DataView';

interface TestData {
  items: string[];
}

describe('DataView', () => {
  let testData: TestData;

  beforeEach(() => {
    testData = { items: ['item1', 'item2'] };
  });

  describe('Given: isLoading=true', () => {
    describe('When: レンダリングする', () => {
      it('Then: Loading コンポーネントを表示する', () => {
        render(
          <DataView data={null} isLoading={true}>
            {(d: TestData) => <div>{d.items.join(',')}</div>}
          </DataView>
        );
        expect(screen.getByRole('status', { name: /読み込み中/i })).toBeInTheDocument();
      });

      it('Then: children は描画されない', () => {
        render(
          <DataView data={testData} isLoading={true}>
            {(d: TestData) => <div data-testid="content">{d.items.join(',')}</div>}
          </DataView>
        );
        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
      });

      it('Then: loadingMessage をカスタマイズできる', () => {
        render(
          <DataView data={null} isLoading={true} loadingMessage="商品を読み込み中...">
            {(d: TestData) => <div>{d.items.join(',')}</div>}
          </DataView>
        );
        expect(screen.getByText('商品を読み込み中...')).toBeInTheDocument();
      });
    });
  });

  describe('Given: error が設定されている', () => {
    describe('When: レンダリングする', () => {
      it('Then: Error コンポーネントを表示する', () => {
        render(
          <DataView data={null} isLoading={false} error="取得失敗">
            {(d: TestData) => <div>{d.items.join(',')}</div>}
          </DataView>
        );
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('取得失敗')).toBeInTheDocument();
      });

      it('Then: onRetry コールバックが動作する', async () => {
        const user = userEvent.setup();
        const onRetry = vi.fn();
        render(
          <DataView data={null} isLoading={false} error="取得失敗" onRetry={onRetry}>
            {(d: TestData) => <div>{d.items.join(',')}</div>}
          </DataView>
        );
        await user.click(screen.getByRole('button', { name: /再試行/i }));
        expect(onRetry).toHaveBeenCalled();
      });
    });
  });

  describe('Given: data=null + isLoading=false + error=null', () => {
    describe('When: レンダリングする', () => {
      it('Then: Loading を表示する（安全側フォールバック）', () => {
        render(
          <DataView data={null} isLoading={false}>
            {(d: TestData) => <div>{d.items.join(',')}</div>}
          </DataView>
        );
        expect(screen.getByRole('status', { name: /読み込み中/i })).toBeInTheDocument();
      });
    });
  });

  describe('Given: emptyCheck が定義されていて true を返す', () => {
    describe('When: レンダリングする', () => {
      it('Then: Empty コンポーネントを表示する', () => {
        const emptyData: TestData = { items: [] };
        render(
          <DataView
            data={emptyData}
            isLoading={false}
            emptyCheck={(d) => d.items.length === 0}
            emptyMessage="商品がありません"
          >
            {(d: TestData) => <div data-testid="content">{d.items.join(',')}</div>}
          </DataView>
        );
        expect(screen.getByRole('status', { name: /データなし/i })).toBeInTheDocument();
        expect(screen.getByText('商品がありません')).toBeInTheDocument();
        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
      });

      it('Then: emptyActionLabel と emptyOnAction が動作する', async () => {
        const user = userEvent.setup();
        const onAction = vi.fn();
        const emptyData: TestData = { items: [] };
        render(
          <DataView
            data={emptyData}
            isLoading={false}
            emptyCheck={(d) => d.items.length === 0}
            emptyActionLabel="商品を追加"
            emptyOnAction={onAction}
          >
            {(d: TestData) => <div>{d.items.join(',')}</div>}
          </DataView>
        );
        await user.click(screen.getByRole('button', { name: '商品を追加' }));
        expect(onAction).toHaveBeenCalled();
      });
    });
  });

  describe('Given: data が non-null + emptyCheck が false', () => {
    describe('When: レンダリングする', () => {
      it('Then: children に data が non-null で渡され本体が描画される', () => {
        render(
          <DataView
            data={testData}
            isLoading={false}
            emptyCheck={(d) => d.items.length === 0}
          >
            {(d: TestData) => <div data-testid="content">{d.items.join(',')}</div>}
          </DataView>
        );
        expect(screen.getByTestId('content')).toHaveTextContent('item1,item2');
      });
    });
  });

  describe('Given: emptyCheck 未指定', () => {
    describe('When: data が空配列を含むオブジェクト', () => {
      it('Then: 空チェックをスキップして children を描画する', () => {
        const emptyData: TestData = { items: [] };
        render(
          <DataView data={emptyData} isLoading={false}>
            {(d: TestData) => <div data-testid="content">items: {d.items.length}</div>}
          </DataView>
        );
        expect(screen.getByTestId('content')).toHaveTextContent('items: 0');
      });
    });
  });
});
