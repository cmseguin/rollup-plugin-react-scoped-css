import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { reactScopedCssPlugin } from "../../";

// https://vitejs.dev/config/
export default defineConfig({
  port: 5100,
  plugins: [react(), reactScopedCssPlugin()],
  build: {
    minify: false,
  },
});
