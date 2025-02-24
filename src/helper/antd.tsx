import { i18n } from "@allape/gocrud";
import { SelectProps, TableProps, Tooltip } from "antd";
import type { FormInstance } from "rc-field-form/es/interface";
import React from "react";
import ClickToReview from "../component/ClickToReview";
import Default from "../i18n";

export type RecursivePartial<T> = Parameters<
  FormInstance<T>["setFieldsValue"]
>[0];

export type Pagination = Exclude<TableProps["pagination"], false | undefined>;

export type LVs = Exclude<SelectProps["options"], undefined>;

export type LV = LVs[number];

export interface ILV<VALUE extends LV["value"]> extends LV {
  value: VALUE;
}

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
      <ClickToReview
        tooltip={i18n.ot("gocrud.clickToReview", Default.gocrud.clickToReview)}
        title={i18n.ot("gocrud.viewer", Default.gocrud.viewer)}
        okText={i18n.ot("gocrud.close", Default.gocrud.close)}
        content={complete}
      >
        {partial}
      </ClickToReview>
    );
  };
}
