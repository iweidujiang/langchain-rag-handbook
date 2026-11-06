import { readFile } from "node:fs/promises";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { getEmbeddings } from "../../05-embeddings-and-vector-search/src/embeddings.mjs";
import "dotenv/config";

// ============================================================
// Demo 1：把运维手册切分、向量化、存入 Chroma
// ============================================================

const ZH_SEPARATORS = ["\n## ", "\n\n", "\n", "。", "；", "，", " ", ""];

const raw = await readFile(new URL("../data/运维手册.md", import.meta.url), "utf8");
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 220,
  chunkOverlap: 40,
  separators: ZH_SEPARATORS,
  keepSeparator: true,
});
const chunks = await splitter.createDocuments([raw], [{ source: "运维手册.md" }]);

const { embeddings, info } = await getEmbeddings();
console.log(`Embedding: ${info}`);

const collectionName = process.env.CHROMA_COLLECTION || "ops_manual";
const chromaUrl = process.env.CHROMA_URL || "http://localhost:8000";

const store = await Chroma.fromDocuments(chunks, embeddings, {
  collectionName,
  url: chromaUrl,
});

console.log(`\n已入库 ${chunks.length} 个 chunk 到 Chroma collection "${collectionName}"`);
console.log(`Chroma URL: ${chromaUrl}`);

// 验证：查一下 collection 里有多少条
const stats = await store.collection.count();
console.log(`Collection 当前文档数: ${stats}`);
