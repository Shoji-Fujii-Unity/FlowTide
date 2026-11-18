# 🌊 FLOWTIDE

> 同色を結んで盤面を埋め尽くせ / Connect matching colors, fill the board!

[🇯🇵 日本語](#-日本語) · [🇬🇧 English](#-english) · [🇰🇷 한국어](#-한국어) · [🇨🇳 中文](#-中文)

---

## 🇯🇵 日本語

### 概要
**FLOWTIDE** は、盤面の上で同じ色の端点同士をパスで繋ぎ、グリッドの全マスを埋め尽くす思考系パズルです。キャンペーン、デイリー、禅モードに対応し、スマホでもPCでも遊べます。

### 遊び方
1. 同色の端点（白いリング付きの丸いドット）からドラッグ／スワイプを開始します。
2. 隣り合うマスへパスを伸ばし、もう一方の同色端点まで繋ぎます。
3. すべてのペアが接続し、かつ盤面の全マスを埋めると勝利です。

### 操作
- **スマホ**: タップ＆ドラッグ／スワイプ
- **PC**: マウス押し下げ＆移動（既存パスをタップで消去）
- **キーボード**: 矢印キーでカーソル移動、`Space` で描画開始・終了、`U` で戻す、`H` でヒント、`R` でリセット

### 💡 ヒントボタン
詰まったときは「ヒント」で未接続のパスを1本ずつ盤面に表示できます。ヒントを使ったレベルは星の評価が下がります。キャンペーンでは最大3回、禅モードでは無制限です。

### スコア
キャンペーンでは手数・時間・盤面サイズ・ヒント使用回数からスコアを算出し、星と最高記録を更新します。デイリーでは連続日数と最高スコア、禅モードではクリア数を記録します。

### 機能
- 🎵 サウンド On/Off（Web Audio API で合成音）
- 🌐 多言語対応（日本語 / English / 한국어 / 中文）
- 💾 ハイスコア・完了レベル・中断データをローカル保存（localStorage）
- ↩️ 操作の取り消し、リセット、新しい盤面生成
- ♿ 色覚サポート（端点に文字を表示）
- 🧱 壁と障害物付きの完全解法保証済み盤面生成
- 🎮 キーボード操作対応
- 📱 PC／スマホ両対応

### 技術スタック
HTML / CSS / JavaScript（フレームワーク不使用）・SVG・Web Audio API・ローカル生成アルゴリズム
ライブラリー：GSAP、canvas-confetti、Google Fonts（CDN）

---

## 🇬🇧 English

### Overview
**FLOWTIDE** is a logic puzzle where you connect matching colored endpoints with paths and fill every cell on the grid. It offers Campaign, Daily Tide, and Zen modes on both mobile and desktop.

### How to play
1. Start dragging from a colored endpoint (the round dot with a white ring).
2. Extend the path across adjacent cells until it reaches the matching endpoint.
3. Win by connecting all pairs **and** filling every cell on the board.

### Controls
- **Mobile**: tap & drag / swipe
- **Desktop**: mouse press & move (tap an existing path to erase it)
- **Keyboard**: arrow keys to move the cursor, `Space` to start/stop drawing, `U` to undo, `H` for a hint, `R` to reset

### 💡 Hint button
Stuck? Use a hint to reveal one unconnected path at a time. Campaign hints reduce the star rating; hints are limited to 3 per campaign board and unlimited in Zen mode.

### Scoring
Campaign scores are calculated from moves, time, board size, and hints used, then update stars and high scores. Daily mode tracks streaks and the best score; Zen mode tracks solved boards.

### Features
- 🎵 Sound On/Off (synthesized via Web Audio API)
- 🌐 Multilingual (Japanese / English / Korean / Chinese)
- 💾 High scores, completed levels, and resume data saved locally (localStorage)
- ↩️ Undo, reset, and fresh-board generation
- ♿ Color-blind support with letters on endpoints
- 🧱 Wall-aware, guaranteed-solvable board generation
- 🎮 Keyboard controls
- 📱 Works on PC and mobile

### Tech stack
HTML / CSS / JavaScript (no framework) · SVG · Web Audio API · local puzzle generator

Libraries: GSAP, canvas-confetti, and Google Fonts (CDN)

---

## 🇰🇷 한국어

### 개요
**FLOWTIDE**는 같은 색 끝점을 경로로 연결하고 판의 모든 칸을 채우는 퍼즐입니다. 캠페인, 데일리 타이드, 선 모드를 지원하며 스마트폰과 PC에서 모두 즐길 수 있습니다.

### 플레이 방법
1. 같은 색 끝점(둥근 도트)에서 드래그/스와입을 시작합니다.
2. 인접한 칸으로 경로를 늘려 반대편 같은 색 끝점까지 연결합니다.
3. 모든 쌍이 연결되고 판의 모든 칸을 채우면 승리합니다.

### 조작
- **모바일**: 탭 & 드래그 / 스와입
- **PC**: 마우스 누르기 & 이동 (기존 경로를 탭하면 지워짐)
- **키보드**: 화살표 키로 커서 이동, `Space`로 그리기 시작/종료, `U`로 되돌리기, `H`로 힌트, `R`로 초기화

### 💡 힌트 버튼
막혔을 때 힌트를 사용하면 미완성 경로를 한 번에 하나씩 표시할 수 있습니다. 힌트를 사용한 캠페인 레벨은 별 등급이 낮아집니다. 캠페인에서는 최대 3회, 선 모드에서는 무제한으로 사용할 수 있습니다.

### 점수
캠페인 점수는 이동 수, 시간, 판 크기, 힌트 사용 횟수로 계산되어 별과 최고 기록을 갱신합니다. 데일리 모드는 연속 일수와 최고 점수를, 선 모드는 해결한 판 수를 기록합니다.

### 기능
- 🎵 사운드 On/Off (Web Audio API 합성음)
- 🌐 다국어 지원 (일본어 / 영어 / 한국어 / 중국어)
- 💾 최고 점수·완료 레벨·이어하기 데이터를 로컬에 저장 (localStorage)
- ↩️ 되돌리기, 초기화, 새 판 생성
- ♿ 끝점에 문자를 표시하는 색각 보조
- 🧱 벽을 고려한 완전 해법 보장형 판 생성
- 🎮 키보드 조작
- 📱 PC/모바일 모두 지원

### 기술 스택
HTML / CSS / JavaScript (프레임워크 없음) · SVG · Web Audio API · 로컬 퍼즐 생성기

라이브러리: GSAP, canvas-confetti, Google Fonts(CDN)

---

## 🇨🇳 中文

### 概述
**FLOWTIDE** 是一款逻辑益智游戏：用路径连接相同颜色的端点，填满棋盘上的每一个格子。提供闯关、每日挑战和禅模式，支持手机和电脑游玩。

### 玩法
1. 从同色端点（圆点）开始拖动/滑动。
2. 将路径延伸到相邻格子，直到连接到另一个同色端点。
3. 所有配对均已连接 **并且** 填满全部格子即可获胜。

### 操作
- **手机**: 点按并拖动 / 滑动
- **电脑**: 按住鼠标移动（点按已有路径可将其擦除）
- **键盘**：方向键移动光标，`Space` 开始/结束绘制，`U` 撤销，`H` 使用提示，`R` 重置

### 💡 提示按钮
卡住了？可以使用提示，每次在棋盘上展示一条尚未连接的路径。闯关中使用提示会降低星级；闯关棋盘最多可用提示 3 次，禅模式不限制。

### 计分
闯关得分根据步数、时间、棋盘大小和提示次数计算，并更新星级与最高记录。每日模式记录连续天数与最高分，禅模式记录已解棋盘数。

### 特性
- 🎵 音效开/关（Web Audio API 合成音）
- 🌐 多语言（日语 / 英语 / 韩语 / 中文）
- 💾 最高分数、完成关卡与续玩数据本地保存（localStorage）
- ↩️ 撤销、重置与生成新棋盘
- ♿ 色觉辅助：在端点显示字母
- 🧱 耗虑障碍墙并保证存在完整解法的棋盘生成
- 🎮 键盘操作
- 📱 PC / 手机均支持

### 技术栈
HTML / CSS / JavaScript（无框架）· SVG · Web Audio API · 本地棋盘生成器

第三方库：GSAP、canvas-confetti、Google Fonts（CDN）


