import { IBase } from "@allape/gocrud/src/model";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Input, Space, TableColumnType } from "antd";
import { ReactElement, useState } from "react";

export interface ITableSearchDropdownProps {
  dataIndex: string;
  onSearch?: (dataIndex: string, value: string) => void;
  onClose?: () => void;
}

export default function TableSearchDropdown({
  dataIndex,
  onSearch,
  onClose,
}: ITableSearchDropdownProps): ReactElement {
  const [value, setValue] = useState<string>("");
  const handleSearch = (keywords?: string) => {
    onSearch?.(dataIndex, keywords ?? value);
  };
  return (
    <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
      <Input
        placeholder={`Search ${dataIndex}`}
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
          Search
        </Button>
        <Button
          onClick={() => {
            setValue("");
            handleSearch("");
            onClose?.();
          }}
          size="small"
          style={{ width: 90 }}
        >
          Reset
        </Button>
        <Button type="link" size="small" onClick={onClose}>
          Close
        </Button>
      </Space>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function searchable<T extends IBase>(
  dataIndex: string,
  onSearch: Exclude<ITableSearchDropdownProps["onSearch"], undefined>,
): Partial<TableColumnType<T>> {
  return {
    filterSearch: true,
    filterDropdown: ({ close }) => (
      <TableSearchDropdown
        dataIndex={dataIndex}
        onSearch={onSearch}
        onClose={close}
      />
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
  };
}
