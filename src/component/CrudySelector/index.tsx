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
  searchPropName?: keyof T | keyof KEYWORDS | string;
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

  const [, currentRef, setCurrent] = useProxy<T[]>([]);
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

        currentRef.current.forEach((selected) => {
          if (!records.find((record) => record.id === selected.id)) {
            records.push(selected);
          }
        });

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
    if (!value || (value instanceof Array && value.length === 0)) {
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
