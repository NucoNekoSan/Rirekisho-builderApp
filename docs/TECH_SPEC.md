# 技術仕様

## 技術スタック

- フロントエンド: React 19 + TypeScript + Vite
- PDF生成: HTML A4縦/A3横プレビュー → html2canvas → jsPDF
- データ保存: 明示的なJSONファイルのダウンロード/アップロードのみ
- デプロイ: Xサーバーへの静的ファイル配置。Node.jsはビルド時のみ使用。
- 型チェック: TypeScript strict モード。

## データフロー

1. 利用者がブラウザのメモリ上で履歴書データを入力する。
2. 任意のJPG/JPEG写真をブラウザのcanvasで処理し、Reactのstateに保持する。
3. 利用者はJSONプロジェクトファイルとしてエクスポートできる。写真はデフォルトで除外される。配慮事項データは一般応募では除外され、障害者雇用応募の場合のみ含まれる。
4. PDF表示ではクリック処理中に生成中タブを開き、その後にA4縦またはA3横プレビューのDOMをキャプチャしてBlob iframeへ反映する。新しいタブがブロックされた場合、UIがエラーを報告し、利用者はPDFダウンロードを使用できる。
5. 履歴書本文、写真、障害・配慮事項はサーバーへ送信しない。住所検索時だけ、正規化済みの7桁郵便番号をzipcloudへ送信する。

## 写真設定

- 写真仕様は `src/lib/config.ts` に集約する。
- ファイルサイズ上限は `PHOTO_MAX_FILE_SIZE_MB`（10MB）からバイト値を導出し、バリデーション、UIメッセージ、テストで共通参照する。
- 受け入れ形式は `PHOTO_ACCEPTED_MIME_TYPES` と `PHOTO_ACCEPTED_EXTENSIONS` で定義し、JPG/JPEG（`image/jpeg`）のみとする。
- 出力は `PHOTO_ASPECT_RATIO` の3:4、幅 `PHOTO_OUTPUT_WIDTH` の900px、高さは比率から算出する。
- JPEG圧縮品質は `JPEG_QUALITY` の0.92を写真処理とPDF出力で共通参照する。
- A4縦履歴書は2ページ固定とし、容量見積りが2ページを超えた場合はPDF表示・保存を停止する。

## Xサーバーデプロイ

- ビルド: `npm run build`
- `dist/` の中身を対象の公開ディレクトリにアップロードする。
- `public/.htaccess` はビルド時に `dist/.htaccess` としてコピーされ、SPAフォールバックを提供する。
- 公開マニュアルのJavaScriptはCSPに適合する外部ファイルとして配布し、Markdown全章をPWAにプリキャッシュする。
- `scripts/serve-dist.mjs` はテスト時だけ `.htaccess` の安全ヘッダーを適用して `dist/` を配信する。
