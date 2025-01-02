import { App, AppProps, ConfigProvider, theme } from "antd";
import React, { PropsWithChildren, useEffect, useState } from "react";

const darkColorSchemeMediaQuery = window.matchMedia(
  "(prefers-color-scheme: dark)",
);

function isPreferDark(): boolean {
  return darkColorSchemeMediaQuery.matches;
}

export interface IThemeProviderProps {
  appProps?: AppProps;
}

export default function ThemeProvider({
  appProps,
  children,
}: PropsWithChildren<IThemeProviderProps>): React.ReactElement {
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
      <App {...appProps}>{children}</App>
    </ConfigProvider>
  );
}
