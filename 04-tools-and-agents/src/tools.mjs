import { tool } from "@langchain/core/tools";
import { z } from "zod";

// ============================================================
// 三个「机房运维」工具：Demo 里用写死的假数据，接口形状与真实实现一致
// 换成真实系统时，把函数体改成 fetch/SQL 即可
// ============================================================

const ALERT_DB = {
  合肥核心机房: { critical: 3, warning: 7, detail: "UPS 电池组温度过高、2 条汇聚链路丢包" },
  南京骨干机房: { critical: 0, warning: 2, detail: "端口流量峰值接近阈值" },
  芜湖接入机房: { critical: 1, warning: 5, detail: "OLT 掉线 1 台，影响 320 户" },
};

export const roomAlertTool = tool(
  async ({ room }) => {
    const hit = ALERT_DB[room];
    if (!hit) return `未找到机房「${room}」的告警记录，请确认机房名称。`;
    return JSON.stringify({
      room,
      critical: hit.critical,
      warning: hit.warning,
      detail: hit.detail,
      summary: `${room}：紧急告警 ${hit.critical} 条，次要告警 ${hit.warning} 条`,
    });
  },
  {
    name: "get_room_alerts",
    description: "查询指定机房的实时告警数量与主要问题摘要。需要先知道机房名称。",
    schema: z.object({
      room: z.string().describe("机房名称，例如「合肥核心机房」"),
    }),
  }
);

export const bandwidthTool = tool(
  async ({ link }) => {
    // 假数据：按链路名做哈希，保证每次运行结果一致，便于对照
    const load = 40 + (link.length * 7) % 55;
    return JSON.stringify({
      link,
      usage_percent: load,
      status: load > 80 ? "拥塞" : load > 60 ? "偏高" : "正常",
    });
  },
  {
    name: "get_bandwidth_usage",
    description: "查询指定传输链路的当前带宽利用率（百分比）与拥塞状态。",
    schema: z.object({
      link: z.string().describe("链路名称，例如「合肥-南京 100G 骨干」"),
    }),
  }
);

export const timeTool = tool(
  async () => {
    const now = new Date();
    return `当前时间：${now.toLocaleString("zh-CN", { hour12: false })}（时区 ${Intl.DateTimeFormat().resolvedOptions().timeZone}）`;
  },
  {
    name: "get_current_time",
    description: "获取当前的日期和时间。当问题里出现「现在」「今天」「几点」这类相对时间表达时先调用它。",
    schema: z.object({}),
  }
);

export const tools = [roomAlertTool, bandwidthTool, timeTool];
