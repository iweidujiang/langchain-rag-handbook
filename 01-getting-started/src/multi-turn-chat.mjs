import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { createInterface } from "readline";
import "dotenv/config";

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL || "deepseek-chat",
  temperature: 0.7,
});

const systemMessage = new SystemMessage(
  "你是一个友好的 AI 助手，回答简洁明了。如果用户的问题不清晰，请主动追问。"
);

// 对话历史：初始只包含系统消息
const chatHistory = [systemMessage];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("=== 多轮对话机器人 ===");
console.log('输入 "quit" 或 "exit" 退出\n');

const chat = async () => {
  rl.question("你: ", async (input) => {
    if (input.toLowerCase() === "quit" || input.toLowerCase() === "exit") {
      console.log("再见！");
      rl.close();
      return;
    }

    // 将用户输入加入历史
    chatHistory.push(new HumanMessage(input));

    // 调用模型，传入完整对话历史
    const response = await model.invoke(chatHistory);

    // 将 AI 回复加入历史
    chatHistory.push(new AIMessage(response.content));

    console.log(`\nAI: ${response.content}\n`);
    chat();
  });
};

chat();
