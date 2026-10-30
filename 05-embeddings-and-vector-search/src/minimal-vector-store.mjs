import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cosineSimilarity } from "./embeddings.mjs";

const toPath = (p) => (typeof p === "string" ? p : fileURLToPath(p));

// ============================================================
// 最小可用的向量库：ChromaDB / FAISS / pgvector 干的也就是这些事
//   ① 把文档变成向量存起来  ② 查询时算相似度  ③ 排序取前 k 条
// 看懂这 60 行，再换任何向量库都只是换 API 调用方式
// ============================================================

export class MinimalVectorStore {
  constructor(embeddings, { name = "default" } = {}) {
    this.embeddings = embeddings;
    this.name = name;
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  async addDocuments(docs, { batchSize = 16, verbose = false } = {}) {
    for (let start = 0; start < docs.length; start += batchSize) {
      const batch = docs.slice(start, start + batchSize);
      // 批量向量化：一次请求拼多条文本，比逐条调快得多
      const vectors = await this.embeddings.embedDocuments(batch.map((d) => d.pageContent));
      batch.forEach((doc, i) => {
        this.items.push({
          id: `chunk-${this.items.length + 1}`,
          content: doc.pageContent,
          metadata: doc.metadata ?? {},
          vector: vectors[i],
        });
      });
      if (verbose) console.log(`  已向量化 ${Math.min(start + batchSize, docs.length)}/${docs.length}`);
    }
    return this;
  }

  async similaritySearch(query, k = 3) {
    if (this.items.length === 0) return [];
    const queryVector = await this.embeddings.embedQuery(query);
    return this.items
      .map((item) => ({
        id: item.id,
        content: item.content,
        metadata: item.metadata,
        score: cosineSimilarity(queryVector, item.vector),
      }))
      .sort((a, b) => b.score - a.score) // 相似度降序，这就是「检索」
      .slice(0, k);
  }

  async save(filePath) {
    const target = toPath(filePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(
      target,
      JSON.stringify({ name: this.name, savedAt: new Date().toISOString(), items: this.items }, null, 0),
      "utf8"
    );
    return target;
  }

  static async load(filePath, embeddings) {
    const raw = JSON.parse(await readFile(toPath(filePath), "utf8"));
    const store = new MinimalVectorStore(embeddings, { name: raw.name });
    store.items = raw.items ?? [];
    return store;
  }
}
