import { readFile } from "node:fs/promises";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getEmbeddings } from "./embeddings.mjs";
import { MinimalVectorStore } from "./minimal-vector-store.mjs";

// ============================================================
// Demo 3：建一个能查的迷你知识库（切分 → 向量化 → 入库 → 检索 → 落盘）
// ============================================================

const { embeddings, info, real } = await getEmbeddings();
console.log(`Embedding：${info}\n`);

const raw = await readFile(new URL("../data/运维手册.md", import.meta.url), "utf8");

// --- 1. 切分 -------------------------------------------------------------
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 220,
  chunkOverlap: 40,
  separators: ["\n## ", "\n\n", "\n", "。", "；", "，", " ", ""],
  keepSeparator: true,
});

const chunks = await splitter.createDocuments([raw], [{ source: "运维手册.md" }]);
console.log(`切分完成：${chunks.length} 个 chunk`);

// --- 2. 向量化 + 入库 ----------------------------------------------------
const started = Date.now();
const store = new MinimalVectorStore(embeddings, { name: "运维手册" });
await store.addDocuments(chunks, { batchSize: 8, verbose: true });
console.log(`入库完成：${store.size} 条向量，耗时 ${((Date.now() - started) / 1000).toFixed(2)}s\n`);

// --- 3. 检索：向量 vs 关键词 ---------------------------------------------
function bigrams(text) {
  const out = [];
  for (let i = 0; i < text.length - 1; i++) {
    const pair = text.slice(i, i + 2);
    if (/^[\u4e00-\u9fa5a-z0-9]{2}$/.test(pair)) out.push(pair);
  }
  return out;
}

function keywordSearch(query, k = 3) {
  const grams = bigrams(query);
  return chunks
    .map((c) => ({
      content: c.pageContent,
      score: grams.filter((g) => c.pageContent.includes(g)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

const preview = (text, n = 60) => text.replace(/\s+/g, " ").trim().slice(0, n);

const queries = [
  "电池发烫要怎么处理", // 手册里写的是「温升异常」，字面对不上
  "OLT 掉线先查什么",
  "割接没在窗口内做完怎么办",
];

for (const query of queries) {
  console.log("=".repeat(60));
  console.log(`查询：${query}`);

  console.log("\n[向量检索 Top3]");
  for (const r of await store.similaritySearch(query, 3)) {
    console.log(`  ${r.score.toFixed(3)}  ${preview(r.content)}`);
  }

  console.log("\n[关键词检索 Top3]");
  for (const r of keywordSearch(query)) {
    console.log(`  命中 ${r.score} 个词  ${preview(r.content)}`);
  }
  console.log();
}

// --- 4. 落盘 + 重新加载 --------------------------------------------------
const storePath = new URL("../data/vector-store.json", import.meta.url);
await store.save(storePath);
console.log(`已保存到 data/vector-store.json（${(JSON.stringify(store.items).length / 1024).toFixed(1)} KB）`);

const reloaded = await MinimalVectorStore.load(storePath, embeddings);
console.log(`重新加载：${reloaded.size} 条向量`);
const [top] = await reloaded.similaritySearch("温度太高了怎么办", 1);
console.log(`重载后查询「温度太高了怎么办」→ ${top.score.toFixed(3)}  ${preview(top.content, 50)}`);

if (!real) {
  console.log("\n[提示] 当前用的降级向量，上面「向量检索」与「关键词检索」差别不大；");
  console.log("       换成 Ollama 真模型后，语义相近但字面不同的结果才会被召回。");
}
