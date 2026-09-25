# Rirekisho Builder

就労移行支援事業所で、利用者本人が履歴書を作成するためのブラウザベースWebアプリです。

- リポジトリ: https://github.com/NucoNekoSan/Rirekisho-builderApp

## Features

- A4・A3履歴書PDFの表示・ダウンロード
- 一般応募 / 障害者雇用応募の応募種別
- 障害者雇用応募向けA4配慮事項シート
- JPG/JPEG履歴書写真の取り込み、切り抜き、回転、削除
- 年齢欄、日付表示形式、文字揃え設定
- JSON保存・読込
- サーバー保存なし、ブラウザストレージへの個人情報保存なし

## 技術スタック

| 技術 | 説明 |
|------|------|
| **React** | 画面を構成するUIライブラリ（入力フォームやプレビュー表示を担当） |
| **TypeScript** | JavaScriptに型チェックを追加した言語（入力ミスを防ぐ） |
| **Vite** | 開発サーバーとビルドツール（コードをブラウザで動くファイルに変換） |
| **Vitest** | テスト実行ツール（コードが正しく動くか自動チェック） |
| **jsPDF / html2canvas** | PDF生成ライブラリ（画面をPDFファイルに変換） |

## ファイル構成

```
rirekisho-builder/
├── public/               ← ビルド時にそのままコピーされるファイル
│   ├── .htaccess         ← Xサーバー用の設定（SPA対応・セキュリティヘッダー）
│   ├── favicon.svg       ← ブラウザタブのアイコン
│   └── manual/           ← 利用者向けマニュアル（HTML）
├── src/                  ← アプリのソースコード
│   ├── App.tsx           ← メイン画面（入力フォーム・プレビュー・PDF出力）
│   ├── App.css           ← 画面デザインとPDF印刷レイアウト
│   ├── components/       ← 画面の部品
│   │   ├── PdfPages.tsx  ← PDF出力用のページレイアウト（A4・A3・配慮事項）
│   │   ├── PreviewPanel.tsx ← プレビュー表示パネル
│   │   └── OutputPanel.tsx  ← PDF出力パネル
│   ├── lib/              ← ロジック・ユーティリティ
│   │   ├── defaults.ts   ← サンプルデータ定義
│   │   ├── projectFile.ts ← JSON保存・読込のバリデーション
│   │   ├── types.ts      ← データの型定義
│   │   ├── dateFormat.ts ← 日付フォーマット処理
│   │   ├── inputFormat.ts ← 電話番号・郵便番号のフォーマット
│   │   └── validation.ts ← 入力値の検証
│   ├── browser/          ← ブラウザ固有の処理
│   │   ├── pdfRenderer.ts ← PDF生成処理
│   │   ├── photoLoader.ts ← 写真読み込み
│   │   └── downloadFile.ts ← ファイルダウンロード
│   └── hooks/            ← React専用のロジック
│       └── usePostalLookup.ts ← 郵便番号検索
├── dist/                 ← ビルド結果（これをXサーバーにアップロード）
├── package.json          ← 依存パッケージとスクリプト定義
├── vite.config.ts        ← ビルド設定
└── MAINTENANCE.md        ← 運用・保守マニュアル（職員向け）
```

## Development

```powershell
npm install
npx playwright install chromium
npm run dev
```

## Verification

```powershell
npm run check
```

ローカル脆弱性診断と依存関係監査は次のコマンドで実行します。

```powershell
npm run test:security
npm run security:sca
```

## Xserver Deployment

```powershell
npm run build
```

`dist/` の中身をXserverの公開ディレクトリへアップロードします。`public/.htaccess` はビルド時に `dist/.htaccess` としてコピーされ、同じディレクトリの `index.html` へ戻すSPA fallbackと基本的な安全ヘッダーを提供します。

サブディレクトリ名をビルド時に固定したい場合は、例として次のように指定できます。

```powershell
$env:VITE_BASE_PATH="/rirekisho/"; npm run build
```

詳しい手順は [MAINTENANCE.md](MAINTENANCE.md) を参照してください。

## Privacy Boundary

履歴書本文、氏名、電話番号、写真、障害・配慮事項はサーバーへ送信しません。住所検索時だけ、正規化済みの7桁郵便番号をzipcloudへ送信します。保存が必要な場合は、利用者本人がJSONファイルとして明示的にダウンロードします。写真は既定ではJSONに含めません。一般応募の入力データには配慮事項シートの内容を含めず、障害者雇用応募のときだけ配慮事項を含めます。
