import { readFile } from "node:fs/promises";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// ============================================================
// Demo 1：文本切分 —— 这一步不花钱、不联网，却最影响检索效果
// ============================================================

const fileUrl = new URL("../data/运维手册.md", import.meta.url);
const raw = await readFile(fileUrl, "utf8");

// 中文文档的分隔符优先级：先标题、再段落、再标点，最后才允许按字符硬切
const ZH_SEPARATORS = ["\n## ", "\n\n", "\n", "。", "；", "，", " ", ""];

console.log("=== 原文 ===");
console.log(`字符数：${raw.length}，段落数：${raw.split(/\n\n+/).length}`);
console.log();

// 切分规则一次配好，后面只改 chunkSize 做对照
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 220,
  chunkOverlap: 40,
  separators: ZH_SEPARATORS,
  keepSeparator: true,
});

const chunks = await splitter.createDocuments([raw], [{ source: "运维手册.md" }]);

const lengths = chunks.map((c) => c.pageContent.length);
console.log("=== 切分结果 ===");
console.log(`chunk 数：${chunks.length}`);
console.log(`长度：最短 ${Math.min(...lengths)}，最长 ${Math.max(...lengths)}，平均 ${Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)}`);
console.log();

console.log("=== 前两个 chunk ===");
for (const [i, chunk] of chunks.slice(0, 2).entries()) {
  console.log(`--- chunk ${i + 1}（${chunk.pageContent.length} 字，来源 ${chunk.metadata.source}）---`);
  console.log(chunk.pageContent.trim());
  console.log();
}

// 重叠区：相邻 chunk 共享的一段内容，防止答案正好被切断
// 取第一对「正文块」来看，标题这种短块没有重叠可言
const bodyIndex = chunks.findIndex((c) => c.pageContent.length >= 100);
const a = chunks[bodyIndex].pageContent;
const b = chunks[bodyIndex + 1].pageContent;
const tail = a.slice(-40).trim();
console.log("=== 重叠（overlap）检查 ===");
console.log(`chunk${bodyIndex + 1} 结尾 40 字：`, tail);
console.log(`是否出现在 chunk${bodyIndex + 2} 里：`, b.includes(tail));
console.log("（按标题、段落切分时，边界处本来就不会重叠；overlap 只对需要硬切的超长段落生效）");
console.log();

// 不同参数对比：块越大，单块信息越完整，但检索越不精准
console.log("=== 参数对比 ===");
for (const size of [120, 220, 400]) {
  const s = new RecursiveCharacterTextSplitter({
    chunkSize: size,
    chunkOverlap: Math.round(size * 0.18),
    separators: ZH_SEPARATORS,
  });
  const result = await s.createDocuments([raw]);
  console.log(`chunkSize=${size} → ${result.length} 块，平均 ${Math.round(raw.length / result.length)} 字/块`);
}

// ------------------------------------------------------------
// 中文为什么必须自己写 separators：
// 默认分隔符是 ["\n\n", "\n", " ", ""]，中文段落里没有空格，
// 于是一路掉到 ""，按字符硬切，句子被拦腰截断
// ------------------------------------------------------------

console.log("\n=== 默认分隔符 vs 中文分隔符（chunkSize=120、overlap=0）===");
for (const [label, options] of [
  ["默认", { chunkSize: 120, chunkOverlap: 0 }],
  ["中文", { chunkSize: 120, chunkOverlap: 0, separators: ZH_SEPARATORS, keepSeparator: true }],
]) {
  const result = await new RecursiveCharacterTextSplitter(options).createDocuments([raw]);
  console.log(`--- ${label}分隔符：${result.length} 块 ---`);
  for (const chunk of result.slice(1, 4)) {
    const text = chunk.pageContent.replace(/\s+/g, " ");
    console.log(`  起[${text.slice(0, 14)}] 止[${text.slice(-14)}]`);
  }
}
