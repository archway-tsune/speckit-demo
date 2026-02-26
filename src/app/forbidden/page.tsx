'use client';

import { useRouter } from 'next/navigation';

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-50 px-4">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-base-900">403</h1>
        <p className="mb-6 text-lg text-base-900/60">権限がありません</p>
        <button
          onClick={() => router.back()}
          className="inline-block rounded-full bg-base-900 px-6 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-base-900/85"
        >
          前のページに戻る
        </button>
      </div>
    </div>
  );
}
