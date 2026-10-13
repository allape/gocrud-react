import { FormInstance, FormProps, SelectProps, TableProps } from "antd";
import type { GenerateSemantic } from "antd/es/_util/hooks/useMergeSemantic/semanticType";
import type React from "react";

export type RecursivePartial<T> = Parameters<
  FormInstance<T>["setFieldsValue"]
>[0];

export type Pagination = Exclude<TableProps["pagination"], false | undefined>;

export type LVs = Exclude<SelectProps["options"], undefined>;

export type LV = LVs[number];

export interface ILV<VALUE extends LV["value"]> extends LV {
  value: VALUE;
}

export interface IColoredLV<VALUE extends LV["value"]> extends ILV<VALUE> {
  color?: string;
}

export const AntdFormLayoutProps: Pick<FormProps, "labelCol" | "wrapperCol"> = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

export function mergeSemanticType<
  PROPS extends {
    classNames?: GenerateSemantic<SEMANTIC_TYPE, PROPS>["classNamesAndFn"];
    styles?: GenerateSemantic<SEMANTIC_TYPE, PROPS>["stylesAndFn"];
  },
  SEMANTIC_TYPE extends {
    classNames?: Record<string, string | undefined>;
    styles?: Record<string, React.CSSProperties | undefined>;
  },
  TYPE extends "classNames" | "styles",
  TYPE_FN extends "classNamesAndFn" | "stylesAndFn" = TYPE extends "classNames"
    ? "classNamesAndFn"
    : "stylesAndFn",
>(
  src: GenerateSemantic<SEMANTIC_TYPE, PROPS>[TYPE_FN],
  handler: (
    old: SEMANTIC_TYPE[TYPE],
  ) => GenerateSemantic<SEMANTIC_TYPE, PROPS>[TYPE_FN],
): GenerateSemantic<SEMANTIC_TYPE, PROPS>[TYPE_FN] {
  if (src instanceof Function) {
    return ((info: { props: PROPS }) => {
      return handler(src(info) as SEMANTIC_TYPE[TYPE]);
    }) as unknown as GenerateSemantic<SEMANTIC_TYPE, PROPS>[TYPE_FN];
  }
  return handler(src as unknown as SEMANTIC_TYPE[TYPE]);
}
