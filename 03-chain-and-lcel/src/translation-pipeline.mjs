import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableMap, RunnablePassthrough } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

// ============================================================
// Demo 2：RunnablePassthrough —— 多步流水线「检测语言 → 翻译 → 校对」
// ============================================================

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL || "deepseek-flash",
  temperature: 0,
});

const input = {
  text: `我们的新版本把首屏加载时间从 2.4 秒降到了 0.9 秒，
主要做了三件事：接口合并、图片懒加载、以及把非首屏组件改成动态导入。
上线后跳出率下降了 18%，用户投诉基本没有了。`,
};

// ------------------------------------------------------------
// 先看反面教材：不加 Passthrough，原始输入会被上一步的输出「顶掉」
// ------------------------------------------------------------

const detectOnly = ChatPromptTemplate.fromMessages([
  [
    "system",
    "判断下面文本使用的语言，只输出语言名称（例如：中文、英文、日文），" +
      "不要任何标点或解释。\n\n文本：{text}",
  ],
])
  .pipe(model)
  .pipe(new StringOutputParser());

const brokenChain = RunnableMap.from({ language: detectOnly });
const brokenResult = await brokenChain.invoke(input);

console.log("=== 反面教材：只做一步映射，原始 text 已不在结果里 ===");
console.log(JSON.stringify(brokenResult));
console.log("结果只有 language 字段，下一步想拿原文就没料了。\n");

// ------------------------------------------------------------
// 正确做法：每一步用 RunnablePassthrough.assign 往输入对象上「追加」字段
// ------------------------------------------------------------

// 第 1 步：检测语言（AI 步）
const step1_detect = RunnablePassthrough.assign({
  language: async (i) => (await detectOnly.invoke(i)).trim(),
});

// 第 2 步：决定目标语言（纯逻辑步，不花 token）
const step2_target = RunnablePassthrough.assign({
  target: ({ language }) => (language.includes("中文") ? "英文" : "中文"),
});

// 第 3 步：翻译（AI 步）
const translateChain = ChatPromptTemplate.fromMessages([
  [
    "system",
    "你是专业技术译者。把下面这段{language}翻译成{target}，" +
      "保留所有数字、百分比和技术名词（如 API 名称、组件名），" +
      "语气与原文一致，只输出译文。",
  ],
  ["human", "{text}"],
])
  .pipe(model)
  .pipe(new StringOutputParser());

const step3_translate = RunnablePassthrough.assign({
  translated: translateChain,
});

// 第 4 步：校对（AI 步，读上一步的译文）
const polishChain = ChatPromptTemplate.fromMessages([
  [
    "system",
    "你是译文审校。检查下面这段译文是否通顺、有无漏译或术语错误，" +
      "直接给出修订后的最终译文，不要解释、不要列修改点。",
  ],
  ["human", "{translated}"],
])
  .pipe(model)
  .pipe(new StringOutputParser());

const step4_polish = RunnablePassthrough.assign({ polished: polishChain });

// 组装：四步串成一条链
const pipeline = step1_detect.pipe(step2_target).pipe(step3_translate).pipe(step4_polish);

console.log("=== 逐步执行，看数据如何累积 ===");
const after1 = await step1_detect.invoke(input);
console.log("第1步后 keys:", Object.keys(after1).join(", "));
const after2 = await step2_target.invoke(after1);
console.log("第2步后 keys:", Object.keys(after2).join(", "));
console.log();

console.log("=== 一次跑完整条链 ===");
const final = await pipeline.invoke(input);
console.log("检测结果语言：", final.language);
console.log("目标语言：    ", final.target);
console.log("初版译文：\n", final.translated);
console.log("\n校对终稿：\n", final.polished);
console.log();

console.log("=== 完整中间态（可直接落库/写日志）===");
console.log(
  JSON.stringify(
    { language: final.language, target: final.target, translated: final.translated, polished: final.polished },
    null,
    2
  )
);

// 只跑其中两步也可以：链的每一段都是独立的 Runnable
const quickTranslate = step1_detect.pipe(step2_target).pipe(step3_translate);
console.log("\n=== 复用：只要初译，跳过校对步 ===");
console.log((await quickTranslate.invoke(input)).translated);
