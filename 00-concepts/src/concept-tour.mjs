import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  PromptTemplate,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import "dotenv/config";

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL || "deepseek-chat",
  temperature: 0,
});

// ============================================================
// 概念 1：Prompt —— 你对 AI 说的话
// ============================================================
console.log("=== 概念 1：Prompt ===\n");

const basicResponse = await model.invoke([
  new SystemMessage("你是一个专业的技术顾问，回答控制在 50 字以内。"),
  new HumanMessage("什么是 RAG？"),
]);
console.log("Prompt 的回复：", basicResponse.content, "\n");

// ============================================================
// 概念 2：PromptTemplate —— 带变量的 Prompt
// ============================================================
console.log("=== 概念 2：PromptTemplate ===\n");

const translateTemplate = PromptTemplate.fromTemplate(
  "将以下文本翻译成{language}：\n\n{text}"
);

const formattedPrompt = await translateTemplate.invoke({
  language: "英文",
  text: "今天天气真好，适合出去走走。",
});
console.log("模板填充后的 Prompt：", formattedPrompt.value, "\n");

// ============================================================
// 概念 3：Chain —— 把多个步骤串起来
// ============================================================
console.log("=== 概念 3：Chain ===\n");

const chain = ChatPromptTemplate.fromTemplate(
  "用一句话解释什么是{topic}，目标读者是{audience}。"
)
  .pipe(model)
  .pipe(new StringOutputParser());

const chainResult = await chain.invoke({
  topic: "向量数据库",
  audience: "产品经理",
});
console.log("Chain 输出：", chainResult, "\n");

// ============================================================
// 概念 4：Tool —— 给 AI 一个外部能力
// ============================================================
console.log("=== 概念 4：Tool 定义 ===\n");

const weatherTool = tool(
  async ({ city }) => {
    // 实际场景中这里会调用天气 API
    return `${city}今天晴，25°C，适合出行`;
  },
  {
    name: "get_weather",
    description: "查询指定城市的实时天气信息",
    schema: z.object({
      city: z.string().describe("要查询天气的城市名称"),
    }),
  }
);

console.log("Tool 名称：", weatherTool.name);
console.log("Tool 描述：", weatherTool.description);
const toolResult = await weatherTool.invoke({ city: "北京" });
console.log("Tool 调用结果：", toolResult, "\n");

// ============================================================
// 概念 5：Embedding —— 把文字变成数字
// ============================================================
console.log("=== 概念 5：Embedding ===\n");

// 注意：DeepSeek 目前不提供 Embedding API，这里用模拟数据演示概念
// 实际项目中会使用 OpenAI text-embedding-3-small 或其他 Embedding 服务
console.log("（演示概念：将文本转换为语义向量）\n");

const mockVector = [0.1234, -0.5678, 0.9012, -0.3456, 0.7890, -0.2345, 0.6789, -0.0123];
console.log("文本：\"人工智能正在改变世界\"");
console.log(`Embedding 维度：1536 维（OpenAI text-embedding-3-small）`);
console.log(`前 5 个值：[${mockVector.slice(0, 5).map((v) => v.toFixed(4)).join(", ")} ...]`);
console.log("（每个数字代表文本在某个语义维度上的坐标）");
console.log("（语义相近的文本，向量值也会接近）\n");

// ============================================================
// 总结
// ============================================================
console.log("=== 概念关系 ===\n");
console.log("Prompt → 你对 AI 说的话");
console.log("  ↓ 加上变量");
console.log("PromptTemplate → 可复用的 Prompt 模板");
console.log("  ↓ 串起来");
console.log("Chain → 多步骤处理管道");
console.log("  ↓ 加上外部能力");
console.log("Tool + Agent → AI 自主选择工具完成任务");
console.log("  ↓ 加上知识检索");
console.log("Embedding + VectorDB + RAG → AI 基于你的私有数据回答问题");
console.log("  ↓ 加上流程控制");
console.log("LangGraph → 复杂工作流编排");
