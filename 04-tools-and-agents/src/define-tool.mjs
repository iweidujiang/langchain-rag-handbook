import { tools, roomAlertTool, bandwidthTool, timeTool } from "./tools.mjs";

// ============================================================
// Demo 1：工具就是「带说明书的函数」——先不调模型，把工具本身看清楚
// ============================================================

console.log("=== 1. 注册了哪几个工具 ===");
for (const t of tools) {
  console.log(`- ${t.name}：${t.description}`);
}
console.log();

// ============================================================
// 2. 工具可以像普通函数一样直接调用（这一步完全不花 token）
// ============================================================

console.log("=== 2. 直接调用工具 ===");
console.log("机房告警 →", await roomAlertTool.invoke({ room: "合肥核心机房" }));
console.log("带宽利用率 →", await bandwidthTool.invoke({ link: "合肥-南京 100G 骨干" }));
console.log("当前时间 →", await timeTool.invoke({}));
console.log();

// ============================================================
// 3. 参数不对时，Zod 在函数体执行前就拦下来
// ============================================================

console.log("=== 3. 参数校验：漏传 room ===");
try {
  await roomAlertTool.invoke({});
} catch (error) {
  console.log("被拦下了：", String(error.message).split("\n")[0]);
}
console.log();

// ============================================================
// 4. 工具返回值必须是「模型读得懂的文本」
// ============================================================

console.log("=== 4. 返回值类型 ===");
const raw = await roomAlertTool.invoke({ room: "芜湖接入机房" });
console.log("typeof =", typeof raw, "（模型只能读字符串，对象要先 JSON.stringify）");
console.log();

// ============================================================
// 5. 机房名写错时，工具要「说清楚」而不是抛异常
// ============================================================

console.log("=== 5. 查无此机房 ===");
console.log(await roomAlertTool.invoke({ room: "北京核心机房" }));
console.log("↑ 把「没查到」写进返回值，模型看到后会自己纠正或改口，不会瞎编");
