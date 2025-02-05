import { App, AppProps, ConfigProvider, theme } from "antd";
import { PropsWithChildren, ReactElement, ReactNode } from "react";
import useColorScheme from "../../hook/useColorScheme.ts";
import { AntdAppWindow } from "../../vite-env";

export interface IThemeProviderProps {
  appProps?: AppProps;
}

export function Wrapper({ children }: PropsWithChildren): ReactNode {
  (window as AntdAppWindow).antd = App.useApp();
  return children;
}

export default function ThemeProvider({
  appProps,
  children,
}: PropsWithChildren<IThemeProviderProps>): ReactElement {
  const darkMode = useColorScheme();
  return (
    <ConfigProvider
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
