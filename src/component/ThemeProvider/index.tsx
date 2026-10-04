import { App, AppProps, ConfigProvider, theme } from "antd";
import type { Locale } from "antd/es/locale";
import { PropsWithChildren, ReactElement, ReactNode, useEffect } from "react";
import useColorScheme from "../../hook/useColorScheme.ts";
import { AntdAppWindow } from "../../vite-env";

export interface IThemeProviderProps {
  locale?: Locale;
  appProps?: AppProps;
}

export function Wrapper({ children }: PropsWithChildren): ReactNode {
  const app = App.useApp();
  useEffect(() => {
    (window as AntdAppWindow).antd = app;
  }, [app]);
  return children;
}

export default function ThemeProvider({
  locale,
  appProps,
  children,
}: PropsWithChildren<IThemeProviderProps>): ReactElement {
  const darkMode = useColorScheme();
  return (
    <ConfigProvider
      locale={locale}
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <App {...appProps}>
        <Wrapper>{children}</Wrapper>
      </App>
    </ConfigProvider>
  );
}
