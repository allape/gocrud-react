import type { Plugin } from "vite";

export interface IGoCrudVitePluginOptions {
  appendOptimizeDeps?: boolean;
}

export default function GoCrudVitePlugin(
  options?: IGoCrudVitePluginOptions,
): Plugin;
