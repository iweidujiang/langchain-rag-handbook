import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import "dotenv/config";

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL || "deepseek-flash",
  temperature: 0.7,
});

const response = await model.invoke([
  new SystemMessage("你是一个友好的 AI 助手，回答简洁明了。"),
  new HumanMessage("用一句话解释什么是大语言模型"),
]);

console.log("AI 回复：");
console.log(response.content);
