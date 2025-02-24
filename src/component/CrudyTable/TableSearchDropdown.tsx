import { i18n } from "@allape/gocrud";
import { IBase } from "@allape/gocrud/src/model";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Input, InputRef, Space, TableColumnType } from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import { ReactElement, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Default from "../../i18n";

export interface ITableSearchDropdownProps {
  props?: FilterDropdownProps;
  name: string;
  onSearch?: (value: string) => void;
}

export default function TableSearchDropdown({
  props,
  name,
  onSearch,
}: ITableSearchDropdownProps): ReactElement {
  const { t } = useTranslation();

  const inputRef = useRef<InputRef | null>(null);
  const [value, setValue] = useState<string>("");
  const handleSearch = (keywords?: string) => {
    onSearch?.(keywords ?? value);
    props?.close?.();
  };

  useEffect(() => {
    if (props?.visible) {
      const id = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(id);
    }
  }, [props]);

  return (
    <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
      <Input
        ref={inputRef}
        placeholder={`${i18n.ot("gocrud.search", Default.gocrud.search, t)} ${name}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPressEnter={() => handleSearch()}
        style={{ marginBottom: 8, display: "block" }}
      />
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
        <Button
          onClick={() => {
            setValue("");
            handleSearch("");
          }}
          size="small"
          style={{ width: 90 }}
        >
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
export function searchable<T extends IBase>(
  name: string,
  onSearch: Exclude<ITableSearchDropdownProps["onSearch"], undefined>,
): Partial<TableColumnType<T>> {
  return {
    filterSearch: true,
    filterDropdown: (props) => (
      <TableSearchDropdown props={props} name={name} onSearch={onSearch} />
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
  };
}
