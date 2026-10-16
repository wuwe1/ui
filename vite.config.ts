import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The showcase (showcase/): pnpm dev to view, pnpm build to dist/ – CI builds it so every component compiles
export default defineConfig({
	root: "showcase",
	plugins: [react(), tailwindcss()],
	// light-dark() stays native: lower targets make Lightning CSS pin it to :root, and subtree modes stop working
	build: { outDir: "../dist", emptyOutDir: true, cssTarget: ["safari17.5", "chrome123", "firefox120", "edge123"] },
});
