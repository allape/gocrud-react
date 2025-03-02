import { IBase } from "@allape/gocrud/src/model";
import { useLoading } from "@allape/use-loading";
import { Select, Spin } from "antd";
import { DefaultOptionType } from "rc-select/lib/Select";
import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import ChildrenWrapper from "./ChildrenWrapper.tsx";
import {
  DefaultLabelField,
  ICrudySelectorBaseProps,
  Millisecond,
  useEmitter,
  useOptionsBuildFunc,
} from "./selector.ts";

export interface ICrudySelectorProps<
  T extends IBase,
  KEYWORDS extends object = object,
> extends ICrudySelectorBaseProps<T, KEYWORDS> {
  pageSize?: number;
  searchDelay?: Millisecond;
  searchPropName?: keyof T | keyof KEYWORDS | string;
  inKeyword?: keyof T | keyof KEYWORDS | string;
}

export default function PagedCrudySelector<
  T extends IBase = IBase,
  KEYWORDS extends object = object,
>(
  props: PropsWithChildren<ICrudySelectorProps<T, KEYWORDS>>,
): React.ReactElement {
  const {
    value,
    crudy,
    pageSize = 20,
    searchParams,
    labelPropName = DefaultLabelField,
    searchPropName,
    searchDelay = 200,
    emitter,
    onLoaded,
    inKeyword,
    children,
    ...selectorProps
  } = props;

  const { loading, execute } = useLoading();

  const currentRef = useRef<T[]>([]);
  const recordsRef = useRef<T[]>([]);

  const [options, setOptions] = useState<DefaultOptionType[]>([]);

  const buildOptions = useOptionsBuildFunc<T, KEYWORDS>(props);

  const getList = useCallback(
    (keyword?: string) => {
      execute(async () => {
        const records = await crudy.page(1, pageSize, {
          ...searchParams,
          [searchPropName || labelPropName]: keyword,
        });

        currentRef.current.forEach((selected) => {
          if (!records.find((record) => record.id === selected.id)) {
            records.push(selected);
          }
        });

        recordsRef.current = records;

        onLoaded?.(records);
        setOptions(buildOptions(records));
      }).then();
    },
    [
      execute,
      crudy,
      pageSize,
      searchParams,
      searchPropName,
      labelPropName,
      currentRef,
      onLoaded,
      setOptions,
      buildOptions,
    ],
  );

  useEffect(() => {
    if (!value?.length) {
      currentRef.current = [];
      return;
    }

    execute(async () => {
      const ids = value instanceof Array ? value : [value];

      if (ids.length === 0) {
        currentRef.current = [];
        return;
      }

      const exists: T[] = [];
      const notExists: typeof ids = [];
      ids.forEach((id) => {
        const found = recordsRef.current.find((record) => record.id === id);
        if (found) {
          exists.push(found);
        } else {
          notExists.push(id);
        }
      });

      if (notExists.length === 0) {
        currentRef.current = exists;
        return;
      }

      const records = await (inKeyword
        ? crudy.all({
            [inKeyword]: ids,
          })
        : Promise.all(ids.map((id) => crudy.one(id))));

      currentRef.current = [...exists, ...records];

      setOptions((old) => [
        ...old,
        ...buildOptions(
          records.filter((i) => !old.find((j) => j.value === i.id)),
        ),
      ]);
    }).then();
  }, [buildOptions, crudy, execute, inKeyword, pageSize, value]);

  useEmitter(buildOptions, emitter, setOptions, getList);

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
      <ChildrenWrapper>{children}</ChildrenWrapper>
      <Select
        {...selectorProps}
        value={value}
        onSearch={handleSearch}
        filterOption={false}
        showSearch
        autoClearSearchValue
        options={options}
      />
    </Spin>
  );
}
