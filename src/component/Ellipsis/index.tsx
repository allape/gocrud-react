import { i18n } from "@allape/gocrud";
import { Tooltip } from "antd";
import { CSSProperties, ReactElement, ReactNode } from "react";
import Default from "../../i18n";
import ClickToReview from "../ClickToReview";

export interface IEllipsisProps {
  length?: number;
  seekAt?: "start" | "end";
  placeholder?: ReactNode;
  ellipsis?: ReactNode;
  children?: string;
  labelClassname?: string;
  labelStyle?: CSSProperties;
  childrenClassname?: string;
  childrenStyle?: CSSProperties;
}

export default function Ellipsis({
  length = 25,
  seekAt = "start",
  ellipsis = "...",
  placeholder = "-",
  children,
  labelClassname,
  labelStyle,
  childrenClassname,
  childrenStyle,
}: IEllipsisProps): ReactElement {
  if (!children) {
    return <>{placeholder}</>;
  }

  if (children.length <= length) {
    return <>{children}</>;
  }

  let label: ReactNode;
  if (seekAt == "start") {
    label = (
      <>
        {children.substring(0, length)}
        {ellipsis}
      </>
    );
  } else {
    label = (
      <>
        {ellipsis}
        {children.substring(children.length - length)}
      </>
    );
  }

  const partial = (
    <span
      className={labelClassname}
      style={{ whiteSpace: "nowrap", ...labelStyle }}
    >
      {label}
    </span>
  );

  const complete = (
    <code
      className={childrenClassname}
      style={{
        wordBreak: "break-all",
        whiteSpace: "break-spaces",
        ...childrenStyle,
      }}
    >
      {children}
    </code>
  );

  if (children.length <= 5 * length) {
    return <Tooltip title={complete}>{partial}</Tooltip>;
  }

  return (
    <ClickToReview
      tooltip={i18n.ot("gocrud.clickToReview", Default.gocrud.clickToReview)}
      title={i18n.ot("gocrud.viewer", Default.gocrud.viewer)}
      okText={i18n.ot("gocrud.close", Default.gocrud.close)}
      content={complete}
    >
      {partial}
    </ClickToReview>
  );
}
