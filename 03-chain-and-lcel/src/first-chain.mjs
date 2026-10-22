import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

// ============================================================
// Demo 1：第一个 Chain —— 三行代码把 Prompt、模型、解析器串起来
// ============================================================

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL || "deepseek-flash",
  temperature: 0,
});

const summarizePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "你是一名技术文档编辑。请把用户给出的段落压缩成一句话概括，" +
      "不超过 30 个字，只输出这句话本身，不要解释、不要引号。",
  ],
  ["human", "{text}"],
]);

const article = `LangChain 提供了 LCEL（LangChain Expression Language）作为组合 Runnable 的统一语法。
通过 LCEL，开发者可以用一行代码把 Prompt、模型、输出解析器连接起来，
并且自动获得流式输出、批量调用、异步并发、失败重试和可观测性等能力，
而不需要为每一种能力单独编写胶水代码。`;

// 写法一：链式 .pipe()
const chain = summarizePrompt.pipe(model).pipe(new StringOutputParser());

// 写法二：RunnableSequence.from(数组)，与写法一完全等价，步骤多时更好读
const chainAlt = RunnableSequence.from([summarizePrompt, model, new StringOutputParser()]);

console.log("=== 输入段落 ===");
console.log(article.trim());
console.log();

console.log("=== 一句话概括（.pipe 写法）===");
console.log(await chain.invoke({ text: article }));
console.log();

console.log("=== 一句话概括（RunnableSequence 写法）===");
console.log(await chainAlt.invoke({ text: article }));
console.log();

// 注意：JS 里没有管道运算符。Python 的 `prompt | model | parser` 直译过来是「按位或」，
// 对象先被转成 NaN，再被位运算截成数字 0，于是后面 .invoke() 直接报 not a function。
console.log("=== 反面演示：JS 的 | 是按位或 ===");
console.log("summarizePrompt | model 的结果 =", summarizePrompt | model, "（类型：", typeof (summarizePrompt | model), "）");
console.log();

// ============================================================
// 对比：链尾不加解析器，拿到的是 AIMessage 对象
// ============================================================

const rawChain = summarizePrompt.pipe(model);
const raw = await rawChain.invoke({ text: article });
console.log("=== 不加解析器时的返回类型 ===");
console.log("构造函数：", raw.constructor.name);
console.log("typeof：", typeof raw);
console.log("取文本要用 raw.content：", raw.content);
console.log();

// ============================================================
// 组合的免费收益 1：整条链自动支持流式
// ============================================================

console.log("=== 流式输出（同一条链，换成 stream）===");
process.stdout.write("摘要：");
// 注意：stream() 返回的是 Promise<可读流>，要先 await 再 for await
const stream = await chain.stream({ text: article });
for await (const chunk of stream) {
  process.stdout.write(chunk);
}
console.log("\n");

// ============================================================
// 组合的免费收益 2：链可以当积木继续往上叠
// ============================================================

const polishPrompt = ChatPromptTemplate.fromMessages([
  ["system", "把下面这句话改写得更简短有力，保持原意，不超过 20 个字：\n\n{summary}"],
]);

// 上一条链的输出是字符串，正好作为下一条链的变量
const twoStepChain = chain.pipe((summary) => ({ summary })).pipe(polishPrompt).pipe(model).pipe(new StringOutputParser());

console.log("=== 两步链：概括 → 再精简 ===");
console.log(await twoStepChain.invoke({ text: article }));
