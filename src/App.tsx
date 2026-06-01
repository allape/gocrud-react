import { BaseSearchParams, IBaseSearchParams } from "@allape/gocrud";
import { IBase } from "@allape/gocrud/src/model";
import { ITimeSortSearchParams } from "@allape/gocrud/src/model.ts";
import { Form, Input, TableColumnsType } from "antd";
import { ReactElement, useMemo, useState } from "react";
import AntdCrudy, { CrudyTable } from "../index.ts";
import { asDefaultPattern } from "./helper/datetime.ts";

const UserCrudy = new AntdCrudy<IUser>("http://127.0.0.1:8080/user");

export interface IUser extends IBase {
  name: string;
}

export interface IUserSearchParams
  extends IBaseSearchParams, ITimeSortSearchParams {
  like_name?: string;
}

type IRecord = IUser;
type ISearchParams = IUserSearchParams;

export default function App(): ReactElement {
  const [searchParams /*setSearchParams*/] = useState<ISearchParams>(() => ({
    ...BaseSearchParams,
    orderBy_updatedAt: "desc",
  }));

  const columns = useMemo<TableColumnsType<IRecord>>(
    () => [
      {
        title: "ID",
        dataIndex: "id",
      },
      {
        title: "Name",
        dataIndex: "name",
      },
      {
        title: "Created At",
        dataIndex: "createdAt",
        render: asDefaultPattern,
      },
      {
        title: "Updated At",
        dataIndex: "updatedAt",
        render: asDefaultPattern,
      },
    ],
    [],
  );

  return (
    <CrudyTable<IRecord, ISearchParams>
      name="User"
      crudy={UserCrudy}
      columns={columns}
      searchParams={searchParams}
      titleSearchField="like_name"
    >
      <Form.Item name="name" label="Name" rules={[{ required: true }]}>
        <Input maxLength={200} placeholder="Name" />
      </Form.Item>
    </CrudyTable>
  );
}
