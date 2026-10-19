import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import "dotenv/config";

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL || "deepseek-flash",
  temperature: 0,
});

// ============================================================
// Demo 3：结构化输出 —— 用 Prompt 引导 + Zod 校验
// ============================================================

// 用 Zod 定义期望的数据结构（用于校验，不依赖 function calling）
const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
  occupation: z.string(),
  tags: z.array(z.string()),
});

const text = `张三今年28岁，是一名全栈工程师。他热爱开源，擅长 TypeScript 和 Rust，
目前在一家创业公司做技术负责人。工作之余喜欢跑步和摄影。`;

console.log("=== 输入文本 ===");
console.log(text);
console.log();

// 用 Prompt 明确告诉模型输出 JSON 格式
const response = await model.invoke([
  new SystemMessage(
    `你是一个信息提取助手。请从用户提供的文本中提取人物信息，以 JSON 格式输出。
只输出 JSON，不要输出任何其他内容。

输出格式：
{
  "name": "姓名",
  "age": 数字,
  "occupation": "职业",
  "tags": ["标签1", "标签2", "标签3"]
}`
  ),
  new HumanMessage(text),
]);

// 清理模型可能添加的代码块标记
let jsonStr = response.content;
jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

// 解析 JSON
const rawResult = JSON.parse(jsonStr);

// 用 Zod 校验数据结构是否正确
const result = PersonSchema.parse(rawResult);

console.log("=== 结构化输出 ===");
console.log("姓名：", result.name);
console.log("年龄：", result.age);
console.log("职业：", result.occupation);
console.log("标签：", result.tags.join("、"));
console.log();
console.log("=== 完整 JSON ===");
console.log(JSON.stringify(result, null, 2));
