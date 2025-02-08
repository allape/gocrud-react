import { IBase } from "@allape/gocrud/src/model";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Input, InputRef, Space, TableColumnType } from "antd";
import { FilterDropdownProps } from "antd/es/table/interface";
import { ReactElement, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Default from "../../i18n";

export interface ITableSearchDropdownProps {
  props?: FilterDropdownProps;
  dataIndex: string;
  name: string;
  onSearch?: (dataIndex: string, value: string) => void;
}

export default function TableSearchDropdown({
  props,
  dataIndex,
  name,
  onSearch,
}: ITableSearchDropdownProps): ReactElement {
  const { t } = useTranslation();

  const inputRef = useRef<InputRef | null>(null);
  const [value, setValue] = useState<string>("");
  const handleSearch = (keywords?: string) => {
    onSearch?.(dataIndex, keywords ?? value);
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
        placeholder={`${t("gocrud.search") || Default.gocrud.search} ${name}`}
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
          {t("gocrud.search") || Default.gocrud.search}
        </Button>
        <Button
          onClick={() => {
            setValue("");
            handleSearch("");
          }}
          size="small"
          style={{ width: 90 }}
        >
          {t("gocrud.reset") || Default.gocrud.reset}
        </Button>
        <Button type="link" size="small" onClick={props?.close}>
          {t("gocrud.close") || Default.gocrud.close}
        </Button>
      </Space>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function searchable<T extends IBase>(
  dataIndex: string,
  name: string,
  onSearch: Exclude<ITableSearchDropdownProps["onSearch"], undefined>,
): Partial<TableColumnType<T>> {
  return {
    filterSearch: true,
    filterDropdown: (props) => (
      <TableSearchDropdown
        props={props}
        dataIndex={dataIndex}
        name={name}
        onSearch={onSearch}
      />
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
  };
}
