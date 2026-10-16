// What a ConnectionCard decides on its own: when it opens, and the word a mark stands for when no status sits beside it

/** ok – works; waiting – needs you; error – failed; off – not connected or not in use */
export type ConnectionMark = "ok" | "waiting" | "error" | "off";

/** Waiting or error: the card opens for these */
export const needsYou = (mark: ConnectionMark) => mark === "waiting" || mark === "error";

/**
 * Open after the mark changes: a card that starts needing you opens itself; it never closes itself –
 * fixing the last account leaves the rows in sight, and only the person folds it
 */
export const openAfter = (o: { open: boolean; was: ConnectionMark; mark: ConnectionMark }) => (needsYou(o.mark) && !needsYou(o.was) ? true : o.open);

/** The tooltip of a mark with no words beside it */
export const MARK_LABEL: Record<ConnectionMark, string> = { ok: "正常", waiting: "待处理", error: "失败", off: "未启用" };
