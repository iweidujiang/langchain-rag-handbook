import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tools } from "./tools.mjs";
import "dotenv/config";

// ============================================================
// Demo 3：createReactAgent —— 三行代码拿到 Demo 2 手写的那套循环
// ============================================================

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL || "deepseek-flash",
  temperature: 0,
});

const SYSTEM_PROMPT = `你是省级网管中心的运维助手。必须遵守：
1. 涉及告警数量、带宽利用率、当前时间这类实时数据，一律调用工具获取，禁止凭记忆编造；
2. 工具返回里没有的信息，直接回答「不知道」；
3. 拿到工具结果后，用简洁中文回答，不要把原始 JSON 丢给用户。`;

const agent = createReactAgent({
  llm: model,
  tools,
  prompt: SYSTEM_PROMPT,
});

const question = "合肥核心机房和芜湖接入机房哪个更严重？另外看下「合肥-南京 100G 骨干」这条链路堵不堵。";

console.log("问题：" + question);
console.log("（Agent 会自己决定调用哪几个工具、调几次）\n");

const result = await agent.invoke({ messages: [new HumanMessage(question)] });

// ------------------------------------------------------------
// 完整轨迹：把每一条消息还原出来，这就是 Agent 的「黑盒透视」
// ------------------------------------------------------------

console.log("=== 执行轨迹 ===");
let toolCalls = 0;
for (const msg of result.messages) {
  if (msg instanceof AIMessage) {
    if (msg.tool_calls?.length) {
      for (const call of msg.tool_calls) {
        toolCalls += 1;
        console.log(`AI → 请求调用工具：${call.name}(${JSON.stringify(call.args)})`);
      }
      if (msg.content) console.log(`AI 同时说了话：${msg.content}`);
    } else {
      console.log("AI → 给出最终回答");
    }
  } else if (msg instanceof ToolMessage) {
    console.log(`工具 ${msg.name} 返回：${String(msg.content).slice(0, 80)}`);
  } else if (msg instanceof HumanMessage) {
    console.log("人类提问");
  }
}

console.log(`\n共 ${result.messages.length} 条消息、${toolCalls} 次工具调用`);

console.log("\n=== 最终回答 ===");
console.log(result.messages.at(-1).content);

// ------------------------------------------------------------
// 流式看进度：streamMode: "values" 每完成一个节点吐一次全量状态
// ------------------------------------------------------------

console.log("\n=== 流式观察每一步 ===");
const stream = await agent.stream(
  { messages: [new HumanMessage("现在几点了？")] },
  { streamMode: "values" }
);

let step = 0;
for await (const state of stream) {
  step += 1;
  const last = state.messages.at(-1);
  const label =
    last instanceof AIMessage && last.tool_calls?.length
      ? `请求调用 ${last.tool_calls.map((c) => c.name).join(", ")}`
      : last instanceof ToolMessage
        ? `${last.name} 的结果已回填`
        : "生成回答";
  console.log(`第 ${step} 步（消息数 ${state.messages.length}）：${label}`);
}
