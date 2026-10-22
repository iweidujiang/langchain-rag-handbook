# 第3篇：从单条 Prompt 到多步流水线 —— LangChain Chain + LCEL + Runnable

## 本篇目标

学会用 LCEL 把 Prompt、模型、解析器组合成 Chain，用 `RunnablePassthrough` 在多步之间传递数据，用 `RunnableBranch` 做条件路由。

## 前置条件

- 已完成第 1-2 篇（会用 PromptTemplate、ChatPromptTemplate）
- Node.js >= 20

## 快速运行

```bash
cd 03-chain-and-lcel/
cp .env.example .env
# 编辑 .env，填入 API Key
npm install

npm run chain      # Demo 1：第一个 Chain（pipe / | 两种写法、流式、两步链）
npm run pipeline   # Demo 2：RunnablePassthrough 多步流水线
npm run branch     # Demo 3：RunnableBranch 条件路由
```

## 代码结构

```
src/
├── first-chain.mjs           # Demo 1：Chain 基础组合
├── translation-pipeline.mjs  # Demo 2：检测语言 → 定目标 → 翻译 → 校对
└── conditional-branch.mjs    # Demo 3：按文本长度路由到不同子链
```

## 延伸阅读

→ [第 2 篇：Prompt 模板化与输出解析](../02-prompt-and-output/)
