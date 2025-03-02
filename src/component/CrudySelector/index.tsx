import { IBase } from "@allape/gocrud/src/model";
import { useLoading, useProxy } from "@allape/use-loading";
import { Divider, Select, SelectProps, Spin } from "antd";
import { DefaultOptionType } from "rc-select/lib/Select";
import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Crudy from "../../api/antd.ts";
import { ILV } from "../../helper/antd.tsx";
import EventEmitter, { EEEventListener } from "../../helper/eventemitter.ts";

export type Millisecond = number;

export function BuildOptions<T, V extends string | number>(
  records: T[],
  labelPropName: keyof T | string,
  valuePropName: keyof T | string,
): ILV<V>[] {
  return records.map((record) => ({
    label: record[labelPropName as keyof T] as string,
    value: record[valuePropName as keyof T] as V,
  }));
}

export interface ICrudySelectorProps<T, KEYWORDS = unknown>
  extends Omit<SelectProps, "children"> {
  buildOptions?: typeof BuildOptions<T, IBase["id"]>;
  crudy: Crudy<T>;
  pageSize?: number;
  labelPropName?: keyof T | string;
  searchPropName?: keyof T | keyof KEYWORDS | string;
  valuePropName?: keyof T | string;
  searchParams?: KEYWORDS;
  emitter?: EventEmitter<"changed", T[] | undefined>;
  onLoaded?: (records: T[]) => void;
  searchDelay?: Millisecond;
  inKeyword?: string;
}

export default function CrudySelector<T extends IBase, KW = unknown>({
  buildOptions: buildOptionsFromProps,
  value,
  crudy,
  pageSize = 0,
  searchParams,
  labelPropName = "name",
  searchPropName = "",
  valuePropName = "id",
  searchDelay = 200,
  emitter,
  onLoaded,
  inKeyword,
  children,
  ...props
}: PropsWithChildren<ICrudySelectorProps<T, KW>>): React.ReactElement {
  const { loading, execute } = useLoading();

  const [, currentRef, setCurrent] = useProxy<T[]>([]);
  const [records, setRecords] = useState<DefaultOptionType[]>([]);

  const buildOptions = useCallback(
    (records: T[]) => {
      return (buildOptionsFromProps || BuildOptions)(
        records,
        labelPropName,
        valuePropName,
      );
    },
    [buildOptionsFromProps, labelPropName, valuePropName],
  );

  const getList = useCallback(
    (keyword?: string) => {
      execute(async () => {
        let records: T[];

        if (pageSize > 0) {
          records = await crudy.page(1, pageSize, {
            ...searchParams,
            [searchPropName || labelPropName]: keyword,
          });
          currentRef.current.forEach((selected) => {
            if (!records.find((record) => record.id === selected.id)) {
              records.push(selected);
            }
          });
        } else {
          records = await crudy.all({
            ...searchParams,
            [searchPropName || labelPropName]: keyword,
          });
        }

        onLoaded?.(records);
        setRecords(buildOptions(records));
      }).then();
    },
    [
      execute,
      pageSize,
      currentRef,
      onLoaded,
      buildOptions,
      labelPropName,
      crudy,
      searchParams,
      searchPropName,
    ],
  );

  useEffect(() => {
    if (
      pageSize === 0 ||
      !value ||
      (value instanceof Array && value.length === 0)
    ) {
      setCurrent([]);
      return;
    }

    execute(async () => {
      const ids = [];
      if (value instanceof Array) {
        ids.push(...value);
      } else {
        ids.push(value);
      }

      let records: T[] = [];

      if (inKeyword) {
        records = await crudy.all({
          [inKeyword]: ids,
        });
      } else {
        records = await Promise.all(ids.map((id) => crudy.one(id)));
      }

      setCurrent(records);

      if (records.length !== 0) {
        setRecords((old) => [
          ...old,
          ...buildOptions(
            records.filter((i) => !old.find((j) => j.value === i.id)),
          ),
        ]);
      }
    }).then();
  }, [buildOptions, crudy, execute, inKeyword, pageSize, setCurrent, value]);

  useEffect(() => {
    getList();

    if (!emitter) {
      return;
    }

    const handleChanged: EEEventListener<"changed", T[] | undefined> = (e) => {
      if (e.value) {
        setRecords(buildOptions(e.value));
      } else {
        getList();
      }
    };

    emitter.addEventListener("changed", handleChanged);
    return () => {
      emitter.removeEventListener("changed", handleChanged);
    };
  }, [buildOptions, emitter, getList]);

  const searchTimerRef = useRef<number>(-1);

  useEffect(() => {
    return () => {
      clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handleSearch = useCallback(
    (keywords: string) => {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        getList(keywords);
      }, searchDelay) as unknown as number;
    },
    [getList, searchDelay],
  );

  return (
    <Spin spinning={loading}>
      {children ? (
        <>
          {children}
          <Divider style={{ margin: "10px 0" }} />
        </>
      ) : undefined}
      <Select
        {...props}
        value={value}
        onSearch={handleSearch}
        filterOption={false}
        showSearch
        autoClearSearchValue
        options={records}
      />
    </Spin>
  );
}
