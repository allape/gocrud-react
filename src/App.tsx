import { BaseSearchParams, IBaseSearchParams } from "@allape/gocrud";
import { IBase } from "@allape/gocrud/src/model";
import { useLoading } from "@allape/use-loading";
import { Button, Form, Input, TableColumnsType, Tag } from "antd";
import { ReactElement, useCallback, useMemo, useState } from "react";
import AntdCrudy, {
  AntdM2MConnectorHandler,
  CrudyTable,
  NewCrudyButtonEventEmitter,
} from "../index.ts";
import { asDefaultPattern } from "./helper/datetime.ts";

export interface IUser extends IBase {
  name: string;
}

export interface IUserSearchParams extends IBaseSearchParams {
  like_name?: string;
  name?: string;
}

export interface ITag extends IBase {
  name: string;
}

export interface ITagSearchParams extends IBaseSearchParams {
  like_name?: string;
  name?: string;
}

export interface IUserTag extends Pick<IBase, "createdAt"> {
  userId: IUser["id"];
  tagId: ITag["id"];
}

const UserCrudy = new AntdCrudy<IUser, IUserSearchParams>(
  "http://127.0.0.1:8080/user",
);

const TagCrudy = new AntdCrudy<ITag, ITagSearchParams>(
  "http://127.0.0.1:8080/tag",
);

const UserTagHandler = new AntdM2MConnectorHandler<IUser, ITag, IUserTag>(
  "http://127.0.0.1:8080/user-tag",
  UserCrudy,
  TagCrudy,
  "userId",
  "tagId",
);

interface IUserModified extends IUser {
  _tags?: ITag[];
  _tagIds?: ITag["id"][];
}

type IRecord = IUserModified;
type ISearchParams = IUserSearchParams;

export default function App(): ReactElement {
  const { loading, execute } = useLoading();

  const emitter = useMemo(
    () => NewCrudyButtonEventEmitter<IUser, IUserSearchParams>(),
    [],
  );

  const [searchParams /*setSearchParams*/] = useState<ISearchParams>(() => ({
    ...BaseSearchParams,
    sortByPriorityThenUpdatedAt: true,
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
        title: "Tags",
        dataIndex: "_tags",
        render: (tags?: ITag[]) => {
          return (
            <>
              {tags?.map((t) => (
                <div key={t.id}>
                  <Tag>{t.name}</Tag>
                </div>
              )) || "---"}
            </>
          );
        },
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

  const handleAfterList = useCallback(
    async (records: IRecord[]): Promise<IRecord[]> => {
      const userTags = await UserTagHandler.get<ITag>(
        "userId",
        records.map((r) => r.id),
      );
      Object.entries(userTags).map(([userId, tags]) => {
        const user = records.find((r) => `${r.id}` === userId);
        if (!user) {
          return;
        }
        user._tags = tags;
        user._tagIds = tags.map((t) => t.id);
      });
      return records;
    },
    [],
  );

  const handleInitTestData = useCallback(async () => {
    await execute(async () => {
      await Promise.all([
        UserCrudy.save({
          id: 1,
          name: "User Number 1",
        }),
        UserCrudy.save({
          id: 2,
          name: "User Number 2",
        }),
        UserCrudy.save({
          id: 3,
          name: "User Number 3",
        }),
        TagCrudy.save({
          id: 1,
          name: "Tag 1",
        }),
        TagCrudy.save({
          id: 2,
          name: "Tag 2",
        }),
        TagCrudy.save({
          id: 3,
          name: "Tag 3",
        }),
        UserTagHandler.save([
          {
            userId: 1,
            tagId: 1,
          },
          {
            userId: 1,
            tagId: 2,
          },
          {
            userId: 1,
            tagId: 3,
          },
          {
            userId: 2,
            tagId: 1,
          },
          {
            userId: 2,
            tagId: 2,
          },
          {
            userId: 2,
            tagId: 3,
          },
        ]),
      ]);
    });
    emitter.dispatchEvent("reload");
  }, [emitter, execute]);

  return (
    <CrudyTable<IRecord, ISearchParams>
      name="User"
      crudy={UserCrudy}
      emitter={emitter}
      columns={columns}
      searchParams={searchParams}
      titleSearchField="like_name"
      afterListed={handleAfterList}
      titleExtra={
        <>
          <Button loading={loading} onClick={handleInitTestData}>
            Init Test Data
          </Button>
        </>
      }
    >
      <Form.Item name="name" label="Name" rules={[{ required: true }]}>
        <Input maxLength={200} placeholder="Name" />
      </Form.Item>
    </CrudyTable>
  );
}
