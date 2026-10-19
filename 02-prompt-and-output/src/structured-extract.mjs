import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import "dotenv/config";

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL || "deepseek-chat",
  temperature: 0,
});

// ============================================================
// Demo 3：结构化输出 —— 用 Zod Schema 约束 AI 输出格式
// ============================================================

// 定义期望的输出结构
const PersonSchema = z.object({
  name: z.string().describe("姓名"),
  age: z.number().describe("年龄"),
  occupation: z.string().describe("职业"),
  tags: z.array(z.string()).describe("3个标签，每个不超过4个字"),
});

// 让模型按照 Schema 输出结构化数据
const structuredModel = model.withStructuredOutput(PersonSchema);

const text = `张三今年28岁，是一名全栈工程师。他热爱开源，擅长 TypeScript 和 Rust，
目前在一家创业公司做技术负责人。工作之余喜欢跑步和摄影。`;

console.log("=== 输入文本 ===");
console.log(text);
console.log();

const result = await structuredModel.invoke(
  `从以下文本中提取人物信息，严格按要求的格式输出：\n\n${text}`
);

console.log("=== 结构化输出 ===");
console.log("姓名：", result.name);
console.log("年龄：", result.age);
console.log("职业：", result.occupation);
console.log("标签：", result.tags.join("、"));
console.log();
console.log("=== 完整 JSON ===");
console.log(JSON.stringify(result, null, 2));
