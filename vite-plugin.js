/**
 * @param {IGoCrudVitePluginOptions=} options
 * @returns {import('vite').Plugin}
 */
export default function GoCrudVitePlugin(
  options = {
    appendOptimizeDeps: true,
  },
) {
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
