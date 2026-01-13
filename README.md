# 信長の黒い城 戦闘シミュレータ (NBCBattleSimulator)

『信長の黒い城』TRPGの戦闘シミュレーションを行うWebアプリケーションです。
複数のチームによる戦闘を自動実行し、勝率や生存率を算出します。

## 機能

*   **戦闘シミュレーション**: プレイヤーチーム vs NPCチームの戦闘を数千回自動実行。
*   **詳細な設定**: メンバーの装備、能力値、敵対関係を自由に設定可能。
*   **バッチ処理**: CSVファイルによる戦闘条件の一括実行（PC版のみ）。
*   **レスポンシブ対応**: スマートフォンでも結果確認や簡易実行が可能。

## 利用方法

### オンラインで利用する場合

以下のURLにアクセスしてください。

https://yasabihhagure.github.io/NBCBattleSimulator/

### ローカルで実行する場合
Node.jsが必要です。

1. リポジトリをクローンまたはダウンロード
2. 依存パッケージのインストール
   ```bash
   npm install
   ```
3. 開発サーバーの起動
   ```bash
   npm run dev
   # スマホからアクセスする場合
   npm run dev -- --host
   ```
4. ブラウザで `http://localhost:5173` にアクセス

## バッチ戦闘シミュレーションについて
画面幅が広いPC環境でのみ利用可能です。スマートフォンなどの狭い画面では機能が非表示になります。

バッチファイル実行用のサンプルファイルは `docs/バッチ戦闘サンプル.csv` にあります。戦闘条件の設定にお役立てください。

## ライセンスと権利表記 (License & Legal)

このソフトウェアは [MIT License](https://opensource.org/licenses/mit-license.php) の下で公開されています。

### MÖRK BORG Third Party License
NBCBattleSimulator is an independent production by @Yasabihhagure and is not affiliated with Ockult Örtmästare Games or Stockholm Kartell. It is published under the MÖRK BORG Third Party License.

MÖRK BORG is copyright Ockult Örtmästare Games and Stockholm Kartell.

---
**Note**: This tool deals with game mechanics and data derived from "Nobunaga's Black Castle" (Nobunaga no Kuroi Shiro), a MÖRK BORG hack.

## 免責事項

本ソフトウェアは「現状のまま」提供され、商品性、特定目的への適合性、および権利非侵害の保証を含むがこれらに限定されない、明示的または黙示的な保証を一切行いません。
本ソフトウェアの使用に起因する直接的、間接的、偶発的、特別、典型的、または結果的な損害（代替品またはサービスの調達、使用、データ、または利益の損失、または業務中断を含むがこれらに限定されない）について、作者はいかなる責任も負いません。
ご利用は自己責任でお願いいたします。

## 著作権

Copyright © 2026 Yasabihhagure All Rights Reserved.
