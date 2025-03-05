import { IBase } from "@allape/gocrud/src/model.ts";
import { SelectProps } from "antd";
import { DefaultOptionType } from "rc-select/lib/Select";
import { Dispatch, SetStateAction, useCallback, useEffect } from "react";
import Crudy from "../../api/antd.ts";
import { ILV } from "../../helper/antd.tsx";
import EventEmitter, { EEEventListener } from "../../helper/eventemitter.ts";

export const DefaultValueField = "id";
export const DefaultLabelField = "name";

export type Millisecond = number;

export function BuildOptions<
  T extends IBase = IBase,
  V extends string | number = T["id"],
>(
  records: T[],
  labelPropName: keyof T | string,
  valuePropName: keyof T | string,
): ILV<V>[] {
  return records.map((record) => ({
    label: record[labelPropName as keyof T] as string,
    value: record[valuePropName as keyof T] as V,
  }));
}

export interface ICrudySelectorBaseProps<
  T extends IBase,
  KEYWORDS extends object = object,
> extends Omit<SelectProps, "children" | "options"> {
  crudy: Crudy<T>;
  buildOptions?: typeof BuildOptions<T>;
  labelPropName?: keyof T | string;
  valuePropName?: keyof T | string;
  searchParams?: KEYWORDS;
  emitter?: EventEmitter<"changed", T[] | undefined>;
  onLoaded?: (records: T[]) => void;
}

export function useOptionsBuildFunc<
  T extends IBase,
  KEYWORDS extends object = object,
>({
  buildOptions,
  labelPropName,
  valuePropName,
}: ICrudySelectorBaseProps<T, KEYWORDS>) {
  return useCallback(
    (records: T[]) => {
      return (buildOptions || BuildOptions)(
        records,
        labelPropName || DefaultLabelField,
        valuePropName || DefaultValueField,
      );
    },
    [buildOptions, labelPropName, valuePropName],
  );
}

export function useEmitter<T extends IBase, KEYWORDS extends object = object>(
  buildOptions: ReturnType<typeof useOptionsBuildFunc<T, KEYWORDS>>,
  emitter: ICrudySelectorBaseProps<T, KEYWORDS>["emitter"],
  setOptions: Dispatch<SetStateAction<DefaultOptionType[]>>,
  getList: () => void,
) {
  useEffect(() => {
    getList();

    if (!emitter) {
      return;
    }

    const handleChanged: EEEventListener<"changed", T[] | undefined> = (e) => {
      if (e.value) {
        setOptions(buildOptions(e.value));
      } else {
        getList();
      }
    };

    emitter.addEventListener("changed", handleChanged);
    return () => {
      emitter.removeEventListener("changed", handleChanged);
    };
  }, [buildOptions, emitter, getList, setOptions]);
}
