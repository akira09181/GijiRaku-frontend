# マチボイス Web

Next.js App Router、TypeScript、Tailwind CSSで構成したマチボイスのフロントエンドです。

## ルート構成

```text
app/
├── (b2c)/                  # 市民向けレイアウト
│   └── page.tsx            # /
├── (b2b)/pro/              # 行政・法人向けレイアウト
│   ├── page.tsx            # /pro（導入LP）
│   ├── dashboard/          # /pro/dashboard（複数議会トレンド）
│   └── analytics/          # /pro/analytics（議会別・市民回答分析）
└── api/pro/leads/route.ts  # 導入相談BFF
```

旧 `/b2b-dashboard` は互換性のため `/pro/dashboard` へ恒久リダイレクトします。

## 環境変数

```text
API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

`API_BASE_URL` はServer ActionとRoute Handlerが使用します。ブラウザから呼ぶ既存B2C APIには
`NEXT_PUBLIC_API_BASE_URL` を使用します。本番では両方を同じFastAPI URLへ設定してください。

### 低コスト運用（Firebase Spark 無料枠）

既定では Firestore 読取を抑える設定です。

- 議題一覧のリアクション先読み: 無効（詳細モーダル内のみ）
- 市民回答件数: 表示中のカードだけ取得（最大2並列）
- 通知件数: 「マイフォロー」を開いたときだけ取得

任意で有効化:

```text
NEXT_PUBLIC_ENABLE_LIST_REACTIONS=1
NEXT_PUBLIC_SKIP_CITIZEN_ANSWER_COUNTS=1
```

バックエンド側は `GIJIRAKU_PREFER_MEMORY_STORE=1` を Render に設定してください（API README 参照）。

## 開発と検証

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

E2Eでは `tests/fixtures/pro-api-server.mjs` を自動起動し、Pro向けServer Actionの成功、0件、
不正レスポンスを外部環境に依存せず検証します。
