import { IBase } from "@allape/gocrud/src/model";
import { useLoading } from "@allape/use-loading";
import { Select, Spin } from "antd";
import { DefaultOptionType } from "rc-select/lib/Select";
import React, { PropsWithChildren, useCallback, useState } from "react";
import ChildrenWrapper from "./ChildrenWrapper.tsx";
import {
  ICrudySelectorBaseProps,
  useEmitter,
  useOptionsBuildFunc,
} from "./selector.ts";

export type ICrudySelectorProps<
  T extends IBase,
  KEYWORDS extends object = object,
> = ICrudySelectorBaseProps<T, KEYWORDS>;

export default function CrudySelector<
  T extends IBase = IBase,
  KEYWORDS extends object = object,
>(
  props: PropsWithChildren<ICrudySelectorProps<T, KEYWORDS>>,
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
      const records = await crudy.all<KEYWORDS>(searchParams);
      onLoaded?.(records);
      setOptions(buildOptions(records));
    }).then();
  }, [execute, onLoaded, buildOptions, crudy, searchParams]);

  useEmitter(buildOptions, emitter, setOptions, getList);

  return (
    <Spin spinning={loading}>
      <ChildrenWrapper>{children}</ChildrenWrapper>
      <Select
        {...selectorProps}
        value={value}
        optionFilterProp="label"
        filterOption={false}
        showSearch
        autoClearSearchValue
        options={options}
      />
    </Spin>
  );
}
