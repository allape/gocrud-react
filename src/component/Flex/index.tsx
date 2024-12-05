import React, { CSSProperties, PropsWithChildren } from "react";
import styles from "./style.module.scss";

export type ICenterCenterProps = Pick<
  CSSProperties,
  "alignItems" | "justifyContent" | "gap" | "flexDirection" | "flexWrap"
>;

export default function Flex({
  children,
  alignItems = "center",
  justifyContent = "center",
  gap = "10px",
  flexDirection,
  flexWrap,
}: PropsWithChildren<ICenterCenterProps>): React.ReactElement {
  return (
    <div
      className={styles.wrapper}
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
