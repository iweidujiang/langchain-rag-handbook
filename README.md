# LangChain RAG Handbook

> 《AI 应用开发实战：从 LangChain 入门到企业级 RAG 落地》配套代码 —— 从 LangChain 入门到企业级 RAG 系统落地。

## 合集介绍

本仓库是技术合集《AI 应用开发实战：从 LangChain 入门到企业级 RAG 落地》的配套代码仓库。每篇文章对应一个独立可运行的示例项目，从最基础的 LLM 调用开始，逐步构建出一个完整的企业级 RAG 智能问答系统。

所有代码基于 **LangChain.js**，使用 JavaScript/Node.js 生态，前后端统一。

## 技术栈

| 类别 | 选型 |
|------|------|
| 核心框架 | LangChain.js v0.3+ |
| 工作流引擎 | LangGraph.js |
| 全栈框架 | Next.js 14+ (App Router) |
| 运行时 | Node.js 20+ |
| 向量数据库 | ChromaDB（主） / FAISS（辅） |
| 大模型 | DeepSeek / OpenAI 兼容接口 |
| Embedding | DeepSeek Embedding / text-embedding-3-small |
| 评估 | Ragas |
| 部署 | Vercel / Docker |

## 快速开始

### 环境要求

- **Node.js** >= 20.0.0（推荐 20 LTS）
- **npm** >= 10.0.0
- **DeepSeek API Key**（或其他 OpenAI 兼容接口）

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/langchain-rag-handbook.git
cd langchain-rag-handbook

# 2. 进入任意一篇的目录
cd 01-getting-started

# 3. 安装依赖
npm install

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 API Key

# 5. 运行
npm run start
```

## 篇目导航

| 篇号 | 标题 | 目录 | 难度 |
|------|------|------|------|
| 00 | AI 应用开发的核心概念地图：Prompt、Chain、Agent、RAG 到底在说什么 | [`00-concepts/`](./00-concepts/) | ★☆☆ |
| 01 | 用 10 行代码让大模型替你干活：LangChain 入门与环境搭建 | [`01-getting-started/`](./01-getting-started/) | ★☆☆ |
| 02 | 别再裸写 Prompt 了：模板化、结构化与输出解析 | [`02-prompt-and-output/`](./02-prompt-and-output/) | ★☆☆ |

## 环境准备

### DeepSeek API

1. 前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 注册并获取 API Key
2. 确保账户有足够额度
3. 将 API Key 填入各篇目录下的 `.env` 文件

本合集使用 OpenAI 兼容接口格式，DeepSeek 的接口完全兼容，只需配置：

```env
OPENAI_API_KEY=sk-your-deepseek-key
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-flash
```

如果你使用其他 OpenAI 兼容服务，修改 `OPENAI_BASE_URL` 为对应地址即可。

### Ollama（可选，本地模型替代方案）

```bash
# 安装 Ollama: https://ollama.com
ollama pull deepseek-r1
```

部分示例提供 Ollama 本地模型的替代写法，无需 API Key 也可运行。

## 常见问题

### API Key 不生效？

确保 `.env` 文件在正确目录下，且变量名拼写无误。运行 `echo $OPENAI_API_KEY`（Linux/Mac）或 `echo %OPENAI_API_KEY%`（Windows）检查。

### Node.js 版本不对？

使用 `node -v` 检查版本。推荐使用 [nvm](https://github.com/nvm-sh/nvm) 管理 Node.js 版本：`nvm install 20 && nvm use 20`。

### 依赖安装失败？

尝试清除缓存后重装：`rm -rf node_modules package-lock.json && npm install`。

## 贡献方式

欢迎提交 Issue 和 Pull Request。

- 代码问题请附带错误日志和环境信息
- 文章勘误请直接提 Issue
- 新功能建议请先开 Issue 讨论

## License

MIT
