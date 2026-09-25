# リファクタリング監査と対応記録

## 概要

2026-07-15 にプロジェクト全体を監査した。初回監査では Bug 1件、High 8件、Medium 10件、Low 9件の計28件を抽出した。本書は、監査後に実施した変更と、意図的に見送った変更を記録する。

## 対応済み

### Bug

- `App.css` の `--resume-header-bg` 自己参照を実色値へ修正した。

### High

- `FormFields.tsx` と `EditableRows.tsx` を `App.tsx` から分離した。
- コアデータ更新、基本情報検証、行操作、文字揃え更新を `useResumeEditor.ts` へ分離した。
- 常に真だった `visibleSections` の7つのガードを削除した。
- 履歴書と配慮事項のページ生成処理を共通ページビルダーへ統合した。
- A4/A3履歴書で重複していた履歴分割とセクション準備を共通化した。
- 印刷レイアウト、保存ファイル検証、入力形式の未命名数値を名前付き定数へ置き換えた。
- 郵便番号、電話番号、住所検索の重複エラーメッセージを定数化した。

### Medium / Low

- 読込、全消去、デモ適用時の一時UI状態リセットを共通化した。
- `PdfPages.tsx` の文字揃え取得を `alignment.ts` の実装へ統一した。
- 学歴・職歴行と免許・資格行の共通構造を `DatedEntry` に統合した。
- 配慮事項の機微項目抽出を定義配列ベースへ変更した。
- Blobダウンロード処理と写真データ生成処理の重複を削除した。
- 未使用の `.resume-text-grid` CSSと、スタイルを持たない `.textarea-field` クラス参照を削除した。
- `body` の重複した `margin: 0` を `index.css` 側へ一本化した。
- 郵便番号フックの冗長条件を削除し、桁数定数を共有した。
- キーボードナビゲーションのイベントハンドラを `useCallback` で安定化した。
- 内部専用の補助型とコンポーネントから不要な `export` を外した。
- `.gitignore` に `coverage/` と汎用 `*.log` を追加した。
- `alignment`、`textNormalize`、`validation`、`useGridKeyboardNav` の専用テストを追加した。

## 維持した項目

- `buildProjectFile` と一部の設定値はテストから直接検証しているため、公開状態を維持した。
- `.print-empty-row` はCSS装飾を持たないが、印刷用空行の識別とテスト選択に使用しているため維持した。
- `normalizePostalCode` は処理自体は薄いが、住所検索ドメインの意図を示す名前として維持した。
- `TextField` と `TextArea` は構造が似ているが、propsとHTML要素の差を明示する方が保守しやすいため統合しなかった。

## 見送り

- `App.css` のファイル分割は、UI、プレビュー、A4/A3印刷、レスポンシブ規則が相互に依存し、視覚回帰範囲が大きい。PDF実機比較の基準画像を用意してから別作業として実施する。
- `PreviewPanel` と `OutputPanel` のpropsオブジェクト化は、現状1階層のみであり、変更量に対する効果が小さいため見送った。
- `photoLoader.ts` のCanvas処理テストはブラウザAPIの詳細なモックが必要なため、今回の純粋関数テスト追加とは分離する。

## 検証

- `npm run test`: M9完了時点で16ファイル、91テスト成功
- `npm run lint`: 成功
- `npm run build`: 成功

## 第2次整合性監査（M10）

2026-07-15に初回リファクタリング後の本番配備、保存境界、品質ゲートを再監査した。

### 確認した問題

- High: 公開マニュアルのインラインJavaScriptが本番CSPの `script-src 'self'` で停止する。
- High: PDF生成完了後に `window.open` しており、処理時間によってユーザー操作のポップアップ許可が失効する。
- Medium: JSON読込が `includePhoto` を形式確認するだけで、`includeAccommodation` と実データの整合を強制していない。
- Medium: 写真容量を申告メタデータだけで判断し、Base64実サイズを検証していない。
- Medium: テストファイルがTypeScriptビルド対象外で、判別共用体とモックに型エラーが残っていた。
- Medium: V8カバレッジ設定は存在したが、実行依存がなく `--coverage` が失敗していた。
- Medium: マニュアルMarkdownがService Workerのプリキャッシュ対象外で、オフライン時に本文を読めなかった。
- Low: 配備HTMLとCSP、Service Worker、`.htaccess` の自動整合性検査がなかった。
- Low: Vite、Vitest、oxlint等に互換範囲内の更新があった。

### 対応

- マニュアルJavaScriptを外部化し、CSPを緩和せず全章をオフラインキャッシュへ追加した。
- PDF表示タブをクリック処理中に開き、生成完了後にBlob iframeを設定する順序へ変更した。
- JSON包含フラグを安全側に正規化し、一般応募の配慮事項、未包含写真、上限超過Base64を除外または拒否するようにした。
- テスト用TypeScript設定、V8カバレッジ閾値、配備成果物検査を追加した。
- 本番相当CSP下でChromiumを動かすPlaywright 5シナリオを追加した。
- CSPへBlobフレームの明示許可と、object/base/frame-ancestor/formの制限を追加した。
- 互換範囲内の依存を更新し、TypeScript 7への移行は見送った。

### M10検証基準

- Vitest: 20ファイル、104テスト成功
- Coverage: statements 73.8%、branches 72.71%、functions 70%、lines 75.98%
- Playwright Chromium: 5シナリオ成功
- テストコード型検査、lint、ビルド、文書検査、配備検査に成功
- 本番依存・開発依存とも既知の脆弱性0件

## 第3次全体整合性監査と是正（M11）

2026-07-16にソースコード、配備、テスト、Specs、利用者・保守文書を再監査した。

### 確認した問題

- High: A4容量見積りは3ページ以上を算出できる一方、実際の履歴書は固定2ページかつoverflow非表示で、警告と出力結果が一致しない。
- Medium: 写真アップロードとJSON読込で拡張子検証が一致せず、JSON内の実データがJPEGか確認していない。
- Medium: 郵便番号をzipcloudへ送信する実装に対し、上位文書が入力内容を外部送信しないと説明していた。
- Medium: 写真処理、A4超過停止、JSON保存・読込の実ブラウザ回帰テストが不足していた。
- Low: 公開マニュアルにlocalhostリンクと旧確認ボタン名が残っていた。

### 対応

- A4縦は2ページ固定を維持し、容量超過時は履歴書単体・配慮事項込みのPDF表示と保存を停止する。
- 写真のMIME、拡張子、容量をアップロード時に統一検証し、JSON読込時にJPEGシグネチャを追加検証する。
- zipcloudへ送信する情報を正規化済み7桁郵便番号に限定していることを上位文書へ明記する。
- 写真Canvas処理、A4出力停止、JSONダウンロード・全消去・再読込の自動テストを追加する。
- 公開／下書きマニュアルを修正し、開発用URLを文書検査で拒否する。

### M11検証基準

- Vitest: 21ファイル、111テスト成功
- Coverage: statements 78.32%、branches 76%、functions 73.58%、lines 80.83%
- `photoLoader.ts`: statements 83.33%、lines 88.4%
- Playwright Chromium: 7シナリオ成功
- テストコード型検査、lint、ビルド、文書検査、配備検査に成功
