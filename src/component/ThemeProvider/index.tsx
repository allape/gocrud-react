import { App, AppProps, ConfigProvider, theme } from "antd";
import {
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { AntdAppWindow } from "../../vite-env";

const darkColorSchemeMediaQuery = window.matchMedia(
  "(prefers-color-scheme: dark)",
);

function isPreferDark(): boolean {
  return darkColorSchemeMediaQuery.matches;
}

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
  const [darkMode, setDarkMode] = useState<boolean>(isPreferDark);
  useEffect(() => {
    const handlePrefersColorSchemeChanged = () => {
      setDarkMode(isPreferDark());
    };
    darkColorSchemeMediaQuery.addEventListener(
      "change",
      handlePrefersColorSchemeChanged,
    );
    return () => {
      darkColorSchemeMediaQuery.removeEventListener(
        "change",
        handlePrefersColorSchemeChanged,
      );
    };
  }, []);
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
