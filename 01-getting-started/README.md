# 第1篇：用 10 行代码让大模型替你干活

## 本篇目标

从零搭建 LangChain 开发环境，写出第一个能对话的 CLI 机器人。

## 前置条件

- Node.js >= 20.0.0
- OpenAI API Key（或兼容接口）

## 快速运行

```bash
cd 01-getting-started/
cp .env.example .env
# 编辑 .env，填入你的 OPENAI_API_KEY
npm install

# 运行三个示例
npm run basic     # 基础对话
npm run stream    # 流式输出
npm run multi     # 多轮对话
```

## 预期输出

运行 `npm run basic` 后，终端会打印 AI 的回复内容。
运行 `npm run stream` 后，回复会逐字流式输出。
运行 `npm run multi` 后，可以连续输入多轮问题，AI 会记住上下文。

## 代码结构

```
src/
├── basic-chat.mjs       # 最简对话示例（核心 10 行）
├── streaming-chat.mjs   # 流式输出示例
└── multi-turn-chat.mjs  # 多轮对话示例
```

## 延伸阅读

→ [第2篇：别再裸写 Prompt 了](../02-prompt-and-output/)
