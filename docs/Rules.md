# Antigravity 開発運用ルール

このプロジェクトの開発においては、以下のルールを厳守してください。

## 1. 言語設定
- **全て日本語で記述する**:
    - コミットメッセージ
    - 実装計画 (Implementation Plan)
    - コード内のコメント
    - ドキュメント
    - ユーザーとの対話

## 2. Git運用
- **Push前のAuthor確認**: 
    - `git push` を行う前に、必ず `git log` 等でコミットのAuthorを確認すること。
    - `yasabihhagure` 以外のユーザー（例: `Naoyuki Shiba` 等）によるコミットが含まれていないかチェックする。
    - 意図しないAuthorが含まれている場合は、Pushを取りやめて修正する。
- **Push時は必ずDeploy**:
    - `git push` を行ってリモートを更新した際は、必ず直後に `npm run deploy` を実行し、GitHub Pages (公開環境) も最新の状態に保つこと。

## 3. 実装・設計
- **実装計画の作成**: 作成・修正前に必ず実装計画(Implementation Plan)を作成し、ユーザーの合意を得てから実装に移ること。
