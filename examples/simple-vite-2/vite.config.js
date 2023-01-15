import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { reactScopedCssPlugin } from "../../";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), reactScopedCssPlugin()],
  build: {
    minify: false,
  },
});
