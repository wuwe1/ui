// live, elapsed, runOut, level, when, updated, urgent: what UsageMeter and UsageSummary show
import assert from "node:assert/strict";
import { test } from "node:test";
import { elapsed, level, live, percent, runOut, type UsageWindow, updated, urgent, when } from "../src/lib/usage-meter.ts";

const MIN = 60_000;
const H = 60 * MIN;
const DAY = 24 * H;
// Fri 10/16 15:24, local time
const NOW = new Date(2026, 9, 16, 15, 24).getTime();
const five = (used: number, left: number): UsageWindow => ({ label: "5 小时", used, resetsAt: NOW + left, span: 5 * H });

test("live: past its reset a window no longer counts; an unknown reset always does", () => {
	assert.equal(live(five(0.4, H), NOW), true);
	assert.equal(live(five(0.4, -1), NOW), false);
	assert.equal(live({ label: "x", used: 0.4, resetsAt: null }, NOW), true);
});

test("percent: rounded, held to 0–100", () => {
	assert.equal(percent(0.434), 43);
	assert.equal(percent(1.2), 100);
	assert.equal(percent(-0.1), 0);
});

test("elapsed: the share of the window's time gone; null without span or reset", () => {
	assert.equal(elapsed(five(0.4, 1.5 * H), NOW), 0.7);
	assert.equal(elapsed(five(0.4, 6 * H), NOW), 0);
	assert.equal(elapsed({ label: "x", used: 0.4, resetsAt: NOW + H }, NOW), null);
	assert.equal(elapsed({ label: "x", used: 0.4, resetsAt: null, span: H }, NOW), null);
});

test("runOut: a straight line from the window's start, only past half used and only before the reset", () => {
	// 2 hours in, 64% used: 100% at 3h 7.5m, the reset is at 5h
	assert.equal(runOut(five(0.64, 3 * H), NOW), NOW - 2 * H + (2 * H) / 0.64);
	// Under half used: no guess
	assert.equal(runOut(five(0.45, 4.5 * H), NOW), null);
	// On pace to last until the reset
	assert.equal(runOut(five(0.6, 1.5 * H), NOW), null);
	// Used up, past its reset, or no span
	assert.equal(runOut(five(1, H), NOW), null);
	assert.equal(runOut(five(0.9, -1), NOW), null);
	assert.equal(runOut({ label: "x", used: 0.9, resetsAt: NOW + H }, NOW), null);
});

test("level: used up, then runs out early, then past warnAt", () => {
	assert.equal(level(five(1, H), NOW, 0.8), 3);
	assert.equal(level(five(0.64, 3 * H), NOW, 0.8), 2);
	assert.equal(level(five(0.84, 0.5 * H), NOW, 0.8), 1);
	assert.equal(level(five(0.43, 1.6 * H), NOW, 0.8), 0);
	assert.equal(level(five(1, -1), NOW, 0.8), 0);
});

test("when: the time today, 明天, a weekday within the week, then the date", () => {
	assert.equal(when(new Date(2026, 9, 16, 17, 0).getTime(), NOW), "17:00");
	assert.equal(when(new Date(2026, 9, 17, 8, 5).getTime(), NOW), "明天 08:05");
	assert.equal(when(new Date(2026, 9, 18, 8, 0).getTime(), NOW), "周日 08:00");
	assert.equal(when(new Date(2026, 9, 23, 8, 0).getTime(), NOW), "10/23 08:00");
});

test("updated: minutes, hours, days, then the date", () => {
	assert.equal(updated(NOW - 20_000, NOW), "刚刚更新");
	assert.equal(updated(NOW - 4 * MIN, NOW), "4 分钟前更新");
	assert.equal(updated(NOW - 2 * H - MIN, NOW), "2 小时前更新");
	assert.equal(updated(NOW - 3 * DAY, NOW), "3 天前更新");
	assert.equal(updated(new Date(2026, 9, 3, 9, 0).getTime(), NOW), "10/3 更新");
});

test("urgent: a used-up window first, then one that runs out early, then the most used; reset ones never", () => {
	const week = (used: number): UsageWindow => ({ label: "本周", used, resetsAt: NOW + 40 * H, span: 7 * DAY });
	const pick = (windows: UsageWindow[]) => urgent([{ id: "spend" }, { id: "claude", windows }], NOW);
	assert.equal(pick([five(0.43, 1.6 * H), week(0.56)])?.window.label, "本周");
	// 64% two hours in runs out before 56% of the week does
	const early = pick([five(0.64, 3 * H), week(0.7)]);
	assert.equal(early?.window.label, "5 小时");
	assert.equal(early?.out, runOut(five(0.64, 3 * H), NOW));
	// Two used up: the one that comes back last
	assert.equal(pick([five(1, H), week(1)])?.window.label, "本周");
	assert.equal(pick([five(1, H), week(0.9)])?.window.label, "5 小时");
	// Past its reset, a window is skipped
	assert.equal(pick([five(0.9, -1), week(0.3)])?.window.label, "本周");
	assert.equal(pick([five(0.9, -1)]), null);
	assert.equal(urgent([], NOW), null);
});
