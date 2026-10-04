import { IBaseSearchParams } from "@allape/gocrud";
import { IBase } from "@allape/gocrud/src/model";
import { useLoading } from "@allape/use-loading";
import { Select, SelectProps, Spin } from "antd";
import { DefaultOptionType } from "antd/es/select/index";
import React, {
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";
import ChildrenWrapper from "./ChildrenWrapper.tsx";
import {
  ICrudySelectorBaseProps,
  useEmitter,
  useOptionsBuildFunc,
} from "./selector.ts";

export type ICrudySelectorProps<
  T extends IBase,
  SearchParams extends IBaseSearchParams = IBaseSearchParams,
> = ICrudySelectorBaseProps<T, SearchParams>;

export default function CrudySelector<
  T extends IBase = IBase,
  SearchParams extends IBaseSearchParams = IBaseSearchParams,
>(
  props: PropsWithChildren<ICrudySelectorProps<T, SearchParams>>,
): React.ReactElement {
  const {
    value,
    crudy,
    searchParams,
    emitter,
    onLoaded,
    children,
    ...selectorProps
  } = props;

  const { loading, execute } = useLoading();

  const [options, setOptions] = useState<DefaultOptionType[]>([]);

  const buildOptions = useOptionsBuildFunc(props);

  const getList = useCallback(() => {
    execute(async () => {
      const records = await crudy.all(searchParams);
      onLoaded?.(records);
      setOptions(buildOptions(records));
    }).then();
  }, [execute, onLoaded, buildOptions, crudy, searchParams]);

  useEmitter(buildOptions, emitter, setOptions, getList);

  const showSearch = useMemo<SelectProps["showSearch"]>(
    () => ({
      optionFilterProp: "label",
      autoClearSearchValue: true,
    }),
    [],
  );

  return (
    <Spin spinning={loading}>
      <ChildrenWrapper>{children}</ChildrenWrapper>
      <Select
        {...selectorProps}
        value={value}
        showSearch={showSearch}
        options={options}
      />
    </Spin>
  );
}
