import { i18n } from "@allape/gocrud";
import { IBase } from "@allape/gocrud/src/model";
import { useProxy } from "@allape/use-loading";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Input, InputRef, Space, TableColumnType } from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import { ReactElement, ReactNode, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Default from "../../i18n";

export interface ITableSearchDropdownProps<T> {
  props?: FilterDropdownProps;
  name: string;
  onSearch?: (value: T | undefined) => void;
  children?: (value: T | undefined, onChange: (value?: T) => void) => ReactNode;
}

export default function TableSearchDropdown<T = string>({
  props,
  name,
  onSearch,
  children,
}: ITableSearchDropdownProps<T>): ReactElement {
  const { t } = useTranslation();

  const inputRef = useRef<InputRef | null>(null);

  const [value, valueRef, setValue] = useProxy<T | undefined>(undefined);

  const handleSearch = useCallback(() => {
    onSearch?.(valueRef.current);
    props?.close?.();
  }, [onSearch, props, valueRef]);

  const handleReset = useCallback(() => {
    setValue(undefined);
    onSearch?.(undefined);
    props?.close?.();
  }, [onSearch, props, setValue]);

  useEffect(() => {
    if (props?.visible) {
      const id = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(id);
    }
  }, [props]);

  return (
    <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
      <div style={{ marginBottom: 8, display: "block" }}>
        {children ? (
          children(value, setValue)
        ) : (
          <Input
            ref={inputRef}
            placeholder={`${i18n.ot("gocrud.search", Default.gocrud.search, t)} ${name}`}
            value={value as string}
            onChange={(e) => setValue(e.target.value as T)}
            onPressEnter={() => handleSearch()}
          />
        )}
      </div>
      <Space>
        <Button
          type="primary"
          onClick={() => handleSearch()}
          icon={<SearchOutlined />}
          size="small"
          style={{ width: 90 }}
        >
          {i18n.ot("gocrud.search", Default.gocrud.search, t)}
        </Button>
        <Button onClick={handleReset} size="small" style={{ width: 90 }}>
          {i18n.ot("gocrud.reset", Default.gocrud.reset, t)}
        </Button>
        <Button type="link" size="small" onClick={props?.close}>
          {i18n.ot("gocrud.close", Default.gocrud.close, t)}
        </Button>
      </Space>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function searchable<T extends IBase, V = string>(
  name: string,
  onSearch: Exclude<ITableSearchDropdownProps<V>["onSearch"], undefined>,
  children?: ITableSearchDropdownProps<V>["children"],
): Partial<TableColumnType<T>> {
  return {
    filterSearch: true,
    filterDropdown: (props) => (
      <TableSearchDropdown<V>
        props={props}
        name={name}
        onSearch={onSearch}
        children={children}
      />
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
  };
}
