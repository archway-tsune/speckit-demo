'use client';

import { type ReactNode } from 'react';
import { Loading } from '../feedback/Loading';
import { Error } from '../feedback/Error';
import { Empty } from '../feedback/Empty';

export interface DataViewProps<T> {
  /** 表示データ */
  data: T | null;
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error?: string | null;
  /** データ表示の render prop（data は non-null 保証） */
  children: (data: T) => ReactNode;
  /** 空状態判定関数（省略時: 空チェックしない） */
  emptyCheck?: (data: T) => boolean;
  /** エラー時のリトライコールバック */
  onRetry?: () => void;
  /** Loading カスタムメッセージ */
  loadingMessage?: string;
  /** Empty カスタムメッセージ */
  emptyMessage?: string;
  /** Empty アクションボタンラベル */
  emptyActionLabel?: string;
  /** Empty アクションボタンコールバック */
  emptyOnAction?: () => void;
}

export function DataView<T>({
  data,
  isLoading,
  error,
  children,
  emptyCheck,
  onRetry,
  loadingMessage,
  emptyMessage,
  emptyActionLabel,
  emptyOnAction,
}: DataViewProps<T>): ReactNode {
  // 1. ローディング中
  if (isLoading) {
    return <Loading message={loadingMessage} />;
  }

  // 2. エラー
  if (error) {
    return <Error message={error} onRetry={onRetry} />;
  }

  // 3. data が null（安全側フォールバック）
  if (data === null) {
    return <Loading message={loadingMessage} />;
  }

  // 4. 空状態チェック
  if (emptyCheck && emptyCheck(data)) {
    return (
      <Empty
        message={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={emptyOnAction}
      />
    );
  }

  // 5. データ表示
  return children(data);
}
