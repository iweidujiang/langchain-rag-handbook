import { Embeddings } from "@langchain/core/embeddings";
import { OpenAIEmbeddings } from "@langchain/openai";
import "dotenv/config";

// ============================================================
// 统一的 Embedding 入口：三种来源，同一套接口
//   ollama  —— 本地真语义向量（推荐）
//   openai  —— 任意 OpenAI 兼容 embedding 服务
//   local   —— 内置哈希向量，零依赖，仅用于跑通管道
// ============================================================

const PROVIDER = (process.env.EMBEDDING_PROVIDER || "auto").toLowerCase();

// ------------------------------------------------------------
// 降级方案：字符 n-gram 哈希向量
// 它只反映「字面重合度」，不理解语义。作用是在没有 embedding 服务时
// 让整条管道（切分 → 向量化 → 存储 → 检索）能完整跑起来
// ------------------------------------------------------------

function tokenize(text) {
  const tokens = [];
  const normalized = text.toLowerCase().replace(/\s+/g, " ");

  // 英文单词 / 数字
  for (const word of normalized.match(/[a-z0-9_.-]+/g) ?? []) tokens.push([word, 1]);

  // 中文：双字为主（能表示词），单字给低权重（单字几乎每句都有，纯噪声）
  const hanParts = normalized.match(/[\u4e00-\u9fa5]+/g) ?? [];
  for (const part of hanParts) {
    if (part.length === 1) {
      tokens.push([part, 0.3]);
      continue;
    }
    for (let i = 0; i < part.length - 1; i++) tokens.push([part.slice(i, i + 2), 1]);
    for (const ch of part) tokens.push([ch, 0.3]);
  }
  return tokens;
}

function hashToken(token) {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export class HashEmbeddings extends Embeddings {
  constructor({ dimensions = 4096 } = {}) {
    super({});
    this.dimensions = dimensions;
  }

  async embedDocuments(texts) {
    return texts.map((t) => this.toVector(t));
  }

  async embedQuery(text) {
    return this.toVector(text);
  }

  toVector(text) {
    const vector = new Array(this.dimensions).fill(0);
    for (const [token, weight] of tokenize(text)) {
      vector[hashToken(token) % this.dimensions] += weight;
    }
    const norm = Math.hypot(...vector) || 1;
    return vector.map((x) => x / norm);
  }
}

// ------------------------------------------------------------
// 真实 embedding：走 OpenAI 兼容的 /v1/embeddings
// Ollama 也实现了这个接口，所以两者代码完全一致，只改 baseURL
// ------------------------------------------------------------

function buildOpenAICompatible({ baseURL, apiKey, model }) {
  return new OpenAIEmbeddings({
    apiKey,
    model,
    timeout: 8000,
    configuration: { baseURL },
  });
}

async function probe(embeddings) {
  const vector = await embeddings.embedQuery("连通性测试");
  if (!Array.isArray(vector) || vector.length === 0) throw new Error("返回的向量为空");
  return vector.length;
}

export async function getEmbeddings() {
  if (PROVIDER === "local") {
    return { embeddings: new HashEmbeddings(), info: "内置哈希向量（4096 维，仅验证管道）", real: false };
  }

  if (PROVIDER === "openai") {
    const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
    const embeddings = buildOpenAICompatible({
      baseURL: process.env.OPENAI_EMBEDDING_BASE_URL || process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
      model,
    });
    const dims = await probe(embeddings);
    return { embeddings, info: `OpenAI 兼容 embedding：${model}（${dims} 维）`, real: true };
  }

  // ollama / auto
  const model = process.env.OLLAMA_EMBEDDING_MODEL || "bge-m3";
  const embeddings = buildOpenAICompatible({
    baseURL: `${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}/v1`,
    apiKey: "ollama",
    model,
  });

  try {
    const dims = await probe(embeddings);
    return { embeddings, info: `Ollama ${model}（${dims} 维）`, real: true };
  } catch (error) {
    const reason = String(error.message).split("\n")[0];
    if (PROVIDER === "ollama") {
      throw new Error(
        `Ollama embedding 不可用：${reason}\n` +
          `排查：1) ollama pull ${model}  2) 确认服务支持 embeddings  3) 或把 EMBEDDING_PROVIDER 改成 local`
      );
    }
    console.warn(`[提示] Ollama embedding 不可用（${reason}），已降级为内置哈希向量。`);
    console.warn(`[提示] 想要真正的语义检索：ollama pull ${model} 后重跑，或设置 EMBEDDING_PROVIDER。\n`);
    return { embeddings: new HashEmbeddings(), info: "内置哈希向量（4096 维，仅验证管道）", real: false };
  }
}

// ------------------------------------------------------------
// 余弦相似度：向量检索里唯一的数学
// ------------------------------------------------------------

export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
