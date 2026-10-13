import { ScreenMap } from "antd/es/_util/responsiveObserver";
import antdUseBreakpoint from "antd/es/grid/hooks/useBreakpoint";
import { useMemo } from "react";

export function useBreakpoint(): ScreenMap {
  return antdUseBreakpoint(true, null) || {};
}

export default function useMobile(): boolean {
  const breakpoint = useBreakpoint();

  return !!(breakpoint.xs || breakpoint.sm) && !breakpoint.md;
}

export type Size = "small" | undefined;

export function useSize(): Size {
  const isMobile = useMobile();
  return useMemo(() => (isMobile ? "small" : undefined), [isMobile]);
}
