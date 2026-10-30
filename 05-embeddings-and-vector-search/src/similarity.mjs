import { cosineSimilarity, getEmbeddings } from "./embeddings.mjs";

// ============================================================
// Demo 2：Embedding 与余弦相似度 —— 语义相近 = 向量夹角小
// ============================================================

const { embeddings, info, real } = await getEmbeddings();

console.log("=== Embedding 来源 ===");
console.log(info);
if (!real) {
  console.log("注意：当前是降级向量，只能反映字面重合度。跑真实语义请先 ollama pull bge-m3。");
}
console.log();

const sentences = [
  "蓄电池组温升异常，需要检查机房空调与环境温度。",
  "OLT 设备脱网时，先确认供电与上联链路状态。",
  "链路利用率超过八成会触发拥塞预警。",
  "今天中午吃了牛肉面和一份凉皮。",
  "割接窗口固定在每周二、周四的凌晨。",
];

const vectors = await embeddings.embedDocuments(sentences);

console.log("=== 文本 → 向量 ===");
console.log(`维度：${vectors[0].length}`);
console.log(`前 6 个分量：${vectors[0].slice(0, 6).map((v) => v.toFixed(4)).join(", ")}`);
console.log("（向量本身没有可读含义，它只在「比较」时才有意义）");
console.log();

async function rank(query) {
  const qv = await embeddings.embedQuery(query);
  return sentences
    .map((s, i) => ({ text: s, score: cosineSimilarity(qv, vectors[i]) }))
    .sort((a, b) => b.score - a.score);
}

for (const query of ["电池发热怎么处理", "网络断了先查什么", "什么时候可以做割接"]) {
  console.log(`=== 查询：${query} ===`);
  for (const [i, r] of (await rank(query)).entries()) {
    const flag = i === 0 ? " ←最相关" : "";
    console.log(`  ${r.score.toFixed(3)}  ${r.text}${flag}`);
  }
  console.log();
}

// 极端情况：完全相同 = 1；毫无关系也远不止 0，模型自带「底噪」
const v1 = await embeddings.embedQuery("割接窗口在凌晨");
const v2 = await embeddings.embedQuery("割接窗口在凌晨");
const v3 = await embeddings.embedQuery("今天天气不错适合爬山");
console.log("=== 相似度的两端 ===");
console.log(`同一句话：${cosineSimilarity(v1, v2).toFixed(3)}（恒为 1）`);
console.log(`完全无关：${cosineSimilarity(v1, v3).toFixed(3)}（不是 0！所以分数只能横向比较，不能当置信度）`);
