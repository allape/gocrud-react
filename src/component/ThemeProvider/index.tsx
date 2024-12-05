import { ConfigProvider, theme } from "antd";
import React, { PropsWithChildren, useEffect, useState } from "react";

const darkColorSchemeMediaQuery = window.matchMedia(
  "(prefers-color-scheme: dark)",
);

function isPreferDark(): boolean {
  return darkColorSchemeMediaQuery.matches;
}

export type IThemeProviderProps = object;

export default function ThemeProvider({
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
      {children}
    </ConfigProvider>
  );
}
