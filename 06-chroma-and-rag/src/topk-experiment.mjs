import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { getEmbeddings } from "../../05-embeddings-and-vector-search/src/embeddings.mjs";
import "dotenv/config";

// ============================================================
// Demo 3：Top-k 对照实验 —— k=1/3/5 对答案质量的影响
// ============================================================

const { embeddings } = await getEmbeddings();
const collectionName = process.env.CHROMA_COLLECTION || "ops_manual";
const chromaUrl = process.env.CHROMA_URL || "http://localhost:8000";

const store = await Chroma.fromExistingCollection(embeddings, {
  collectionName,
  url: chromaUrl,
});

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL || "deepseek-flash",
  temperature: 0,
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是省级网管中心的值班专家。根据以下参考资料回答问题。
如果资料里没有，明确说「资料中未提及」。

参考资料：
{context}`,
  ],
  ["human", "{question}"],
]);

const formatDocs = (docs) => docs.map((d, i) => `[${i + 1}] ${d.pageContent}`).join("\n\n");

async function askWithK(question, k) {
  const retriever = store.asRetriever({ k });
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
  return await chain.invoke({ question });
}

const question = "电池发烫要怎么处理？";

for (const k of [1, 3, 5]) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Top-k = ${k}`);
  console.log("-".repeat(60));
  const answer = await askWithK(question, k);
  console.log(answer);
}
