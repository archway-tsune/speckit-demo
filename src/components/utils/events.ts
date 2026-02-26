/**
 * UI イベントユーティリティ
 */

/**
 * カート更新イベントを発火する
 * BuyerLayout のリスナーがカートアイコン数を更新する
 */
export function emitCartUpdated(): void {
  window.dispatchEvent(new CustomEvent('cart-updated'));
}
