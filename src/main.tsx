import { Locale } from "antd/es/locale";
import zhCN from "antd/locale/zh_CN";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import { ThemeProvider } from "../index.ts";
import App from "./App.tsx";
import { getLanguage, setup } from "./i18n";

function getLocale(): Locale | undefined {
  const language = getLanguage();
  if (language.startsWith("zh")) {
    import("dayjs/locale/zh-cn");
    return zhCN;
  }
  return undefined;
}

setup().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ThemeProvider locale={getLocale()}>
        <App />
      </ThemeProvider>
    </StrictMode>,
  );
});
