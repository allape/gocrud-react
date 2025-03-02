import { useEffect, useMemo, useState } from "react";

export default function useMobile(maxWidth: number = 800): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= maxWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [maxWidth]);

  return isMobile;
}

export type Size = "small" | undefined;

export function useSize(maxWidth?: number): Size {
  const isMobile = useMobile(maxWidth);
  return useMemo(() => (isMobile ? "small" : undefined), [isMobile]);
}
