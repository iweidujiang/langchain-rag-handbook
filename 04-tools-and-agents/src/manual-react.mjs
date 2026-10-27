import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { tools } from "./tools.mjs";
import "dotenv/config";

// ============================================================
// Demo 2：手写 ReAct 循环 —— 看清 Agent 的每一圈「思考 → 调用 → 观察」
// ============================================================

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL || "deepseek-flash",
  temperature: 0,
});

// bindTools 只做一件事：把工具的 name/description/schema 作为函数声明一起发给模型
// 注意：这里不传 tool_choice，请求体里就不会有这个字段（DeepSeek 思考模式会拒绝 required）
const llmWithTools = model.bindTools(tools);

const SYSTEM_PROMPT = `你是省级网管中心的运维助手。必须遵守：
1. 涉及告警数量、带宽利用率、当前时间这类实时数据，一律调用工具获取，禁止凭记忆编造；
2. 工具返回里没有的信息，直接回答「不知道」，不要推测；
3. 如果用户给的条件不足以调用工具（比如没说机房名），先向用户提问澄清；
4. 拿到工具结果后，用简洁中文回答，不要把原始 JSON 丢给用户。`;

const toolMap = Object.fromEntries(tools.map((t) => [t.name, t]));

async function runAgent(question, { maxSteps = 5, verbose = true } = {}) {
  const messages = [new SystemMessage(SYSTEM_PROMPT), new HumanMessage(question)];

  for (let step = 1; step <= maxSteps; step++) {
    const ai = await llmWithTools.invoke(messages);
    messages.push(ai);

    // 情况一：模型认为不需要工具（或已经拿到足够信息）→ 循环结束
    if (!ai.tool_calls || ai.tool_calls.length === 0) {
      if (verbose) console.log(`  [第 ${step} 轮] 不再调用工具，直接作答`);
      return { answer: ai.content, rounds: step, messages };
    }

    // 情况二：模型点了工具 → 我们替它执行，把结果以 ToolMessage 喂回去
    for (const call of ai.tool_calls) {
      if (verbose) {
        console.log(`  [第 ${step} 轮] 决定调用 ${call.name}(${JSON.stringify(call.args)})`);
      }

      const target = toolMap[call.name];
      let output;
      try {
        output = target ? await target.invoke(call.args) : `错误：不存在名为 ${call.name} 的工具`;
      } catch (error) {
        // 参数不合法时不要把异常抛给整个流程，把错误文本还给模型，它有机会重试
        output = `工具调用失败：${error.message}`;
      }

      if (verbose) {
        const preview = String(output).slice(0, 90);
        console.log(`  [第 ${step} 轮] 工具返回：${preview}${preview.length >= 90 ? "…" : ""}`);
      }

      messages.push(
        new ToolMessage({
          content: String(output),
          tool_call_id: call.id ?? crypto.randomUUID(), // 必须与模型发起的那次调用对上
          name: call.name,
        })
      );
    }
  }

  return { answer: "（达到最大轮数仍未收敛，已强制结束）", rounds: maxSteps, messages };
}

const questions = [
  "现在几点了？顺便看下合肥核心机房有没有紧急告警。",
  "芜湖接入机房和南京骨干机房，哪个告警更严重？",
];

for (const [i, q] of questions.entries()) {
  console.log(`\n${"=".repeat(58)}`);
  console.log(`问题 ${i + 1}：${q}`);
  console.log("=".repeat(58));
  const started = Date.now();
  const { answer, rounds } = await runAgent(q);
  console.log(`\n最终回答（${rounds} 轮，耗时 ${((Date.now() - started) / 1000).toFixed(1)}s）：`);
  console.log(answer);
}
