import cls from "classnames";
import React, { CSSProperties, PropsWithChildren } from "react";
import styles from "./style.module.scss";

export interface ICenterCenterProps
  extends Pick<
    CSSProperties,
    "alignItems" | "justifyContent" | "gap" | "flexDirection" | "flexWrap"
  > {
  className?: string;
}

export default function Flex({
  children,
  className,
  alignItems = "center",
  justifyContent = "center",
  gap = "10px",
  flexDirection,
  flexWrap,
}: PropsWithChildren<ICenterCenterProps>): React.ReactElement {
  return (
    <div
      className={cls(styles.wrapper, className)}
      style={{
        alignItems,
        justifyContent,
        gap,
        flexDirection,
        flexWrap,
      }}
    >
      {children}
    </div>
  );
}
