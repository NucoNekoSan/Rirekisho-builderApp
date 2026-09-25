# セキュリティ診断レポート 2026-07-16

## 結論

ローカル本番成果物に対する非破壊・低負荷診断では、Critical、High、Medium、Lowに分類する確認済み脆弱性は検出されなかった。

| 区分 | 件数 |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| Informational / Not Tested | 4 |

この結果はローカル静的SPAの診断範囲に対するものであり、公開環境や将来の変更を含む安全性を保証するものではない。

## 対象と方法

- 対象: `dist/`を配備相当ヘッダーで配信した `127.0.0.1` のChromium環境。
- 基準: OWASP Top 10のInjection、Security Misconfiguration、Vulnerable Components、Software and Data Integrity Failuresを中心に確認。
- 方法: Playwright動的試験、HTTPプローブ、入力・ファイル境界試験、静的パターン検査、npm依存監査。
- 強度: 非破壊・低負荷。実在する個人情報、外部サイトへの攻撃、DoSは使用していない。

## 成功した検証

| 領域 | 結果 | 主な確認内容 |
|---|---|---|
| HTTP・CSP | Passed | 安全ヘッダー、危険メソッド405、`unsafe-eval`禁止、インラインscript禁止 |
| 配備露出 | Passed | traversal、`package.json`、`src`、`.git`の内容を取得できない |
| 履歴書XSS | Passed | HTML・script・イベント属性がDOM実行されず、PDFタブの`opener`がnull |
| マニュアルXSS | Passed | Markdown内HTMLを文字列化し、`javascript:`リンクを実行可能URLにしない |
| PII境界 | Passed | local/session storage、IndexedDB、PWAキャッシュに模擬PIIが残らない |
| 外向き通信 | Passed | 模擬zipcloud通信は7桁郵便番号だけで、他の入力値を送信しない |
| JSON・画像 | Passed | プロトタイプ汚染を除去し、JPEGでない写真ペイロードを拒否 |
| 静的成果物 | Passed | 秘密情報らしい値、危険実行API、source map、開発ファイルの混入なし |
| 依存関係 | Passed | 開発依存込み・本番依存のみともnpm既知脆弱性0件 |

## Informational / Not Tested

### I-01 公開環境のTLS・HSTS・Apache設定

- 状態: Not Tested
- 理由: 診断対象をローカル成果物へ限定したため、HTTPS証明書、HSTS、Apacheモジュール、公開ディレクトリ権限は評価していない。
- 推奨: 公開前後に所有・許可済みURLでTLS、HSTS、実レスポンスヘッダー、ディレクトリ一覧を別途確認する。

### I-02 第三者住所検索サービス

- 状態: Not Tested
- 理由: zipcloudへの実診断は許可範囲外であり、Playwrightでは応答を模擬した。
- 推奨: 外部サービス障害時の手入力フォールバックを維持し、送信値を7桁郵便番号のみに限定する。

### I-03 Git履歴の秘密情報

- 状態: Not Tested
- 理由: ワークスペースの`.git`に有効な履歴がなく、過去コミットを走査できない。
- 推奨: 正式リポジトリ側で履歴を対象に秘密情報スキャンを実施する。

### I-04 CSPのインラインstyle許可

- 状態: Informational
- 内容: `style-src 'self' 'unsafe-inline'`を使用している。scriptのインライン実行は許可しておらず、今回の注入試験で実行経路は確認されなかった。
- 推奨: Reactの動的寸法、PDFタブのスタイル生成を外部CSSへ移せる段階でstyle CSPの縮小を再評価する。

## 実行結果

- セキュリティPlaywright: 6件成功。
- 静的セキュリティ検査: 120テキストファイル、34配備ファイルを検査して成功。
- npm audit: 開発依存込み0件、本番依存のみ0件。
- Vitest: 21ファイル、111テスト成功。
- Coverage: statements 78.32%、branches 76%、functions 73.58%、lines 80.83%。
- Playwright Chromium: 通常7件とセキュリティ6件の計13件成功。
- lint、テストコード型検査、ビルド、文書検査、配備検査、セキュリティ検査を含む `npm run check` に成功。
