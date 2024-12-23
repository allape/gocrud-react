import { Modal, Tooltip } from "antd";
import React from "react";

export function EllipsisCell(
  length: number = 25,
  seekAt: "start" | "end" = "start",
  ellipsis: string = "...",
  placeholder: string = "-",
): (v: string) => React.ReactNode {
  return (v: string) => {
    if (!v) {
      return placeholder;
    }

    if (v.length <= length) {
      return v;
    }

    let cutStr: string;
    if (seekAt == "start") {
      cutStr = `${v.substring(0, length)}${ellipsis}`;
    } else {
      cutStr = `${ellipsis}${v.substring(v.length - length)}`;
    }

    const partial = <span style={{ whiteSpace: "nowrap" }}>{cutStr}</span>;

    const complete = (
      <code style={{ wordBreak: "break-all", whiteSpace: "break-spaces" }}>
        {v}
      </code>
    );

    if (v.length <= 5 * length) {
      return <Tooltip title={complete}>{partial}</Tooltip>;
    }

    return (
      <Tooltip title="Click or Tap">
        <span
          style={{ cursor: "pointer" }}
          onClick={() =>
            Modal.info({
              title: "Viewer",
              content: complete,
              width: "calc(100vw - 20px)",
              maskClosable: true,
            })
          }
        >
          {partial}
        </span>
      </Tooltip>
    );
  };
}
