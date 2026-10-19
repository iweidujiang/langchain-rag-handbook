import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL || "deepseek-flash",
  temperature: 0,
});

// ============================================================
// Demo 2：ChatPromptTemplate —— 多消息模板
// ============================================================

// 一次定义 System + Human 两条消息的模板
const chatTemplate = ChatPromptTemplate.fromMessages([
  ["system", "你是一个{role}，回答简洁专业，不超过100字。"],
  ["human", "{question}"],
]);

// 填充变量
const messages = await chatTemplate.invoke({
  role: "资深前端工程师",
  question: "React 和 Vue 的核心区别是什么？",
});

console.log("=== 生成的消息列表 ===");
for (const msg of messages.messages) {
  console.log(`[${msg._getType()}] ${msg.content}`);
}
console.log();

// 直接用模型调用
const response = await model.invoke(messages);
console.log("=== AI 回复 ===");
console.log(response.content);
