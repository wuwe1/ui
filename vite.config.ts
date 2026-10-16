import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 展示页（showcase/）：pnpm dev 看，pnpm build 打到 dist/（CI 里打一遍，确认组件都编得过）
export default defineConfig({
	root: "showcase",
	plugins: [react(), tailwindcss()],
	build: { outDir: "../dist", emptyOutDir: true },
});
