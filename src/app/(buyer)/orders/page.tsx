import { OrderList } from '@/domains/orders/ui';

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <OrderList />
    </div>
  );
}
