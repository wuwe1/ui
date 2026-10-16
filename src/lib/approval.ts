// What an approval card says about time and outcome. Pure – test/approval.test.ts.

export type ApprovalStatus = "pending" | "approved" | "denied" | "expired" | "cancelled";

/** Time until the request expires: 「剩 N 分钟」 rounded up, then 「剩 N 秒」; soon – the last minute */
export function left(until: number, now: number): { text: string; soon: boolean } {
	const ms = Math.max(0, until - now);
	return ms > 60_000 ? { text: `剩 ${Math.ceil(ms / 60_000)} 分钟`, soon: false } : { text: `剩 ${Math.ceil(ms / 1000)} 秒`, soon: true };
}

/** The one line an answered card folds into */
export const OUTCOME: Record<Exclude<ApprovalStatus, "pending">, string> = { approved: "已允许", denied: "已拒绝", expired: "已自动拒绝", cancelled: "已取消" };
