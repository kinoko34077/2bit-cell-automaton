# 2bit-cell-automaton Project Overlay

このファイルは既存 `2bit-cell-automaton` に追加したKiNoTch Project Overlayの入口です。既存のHTML、JavaScript、動画資料はrootに残します。

## 概要

`2bit-cell-automaton` は、2bitセルオートマトンの挙動をブラウザで試す静的Web実験です。

- 個別情報・仕様・実装: project/
- 個別プロジェクト定義: project/project.json
- 個別仕様索引: project/docs/INDEX.md
- 現在状態: project/docs/CURRENT_STATE.md
- 共通操作: .kinotch/README_BASE.md

## 所有境界

- オートマトン規則、可視化、サンプル資料はProject側の既存実装を正本とします。
- KiNoTch Baseはrepository構造、診断、verify入口を提供します。
- 既存Web実装と競合するSurface helperは追加しません。

## 最短利用方法

```powershell
.\knt.cmd doctor
.\knt.cmd base-check
.\knt.cmd verify
```

既存の利用方法はrootのindex.htmlとJavaScriptを参照してください。
