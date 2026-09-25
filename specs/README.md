# スペック作成ガイド

1スペック = 1つのユーザー向け機能、または1つの技術的リスク検証。

各スペックには以下を含める：

- 目的
- スコープ / 非スコープ
- セキュリティに関する注記
- 受け入れ条件
- テストシナリオ
- ロールバック時の注記

BookForge固有のプロダクト用語は使用しない。BookForgeはドキュメント構成の参考例としてのみ参照している。

## スペック一覧

| Spec | 対象 |
|---|---|
| `M0_pdf_xserver_probe.md` | PDF生成、静的配備、PWA |
| `M1_resume_input.md` | 履歴書入力、住所検索、入力整形 |
| `M2_photo_upload.md` | 履歴書写真 |
| `M3_save_load_project.md` | JSON保存・読込 |
| `M4_resume_pdf_output.md` | A4/A3履歴書PDF、A3背景表示 |
| `M5_application_type.md` | 一般応募・障害者雇用応募 |
| `M6_accommodation_sheet.md` | 配慮事項シート |
| `M7_accessibility_hardening.md` | アクセシビリティ |
| `M8_keyboard_navigation.md` | Enter・矢印キーナビゲーション |
| `M9_refactoring_hardening.md` | 全体リファクタリングと回帰防止 |
| `M10_integrity_audit_hardening.md` | 第2次整合性監査と品質基盤強化 |
| `M11_integrity_audit_remediation.md` | 第3次全体整合性監査の是正 |
| `M12_security_assessment.md` | ローカル脆弱性診断・ペネトレーションテスト |
| `M13_license_copyright_audit.md` | ライセンス・著作権・外部API利用条件の監査 |
