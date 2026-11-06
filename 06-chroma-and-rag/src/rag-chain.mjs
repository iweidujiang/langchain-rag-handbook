import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { getEmbeddings } from "../../05-embeddings-and-vector-search/src/embeddings.mjs";
import "dotenv/config";

// ============================================================
// Demo 2：完整 RAG 链 —— 检索 → 拼装 → 生成（带出处引用）
// ============================================================

const { embeddings } = await getEmbeddings();
const collectionName = process.env.CHROMA_COLLECTION || "ops_manual";
const chromaUrl = process.env.CHROMA_URL || "http://localhost:8000";

const store = await Chroma.fromExistingCollection(embeddings, {
  collectionName,
  url: chromaUrl,
});

const retriever = store.asRetriever({ k: 3 });

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL || "deepseek-flash",
  temperature: 0,
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是省级网管中心的值班专家。根据以下参考资料回答用户问题。
如果资料里没有相关信息，明确说「资料中未提及」，不要编造。
回答时引用资料出处（用 [来源: xxx] 格式）。

参考资料：
{context}`,
  ],
  ["human", "{question}"],
]);

const formatDocs = (docs) =>
  docs
    .map((d, i) => `[${i + 1}] ${d.pageContent}\n   来源: ${d.metadata.source || "未知"}`)
    .join("\n\n");

const chain = RunnableSequence.from([
  RunnablePassthrough.assign({
    context: async (input) => {
      const docs = await retriever.invoke(input.question);
      return formatDocs(docs);
    },
  }),
  prompt,
  model,
  new StringOutputParser(),
]);

const questions = [
  "电池发烫要怎么处理？",
  "OLT 掉线先查什么？",
  "割接窗口是几点到几点？",
  "机房着火了怎么办？", // 资料里没有，应该回答「未提及」
];

for (const q of questions) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`问：${q}`);
  console.log("-".repeat(60));
  const answer = await chain.invoke({ question: q });
  console.log(answer);
}
