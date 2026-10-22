import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableBranch } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

// ============================================================
// Demo 3：RunnableBranch —— 按输入特征路由到不同子链
// ============================================================

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL || "deepseek-flash",
  temperature: 0,
});
const parser = new StringOutputParser();

// 分支 A：一句话 → 轻提示词 + 小温度，追求地道
const shortChain = ChatPromptTemplate.fromMessages([
  [
    "system",
    "把下面的中文翻译成自然的英文，可以是口语表达，只输出译文：\n\n{text}",
  ],
])
  .pipe(model)
  .pipe(parser);

// 分支 B：段落 → 结构化提示词，先拆要点再逐条翻译
const mediumChain = ChatPromptTemplate.fromMessages([
  [
    "system",
    "你是技术文档译者。请按以下要求处理这段中文：\n" +
      "1. 先在心里拆出 2-4 个要点；\n" +
      "2. 逐要点翻译成正式的英文书面语；\n" +
      "3. 保留原文中的数字与技术名词；\n" +
      "4. 只输出译文。",
  ],
  ["human", "{text}"],
])
  .pipe(model)
  .pipe(parser);

// 分支 C（兜底）：超长文本 → 本地术语表直译，不调模型
// 真实项目里这一步通常是「截断后分段翻译」或「转人工」，Demo 用一张写死的词表演示零成本兜底
const glossary = {
  上线: "go live",
  回滚: "rollback",
  灰度: "canary release",
  压测: "load testing",
  限流: "rate limiting",
};

const fallbackChain = ({ text }) => {
  const hits = Object.entries(glossary).filter(([word]) => text.includes(word));
  const note = hits.map(([word, en]) => `${word} → ${en}`).join("；");
  return `[本地术语表处理，未调用大模型｜成本 0]\n超长文本 ${text.length} 字，命中术语：${note || "无"}`;
};

// 条件函数收到的是链的完整输入，按顺序取第一个返回 true 的分支
const translator = RunnableBranch.from([
  [({ text }) => text.length <= 20, shortChain],
  [({ text }) => text.length <= 200, mediumChain],
  fallbackChain,
]);

const samples = [
  "这个功能今天上线。",
  "本次版本主要做了三件事：接口合并、图片懒加载，以及把非首屏组件改成动态导入，首屏加载时间从 2.4 秒降到了 0.9 秒。",
  // 人为拼一段超长文本，模拟整章文档
  "接口说明：本章节描述灰度发布期间的限流与回滚策略，上线前必须完成压测。".repeat(6),
];

for (const [i, text] of samples.entries()) {
  console.log(`\n=== 样例 ${i + 1}（${text.length} 字）===`);
  console.log("原文：" + text.slice(0, 50) + (text.length > 50 ? "…" : ""));
  console.log("译文：" + (await translator.invoke({ text })));
}
