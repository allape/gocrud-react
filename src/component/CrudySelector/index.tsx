import { IBase } from "@allape/gocrud/src/model";
import { useLoading, useProxy } from "@allape/use-loading";
import { Select, SelectProps, Space, Spin } from "antd";
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

export function BuildLV<T, V extends string | number>(
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
  buildLV?: typeof BuildLV<T, IBase["id"]>;
  crudy: Crudy<T>;
  pageSize?: number;
  labelPropName?: keyof T | string;
  searchPropName?: keyof T | keyof KEYWORDS | string;
  valuePropName?: keyof T | string;
  searchParams?: KEYWORDS;
  emitter?: EventEmitter<"changed", T[] | undefined>;
  onLoaded?: (records: T[]) => void;
  searchDelay?: Millisecond;
}

export default function CrudySelector<T extends IBase, KW = unknown>({
  buildLV = BuildLV,
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
  children,
  ...props
}: PropsWithChildren<ICrudySelectorProps<T, KW>>): React.ReactElement {
  const { loading, execute } = useLoading();

  const [, currentRef, setCurrent] = useProxy<T[]>([]);
  const [records, setRecords] = useState<DefaultOptionType[]>([]);

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
        setRecords(buildLV(records, labelPropName, valuePropName));
      }).then();
    },
    [
      execute,
      pageSize,
      currentRef,
      onLoaded,
      buildLV,
      labelPropName,
      valuePropName,
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

      const users = await Promise.all(ids.map((id) => crudy.one(id)));
      setCurrent(users);
      setRecords((old) =>
        users.length === 0
          ? old
          : [
              ...old,
              ...users.filter((i) => !old.find((j) => j.value === i.id)),
            ],
      );
    }).then();
  }, [crudy, execute, pageSize, setCurrent, value]);

  useEffect(() => {
    getList();

    if (!emitter) {
      return;
    }

    const handleChanged: EEEventListener<"changed", T[] | undefined> = (e) => {
      if (e.value) {
        setRecords(buildLV(e.value, labelPropName, valuePropName));
      } else {
        getList();
      }
    };

    emitter.addEventListener("changed", handleChanged);
    return () => {
      emitter.removeEventListener("changed", handleChanged);
    };
  }, [buildLV, emitter, getList, labelPropName, valuePropName]);

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
      <Space.Compact>
        <Select
          {...props}
          value={value}
          onSearch={handleSearch}
          filterOption={false}
          showSearch
          autoClearSearchValue
          options={records}
        />
        {children}
      </Space.Compact>
    </Spin>
  );
}
