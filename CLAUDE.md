# speckit-demo Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-27

## Active Technologies
- TypeScript 5 (strict mode) + Next.js 14 (App Router) + React 18 + Zod（バリデーション）, Tailwind CSS 3 (002-cart-manage)
- インメモリ（createStore / globalThis、HMR 対応） (002-cart-manage)
- TypeScript 5 (strict mode) + React 18 + Next.js 14 (App Router), Zod, Tailwind CSS 3 (003-order-manage)
- インメモリストア（`src/infrastructure/store.ts`・HMR 対応） (003-order-manage)
- TypeScript 5 (strict mode) + Next.js 14 (App Router), React 18, Zod（バリデーション）, Tailwind CSS 3 (004-product-manage)
- In-memory Map（既存 `createStore()` パターン） (004-product-manage)

- TypeScript 5 (strict mode) + Next.js 14 (App Router), React 18, Tailwind CSS 3, Zod (001-catalog-browse)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5 (strict mode): Follow standard conventions

## Recent Changes
- 004-product-manage: Added TypeScript 5 (strict mode) + Next.js 14 (App Router), React 18, Zod（バリデーション）, Tailwind CSS 3
- 003-order-manage: Added TypeScript 5 (strict mode) + React 18 + Next.js 14 (App Router), Zod, Tailwind CSS 3
- 002-cart-manage: Added TypeScript 5 (strict mode) + Next.js 14 (App Router) + React 18 + Zod（バリデーション）, Tailwind CSS 3


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
