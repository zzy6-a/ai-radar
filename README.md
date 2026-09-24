# AI 态势

实时 AI 态势面板 · 纯静态 PWA · 零后端 · 零 API Key

**在线地址：https://zzy6-a.github.io/ai-radar/**

手机浏览器打开 → 添加到主屏幕 → 图标点开全屏，与原生 App 一致。
电脑不需要常开，数据由手机自己联网拉取。

---

## 两个界面

### 📡 态势

一屏动态，顶部横向筛选条按类型切换（全部 / 新模型 / 热帖 / 开源 / 产品 / 论文）。

排序不是纯时间倒序，而是**重要度优先、同档内按时间**，并对单一来源设配额（产品 2 条、论文 3 条），避免某一类挤满首屏。

| 类型 | 图标 | 内容 | 数据源 |
|---|---|---|---|
| 新模型 | ✨ | 名称 · 厂商 · 上下文 · 输入/输出价格 | OpenRouter `/api/v1/models` |
| 价格 | 💰 | 涨跌幅（本地快照对比，≥5% 才显示） | 同上，`localStorage` 存上次快照 |
| 热帖 | 🔥 | 标题 · 分数 · 评论数 | HN Algolia API |
| 开源 | ⭐ | 仓库名 · 涨星 · 语言 · 简介 | GitHub Search API |
| 产品 | 🚀 | 名称 · 票数 · 评论数 | agents-radar 日报 |
| 论文 | 📄 | 论文标题 · 作者 · 摘要首句 | agents-radar 日报 |

单源条数上限：新模型 5 · 热帖 8 · 开源 6 · 产品 3 · 论文 3，首屏共 24 条，其余可展开。

### 🏆 模型列表

312 个模型，11 个排序维度，支持搜索模型名或厂商。

| 排序项 | 有值数 |
|---|---|
| 智能分 | 83 |
| 价值分 | 43 |
| 价格 | 312 |
| 速度 | 308 |
| 上下文 | 312 |
| 最新 | 312 |
| Arena 文本 / 代码 / 视觉 / 文档 / Agent | 10 / 19 / 26 / 36 / 10 |

竞技场（Arena）五维按需懒加载；缺值的模型排在末尾显示 `—`，不隐藏。

术语统一：`t/s` → 字/秒，`per M` → / M，上下文 `1050000` → 105万，双零价格显示为「免费」。

**性价比不单开页面** —— 它是「价值分」排序项，与智能分、价格并列。

---

## 数据源

全部免 Key、全部带 `access-control-allow-origin: *`，纯前端直连：

```
OpenRouter            https://openrouter.ai/api/v1/models
HN Algolia            https://hn.algolia.com/api/v1/search
GitHub Search         https://api.github.com/search/repositories
agents-radar 日报      https://duanyytop.github.io/agents-radar/digests/<日期>/<类型>.md
Arena 榜单             https://cdn.jsdelivr.net/gh/oolong-tea-2026/arena-ai-leaderboards@main/data/
性价比榜               https://cdn.jsdelivr.net/gh/yyh-001/llm-value-rankings@main/data/models.json
```

arXiv 与 HuggingFace 无 CORS 头，改由 agents-radar 的日报聚合后间接取得。

---

## 容错

| 机制 | 说明 |
|---|---|
| 请求重试 | 每源 3 次，400ms 指数退避 |
| 分批错开 | 6 源分 2 批启动，避免并发打满连接 |
| 本地缓存 | 每源结果存 `localStorage`，网络失败时用缓存兜底并标注「缓存」 |
| 模型数据缓存 | 328KB 的榜单 JSON 落本地，拉取失败时读缓存 |
| Service Worker | 同源页面壳缓存；跨域数据请求完全放行（不介入 CORS） |

标题栏显示 `N/6 源正常`，未满时标黄。

---

## 文件

```
index.html            全部逻辑（原生 JS，无框架无依赖）
manifest.webmanifest  PWA 声明：名称 / 图标 / standalone
sw.js                 Service Worker
icon.svg              应用图标
```

---

## 部署

已托管在 GitHub Pages，push 即更新（约 1 分钟生效）：

```bash
cd ~/projects/ai-radar
git add -A && git commit -m "..." && git push
```

## 本地预览

Service Worker 需要 https 或 localhost，直接双击 `index.html` 会丢失离线能力：

```bash
python3 -m http.server 8899
# 打开 http://127.0.0.1:8899
```
