# 第2篇：别再裸写 Prompt 了

## 本篇目标

学会用 PromptTemplate 动态生成 Prompt，用 OutputParser 和 Zod Schema 让 AI 稳定输出结构化数据。

## 前置条件

- 已完成第 0-1 篇
- Node.js >= 20

## 快速运行

```bash
cd 02-prompt-and-output/
cp .env.example .env
# 编辑 .env，填入 API Key
npm install

npm run template   # PromptTemplate 变量填充
npm run chat       # ChatPromptTemplate 多消息模板
npm run extract    # 结构化信息提取（Zod Schema）
```

## 代码结构

```
src/
├── prompt-template.mjs      # Demo 1：翻译模板
├── chat-prompt.mjs          # Demo 2：多消息模板
└── structured-extract.mjs   # Demo 3：结构化提取
```

## 延伸阅读

→ [第3篇：把多个能力串起来](../03-chain-and-lcel/)
