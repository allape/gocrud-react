import { useLoading } from "@allape/use-loading";
import { Select, SelectProps, Spin } from "antd";
import { DefaultOptionType } from "rc-select/lib/Select";
import React, { useCallback, useEffect, useState } from "react";
import Crudy from "../../api/antd.ts";
import EventEmitter, { EEEventListener } from "../../helper/eventemitter.ts";

export interface ICrudySelectorProps<T, KEYWORDS = unknown>
  extends SelectProps {
  crudy: Crudy<T>;
  labelPropName?: keyof T | string;
  valuePropName?: keyof T | string;
  searchParams?: KEYWORDS;
  emitter?: EventEmitter<"changed", T[] | undefined>;
  onLoaded?: (records: T[]) => void;
}

export default function CrudySelector<T, KW = unknown>({
  crudy,
  searchParams,
  labelPropName = "name",
  valuePropName = "id",
  emitter,
  onLoaded,
  ...props
}: ICrudySelectorProps<T, KW>): React.ReactElement {
  const { loading, execute } = useLoading();
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

  const getList = useCallback(() => {
    execute(async () => {
      const records = await crudy.all(searchParams);
      onLoaded?.(records);
      formatOptions(records);
    }).then();
  }, [crudy, execute, formatOptions, onLoaded, searchParams]);

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
        showSearch
        optionFilterProp="label"
        {...props}
        options={records}
      />
    </Spin>
  );
}
