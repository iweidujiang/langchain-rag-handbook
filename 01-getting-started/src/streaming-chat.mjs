import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import "dotenv/config";

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL || "deepseek-chat",
  temperature: 0.7,
  streaming: true,
});

console.log("AI 正在思考...\n");

const stream = await model.stream([
  new SystemMessage("你是一个友好的 AI 助手，回答简洁明了。"),
  new HumanMessage("用一段话解释什么是大语言模型，以及它为什么能写代码"),
]);

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}

console.log("\n\n--- 输出完毕 ---");
