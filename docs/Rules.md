# Agent Manager Rules & Guidelines

## Start of Conversation Prompt
When starting a new conversation, please copy and paste the following prompt to ensure the Agent Manager follows the project rules:

> 会話を開始する前に、必ず `docs/Rules.md` を読んで、プロジェクトの仕様書更新ルールを確認してください。

---

## Specification Update Rules (仕様書更新ルール)

Agent Managerが仕様書を修正・更新する場合は、以下の命名規則に従ってください。

1.  **バージョン番号のインクリメント**: ファイル名末尾の数字を増やします（例: v12 -> v13）。
2.  **'r' の付与**: バージョン番号の後に `r` を追加して、Agent Managerによる改訂であることを示します。ただし、すでに'r'がある場合重ねて追加はしない。
    *   例: 現在が `MBBTester仕様v12.md` の場合 → `MBBTester仕様v13r.md`
    *   例: 現在が `MBBTester仕様v13r.md` の場合 → `MBBTester仕様v14r.md`
3.  **新規ファイル保存**: 既存のファイルを上書きせず、必ず新しいファイル名で保存してください。
