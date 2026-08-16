import { IBase, IBaseSearchParams } from "@allape/gocrud";
import { SelectProps } from "antd";
import { DefaultOptionType } from "rc-select/lib/Select";
import { Dispatch, SetStateAction, useCallback, useEffect } from "react";
import AntdCrudy from "../../api/antd.tsx";
import { ILV } from "../../helper/antd.tsx";
import EventEmitter, { EEEventListener } from "../../helper/eventemitter.ts";

export const DefaultValueField = "id";
export const DefaultLabelField = "name";

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
  SearchParams extends IBaseSearchParams = IBaseSearchParams,
> extends Omit<SelectProps, "children" | "options"> {
  crudy: AntdCrudy<T, SearchParams>;
  buildOptions?: typeof BuildOptions<T>;
  labelPropName?: keyof T | string;
  valuePropName?: keyof T | string;
  searchParams?: SearchParams;
  emitter?: EventEmitter<"changed", T[] | undefined>;
  onLoaded?: (records: T[]) => void;
}

export function useOptionsBuildFunc<
  T extends IBase,
  SearchParams extends IBaseSearchParams = IBaseSearchParams,
>({
  buildOptions,
  labelPropName,
  valuePropName,
}: ICrudySelectorBaseProps<T, SearchParams>) {
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

export function useEmitter<
  T extends IBase,
  SearchParams extends IBaseSearchParams = IBaseSearchParams,
>(
  buildOptions: ReturnType<typeof useOptionsBuildFunc<T, SearchParams>>,
  emitter: ICrudySelectorBaseProps<T, SearchParams>["emitter"],
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
