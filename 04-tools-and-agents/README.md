# 第4篇：从会说到会做 —— LangChain Tool + Agent + ReAct 循环实战

## 本篇目标

学会用 `tool()` + Zod 定义 AI 可调用的外部能力，手写一遍 ReAct 循环看清原理，再用 `createReactAgent` 三行拿到同样的能力。

## 前置条件

- 已完成第 2-3 篇（Prompt 模板、Chain 组合）
- Node.js >= 20

## 快速运行

```bash
cd 04-tools-and-agents/
cp .env.example .env
# 编辑 .env，填入 API Key
npm install

npm run tool     # Demo 1：定义工具 + 直接调用（不消耗 token）
npm run react    # Demo 2：手写 ReAct 循环，看清每一圈决策
npm run agent    # Demo 3：createReactAgent 一行搞定
```

## 代码结构

```
src/
├── tools.mjs           # 三个机房运维工具（Demo 2/3 共用）
├── define-tool.mjs     # Demo 1：工具本体
├── manual-react.mjs    # Demo 2：手写 Agent 循环
└── react-agent.mjs     # Demo 3：预构建 Agent
```

## 延伸阅读

→ [第 3 篇：从单条 Prompt 到多步流水线](../03-chain-and-lcel/)
