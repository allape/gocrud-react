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

/**
 * Use single instance of i18next and react-i18next across the app
 * @returns {import('vite').Plugin}
 */
export function i18nextPlugin() {
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
