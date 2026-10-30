# 第5篇：从一堆文档到可检索知识库 —— 文本切分 + Embedding + 向量检索实战

## 本篇目标

把一份 Markdown 运维手册切成语义完整的片段，用 Embedding 变成向量存进自己写的最小向量库，
再用余弦相似度做检索，并用关键词检索做对照，看清「向量检索到底赢在哪」。

## 前置条件

- Node.js >= 20
- 不需要 API Key：本篇三个 Demo 全走本地 embedding / 哈希向量，不消耗 token
- 想要真正的中文语义效果：装好 Ollama 并拉取模型

```bash
ollama pull bge-m3        # 约 1.2GB，1024 维，中文/多语效果好
```

没拉模型也能跑：代码会自动降级成内置哈希向量，管道完整但只反映字面重合度。

## 快速运行

```bash
cd 05-embeddings-and-vector-search/
cp .env.example .env      # 只跑本地 embedding 可以不改，直接用代码默认值
npm install

npm run chunk             # Demo 1：文本切分（不消耗 token，可反复调参）
npm run similarity        # Demo 2：Embedding + 余弦相似度
npm run kb                # Demo 3：切分 → 向量化 → 存储 → 检索，向量 vs 关键词对照
```

## 代码结构

```
src/
├── embeddings.mjs            # 三种 embedding 来源统一入口 + 余弦相似度
├── minimal-vector-store.mjs  # 约 60 行的向量库（存取 + JSON 持久化）
├── chunking.mjs              # Demo 1：切分策略与参数对照
├── similarity.mjs            # Demo 2：语义相近 = 向量夹角小
└── knowledge-base.mjs        # Demo 3：端到端跑通一次检索
data/
├── 运维手册.md                # 6 个小节、约 1300 字的模拟机房手册
└── vector-store.json         # Demo 3 生成，可重复加载验证持久化
```

## 常见问题

- 报 `404 model 'bge-m3' not found`：先执行 `ollama pull bge-m3`
- 报 `This server does not support embeddings`：Ollama 里没有可用的 embedding 模型
- 排序明显不对、两句无关中文相似度偏高：多半在用 nomic-embed-text，换 bge-m3
- 想先跑通流程再配模型：`EMBEDDING_PROVIDER=local`

## 延伸阅读

→ [第 4 篇：从会说到会做](../04-tools-and-agents/)
→ [第 6 篇：RAG 端到端流水线](../06-rag-pipeline/)
