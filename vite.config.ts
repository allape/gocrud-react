import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import GoCrudVitePlugin, { i18nextPlugin } from "./vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), i18nextPlugin(), GoCrudVitePlugin()],
});
