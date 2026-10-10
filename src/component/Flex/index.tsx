import cls from "classnames";
import React, {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  HTMLProps,
  PropsWithChildren,
} from "react";
import styles from "./style.module.scss";

export interface IFlexProps
  extends
    Pick<
      CSSProperties,
      "alignItems" | "justifyContent" | "gap" | "flexDirection" | "flexWrap"
    >,
    HTMLProps<HTMLDivElement> {}

function Flex(
  {
    alignItems = "center",
    justifyContent = "center",
    gap = "10px",
    flexDirection,
    flexWrap,

    className,
    style,

    children,

    ...props
  }: PropsWithChildren<IFlexProps>,
  ref: ForwardedRef<HTMLDivElement>,
): React.ReactElement {
  return (
    <div
      ref={ref}
      className={cls(styles.wrapper, className)}
      style={{
        alignItems,
        justifyContent,
        gap,
        flexDirection,
        flexWrap,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export default forwardRef<HTMLDivElement, IFlexProps>(Flex);
