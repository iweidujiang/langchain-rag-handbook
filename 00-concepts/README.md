# 第0篇：AI 应用开发核心概念地图

## 本篇目标

在动手写代码之前，建立对 AI 应用开发核心概念的全局认知。理解 Prompt、Chain、Agent、RAG、Embedding 等术语到底是什么、解决什么问题、在真实产品中怎么用。

## 前置条件

- 会写 JavaScript 代码
- 对 AI / 大模型有好奇心
- （可选）有 OpenAI API Key，可以运行末尾的演示代码

## 本篇特点

这篇**不深入代码**，重点是建立心智模型。每个概念都会用生活类比 + 真实产品场景来解释。读完这篇，你会知道后续 9 篇文章分别在解决什么问题。

## 快速运行（可选）

```bash
cd 00-concepts/
cp .env.example .env
# 编辑 .env，填入 OPENAI_API_KEY
npm install
npm run demo
```

## 代码结构

```
src/
└── concept-tour.mjs    # 概念速览：用代码展示各概念长什么样
```

## 延伸阅读

→ [第1篇：用 10 行代码让大模型替你干活](../01-getting-started/)
