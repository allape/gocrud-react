import { useEffect, useState } from "react";

const darkColorSchemeMediaQuery = window.matchMedia(
  "(prefers-color-scheme: dark)",
);

function isPreferDark(): boolean {
  return darkColorSchemeMediaQuery.matches;
}

export default function useColorScheme(): boolean {
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
  return darkMode;
}
