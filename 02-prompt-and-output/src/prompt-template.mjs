import { PromptTemplate } from "@langchain/core/prompts";

// ============================================================
// Demo 1：PromptTemplate —— 带变量的 Prompt
// ============================================================

// 定义一个翻译模板，{language} 和 {text} 是变量
const translateTemplate = PromptTemplate.fromTemplate(
  `你是一个专业翻译。请将以下文本翻译成{language}，只输出翻译结果，不要解释。

文本：{text}`
);

// 填充变量，生成最终 Prompt
const prompt1 = await translateTemplate.invoke({
  language: "英文",
  text: "今天天气真好，适合出去走走。",
});
console.log("=== 翻译为英文 ===");
console.log(prompt1.value);
console.log();

// 换一组变量值，复用同一个模板
const prompt2 = await translateTemplate.invoke({
  language: "日语",
  text: "人工智能正在改变世界。",
});
console.log("=== 翻译为日语 ===");
console.log(prompt2.value);
