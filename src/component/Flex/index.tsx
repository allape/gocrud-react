import cls from "classnames";
import {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  HTMLProps,
  PropsWithChildren,
  ReactElement,
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
): ReactElement {
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
