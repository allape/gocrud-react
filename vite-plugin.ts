import type { Plugin } from "vite";

export interface IGoCrudVitePluginOptions {
  appendOptimizeDeps?: boolean;
}

export default function GoCrudVitePlugin(
  options?: IGoCrudVitePluginOptions,
): Plugin {
  const { appendOptimizeDeps } = options || {};
  return {
    name: "GoCrudVitePlugin",
    config: (config, env) => {
      if (appendOptimizeDeps !== false && env.command === "serve") {
        return {
          optimizeDeps: {
            include: [
              "html-parse-stringify",
              "@ant-design/icons",

              "react-is",
              "is-mobile",
              "rc-component/util",
              "antd",
            ].filter((i) => !config.optimizeDeps?.include?.includes(i)),
          },
        };
      }
      return null;
    },
  };
}

export function i18nextPlugin(): Plugin {
  return {
    config: () => {
      return {
        optimizeDeps: {
          include: ["i18next", "react-i18next"],
        },
        resolve: {
          dedupe: ["i18next", "react-i18next"],
        },
      };
    },
    name: "I18Next Plugin",
  };
}
