# Rirekisho Builder Documentation Index

このプロジェクトは、就労移行支援事業所で利用者本人が履歴書を作成するためのブラウザベースWebアプリです。BookForge の内容や用語ではなく、スペック駆動開発の文書分割と受け入れ条件の粒度を参考例にしています。

## Documents

| Document | Role |
|---|---|
| `REQUIREMENTS.md` | 何を作るか、利用者、MVP成功条件、非対象 |
| `TECH_SPEC.md` | React/Vite、PDF生成、JSON保存、Xserver配備 |
| `SECURITY.md` | 個人情報、障害情報、共有PC、保存境界 |
| `UI_UX_DESIGN.md` | 本人入力、通常入力、アクセシビリティ |
| `BROWSER_STORAGE_POLICY.md` | ブラウザ保存の許可/禁止 |
| `TEST_STRATEGY.md` | PDF、写真、保存読込、開示制御の回帰テスト |
| `ROADMAP.md` | M0-M12の段階実装 |
| `REFACTORING_AUDIT.md` | 全体監査の指摘、対応内容、見送り判断 |
| `SECURITY_ASSESSMENT_2026-07-16.md` | ローカル脆弱性診断・ペネトレーションテスト結果 |
| `LICENSE_COPYRIGHT_AUDIT_2026-07-16.md` | ライセンス・著作権・外部API利用条件の監査結果 |

## Specs

`specs/README.md` のテンプレートに沿って、M0-M13を1機能1specで管理します。
