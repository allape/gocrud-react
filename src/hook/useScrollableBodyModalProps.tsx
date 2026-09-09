import { useMemo } from "react";
import { ModalProps } from "antd";
import { useMobile } from "../../index.ts";

function newDefaultStyle(isMobile: boolean): ModalProps["styles"] {
  return {
    body: {
      maxHeight: isMobile ? "calc(100dvh - 120px)" : "calc(100dvh - 150px)",
      overflowY: "auto",
      overflowX: "hidden",
    },
  };
}

export interface IUseScrollableBodyModalPropsProps {
  newStyleFunc?: typeof newDefaultStyle;
}

export default function useScrollableBodyModalProps({
  newStyleFunc = newDefaultStyle,
}: IUseScrollableBodyModalPropsProps): Partial<ModalProps> {
  const isMobile = useMobile();
  return useMemo<ModalProps>(
    () => ({
      styles: newStyleFunc(isMobile),
    }),
    [isMobile, newStyleFunc],
  );
}
