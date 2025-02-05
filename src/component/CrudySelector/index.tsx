import { IBase } from "@allape/gocrud/src/model";
import { useLoading, useProxy } from "@allape/use-loading";
import { Select, SelectProps, Spin } from "antd";
import { DefaultOptionType } from "rc-select/lib/Select";
import React, { useCallback, useEffect, useState } from "react";
import Crudy from "../../api/antd.ts";
import EventEmitter, { EEEventListener } from "../../helper/eventemitter.ts";

export interface ICrudySelectorProps<T, KEYWORDS = unknown>
  extends SelectProps {
  crudy: Crudy<T>;
  pageSize?: number;
  labelPropName?: keyof T | string;
  searchPropName?: keyof T | string;
  valuePropName?: keyof T | string;
  searchParams?: KEYWORDS;
  emitter?: EventEmitter<"changed", T[] | undefined>;
  onLoaded?: (records: T[]) => void;
}

export default function CrudySelector<T extends IBase, KW = unknown>({
  value,
  crudy,
  pageSize = 0,
  searchParams,
  labelPropName = "name",
  searchPropName = "",
  valuePropName = "id",
  emitter,
  onLoaded,
  ...props
}: ICrudySelectorProps<T, KW>): React.ReactElement {
  const { loading, execute } = useLoading();

  const [, currentRef, setCurrent] = useProxy<T | undefined>(undefined);
  const [records, setRecords] = useState<DefaultOptionType[]>([]);

  const formatOptions = useCallback(
    (records: T[]) => {
      setRecords(
        records.map((record) => ({
          label: record[labelPropName as keyof T] as string,
          value: record[valuePropName as keyof T] as string,
        })),
      );
    },
    [labelPropName, valuePropName],
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
        } else {
          records = await crudy.all({
            ...searchParams,
            [searchPropName || labelPropName]: keyword,
          });
        }

        if (
          currentRef.current &&
          !records.find((record) => record.id === currentRef.current?.id)
        ) {
          records.push(currentRef.current);
        }

        onLoaded?.(records);
        formatOptions(records);
      }).then();
    },
    [
      execute,
      pageSize,
      currentRef,
      onLoaded,
      formatOptions,
      crudy,
      searchParams,
      searchPropName,
      labelPropName,
    ],
  );

  useEffect(() => {
    if (!value) {
      setCurrent(undefined);
      return;
    }
    execute(async () => {
      const one = await crudy.one(value);
      setRecords((old) =>
        old.find((i) => i.id === one.id) ? old : [...old, one],
      );
    }).then();
  }, [crudy, execute, setCurrent, value]);

  useEffect(() => {
    getList();

    if (!emitter) {
      return;
    }

    const handleChanged: EEEventListener<"changed", T[] | undefined> = (e) => {
      if (e.value) {
        formatOptions(e.value);
      } else {
        getList();
      }
    };

    emitter.addEventListener("changed", handleChanged);
    return () => {
      emitter.removeEventListener("changed", handleChanged);
    };
  }, [emitter, formatOptions, getList]);

  return (
    <Spin spinning={loading}>
      <Select
        {...props}
        value={value}
        onSearch={getList}
        filterOption={false}
        showSearch
        options={records}
      />
    </Spin>
  );
}
