import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The showcase (showcase/): pnpm dev to view, pnpm build to dist/ – CI builds it so every component compiles
export default defineConfig({
	root: "showcase",
	plugins: [react(), tailwindcss()],
	build: { outDir: "../dist", emptyOutDir: true },
});
