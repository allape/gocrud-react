import { Plugin } from "vite";

export interface IGoCrudVitePluginOptions {
  appendOptimizeDeps?: boolean;
}

export default function GoCrudVitePlugin(
  options: IGoCrudVitePluginOptions = {
    appendOptimizeDeps: true,
  },
): Plugin {
  return {
    name: "GoCrudVitePlugin",
    config: (config, env) => {
      if (options.appendOptimizeDeps && env.command === "serve") {
        return {
          optimizeDeps: {
            include: [
              "antd",
              "@ant-design/icons",
              "html-parse-stringify",
            ].filter((i) => !config.optimizeDeps?.include?.includes(i)),
          },
        };
      }

      return null;
    },
  };
}
