import { FormProps, SelectProps, TableProps } from "antd";
import type { FormInstance } from "rc-field-form/es/interface";

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
