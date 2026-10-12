export default function GoCrudVitePlugin(options) {
    const { appendOptimizeDeps } = options || {};
    return {
        name: "GoCrudVitePlugin",
        config: (config, env) => {
            if (appendOptimizeDeps !== false && env.command === "serve") {
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
