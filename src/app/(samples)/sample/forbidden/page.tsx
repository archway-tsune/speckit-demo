import { Forbidden } from '@/components/auth/Forbidden';

export default function ForbiddenPage() {
  return (
    <Forbidden
      title="403"
      message="権限がありません"
      redirectUrl="/sample"
      redirectLabel="ホームに戻る"
    />
  );
}
