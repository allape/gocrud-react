import { Modal, TableProps, Tooltip } from "antd";
import { FormInstance } from "rc-field-form/es/interface";
import React from "react";

export type RecursivePartial<T> = Parameters<
  FormInstance<T>["setFieldsValue"]
>[0];

export type Pagination = Exclude<TableProps["pagination"], false | undefined>;

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
          onClick={() =>
            Modal.info({
              title: "Viewer",
              content: complete,
              width: "calc(100vw - 20px)",
              maskClosable: true,
              style: { top: "10px", cursor: "pointer" },
            })
          }
        >
          {partial}
        </span>
      </Tooltip>
    );
  };
}
