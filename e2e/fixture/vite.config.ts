import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { reactScopedCssPlugin } from "rollup-plugin-react-scoped-css";

// e2e/run.mjs loads this config through a per-Vite-version install.
export default defineConfig({
  plugins: [
    react(),
    reactScopedCssPlugin({
      scopeStyleByDefault: false,
    }),
  ],
});
