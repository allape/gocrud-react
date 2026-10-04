import { BaseSearchParams, IBaseSearchParams } from "@allape/gocrud";
import { IBase } from "@allape/gocrud/src/model";
import { useLoading, useProxy } from "@allape/use-loading";
import {
  CloudServerOutlined,
  MoreOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Divider,
  Dropdown,
  Form,
  FormInstance,
  Input,
  InputNumber,
  MenuProps,
  TableColumnsType,
  Tag,
} from "antd";
import {
  PropsWithChildren,
  ReactElement,
  useCallback,
  useMemo,
  useState,
} from "react";
import AntdCrudy, {
  AntdM2MConnectorHandler,
  CrudyButton,
  CrudyTable,
  ICrudyButtonProps,
  ICrudySelectorProps,
  NewCrudyButtonEventEmitter,
  PagedCrudySelector,
} from "../index.ts";
import AdvancedCrudySelector, {
  IAdvancedCrudySelectorProps,
} from "./component/AdvancedCrudySelector";
import { ISelectionListProps } from "./component/AdvancedCrudySelector/SelectionList.tsx";
import AdvancedSearch from "./component/AdvancedSearch";
import { IUseProps } from "./component/CrudyTable/useProps.tsx";
import { asDefaultPattern } from "./helper/datetime.ts";
import { cut } from "./helper/misc.ts";
import styles from "./style.module.scss";

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
  const loadingFunctions = useLoading();
  const { loading, execute } = loadingFunctions;

  const emitter = useMemo(
    () => ({
      User: NewCrudyButtonEventEmitter<IUser, IUserSearchParams>(),
      Tag: NewCrudyButtonEventEmitter<ITag, ITagSearchParams>(),
    }),
    [],
  );

  const [searchParams, setSearchParams] = useState<ISearchParams>(() => ({
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

  const handleBeforeSave = useCallback((record: IRecord): IRecord => {
    delete record._tags;
    delete record._tagIds;
    return record;
  }, []);

  const handleAfterSaved = useCallback(
    async (record: IRecord, form: FormInstance<IRecord>) => {
      const tagIds: ITag["id"][] | undefined = form.getFieldValue("_tagIds");
      await UserTagHandler.saveAfterDelete(
        "userId",
        record.id,
        tagIds?.map((ti) => ({
          userId: record.id,
          tagId: ti,
        })) || [],
      );
    },
    [],
  );

  const handleAfterList = useCallback(
    async (records: IRecord[]): Promise<IRecord[]> => {
      await UserTagHandler.get<ITag, IUserModified>(
        "userId",
        records,
        {},
        (user, tags) => {
          user._tags = tags;
          user._tagIds = tags.map((t) => t.id);
        },
      );
      return records;
    },
    [],
  );

  const handleInitTestData = useCallback(async () => {
    await execute(async () => {
      await Promise.all([
        UserCrudy.save({
          name: "User Number 1",
        }),
        UserCrudy.save({
          name: "User Number 2",
        }),
        UserCrudy.save({
          name: "User Number 3",
        }),
        TagCrudy.save({
          name: "Tag 1",
        }),
        TagCrudy.save({
          name: "Tag 2",
        }),
        TagCrudy.save({
          name: "Tag 3",
        }),
        ...new Array(500).fill(1).map((_, i) =>
          TagCrudy.save({
            name: `tag:${i}`,
          }),
        ),
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
    emitter.User.dispatchEvent("reload");
  }, [emitter, execute]);

  const menus = useMemo<MenuProps["items"]>(
    () => [
      {
        key: "Tag",
        label: "Tag",
        onClick: () => {
          emitter.Tag.dispatchEvent("open");
        },
      },
    ],
    [emitter],
  );

  const [advancedSearchValue, advancedSearchValueRef, setAdvancedSearchValue] =
    useProxy<string[]>([]);

  const searchableFields = useMemo<
    Partial<Record<keyof ISearchParams, string[]>>
  >(
    () => ({
      name: [],
      like_name: [],
      deleted: ["true", "false"],
    }),
    [],
  );

  const handleSearch = useCallback(() => {
    const sv: Record<string, string> = {};
    advancedSearchValueRef.current.forEach((v) => {
      const [name, value] = cut(v);
      sv[name] = value;
    });
    setSearchParams((old) => {
      const sp: ISearchParams = { ...old };
      Object.keys(searchableFields).forEach((key) => {
        sp[key as keyof ISearchParams] = undefined;
      });
      sp.deleted = false;
      return {
        ...sp,
        ...sv,
      };
    });
  }, [advancedSearchValueRef, searchableFields]);

  return (
    <div className={styles.wrapper}>
      <CrudyTable<IRecord, ISearchParams>
        name="User"
        crudy={UserCrudy}
        emitter={emitter.User}
        columns={columns}
        searchParams={searchParams}
        afterListed={handleAfterList}
        beforeSave={handleBeforeSave}
        afterSaved={handleAfterSaved}
        loadingFunctions={loadingFunctions}
        titleExtra={
          <>
            <AdvancedSearch
              strict
              placeholder="Advanced Search"
              fields={searchableFields}
              value={advancedSearchValue}
              onChange={setAdvancedSearchValue}
              onMaskedEnter={handleSearch}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              loading={loading}
              onClick={handleSearch}
            >
              Search
            </Button>
            <Divider orientation="vertical" />
            <Button
              icon={<CloudServerOutlined />}
              loading={loading}
              onClick={handleInitTestData}
            >
              Init Test Data
            </Button>
            <Divider orientation="vertical" />
            <Dropdown menu={{ items: menus }}>
              <Button>
                <MoreOutlined />
              </Button>
            </Dropdown>
            <div style={{ display: "none" }}>
              <TagCrudyButton emitter={emitter.Tag} />
            </div>
          </>
        }
      >
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input maxLength={200} placeholder="Name" />
        </Form.Item>
        <Form.Item name="_tagIds" label="Tags" rules={[{ required: true }]}>
          <TagSelector mode="multiple" />
        </Form.Item>
        <Form.Item name="_tagIds" label="Tags" rules={[{ required: true }]}>
          <TagAdvancedSelector />
        </Form.Item>
      </CrudyTable>
      <Dropdown menu={{ items: menus }}>
        <Button className={styles.fixedMenu}>
          <MoreOutlined />
        </Button>
      </Dropdown>
    </div>
  );
}

// region Tag

function useTagTableProps(): Omit<
  IUseProps<ITag, ITagSearchParams>,
  "emitter"
> {
  const [searchParams, setSearchParams] = useState<ISearchParams>(() => ({
    ...BaseSearchParams,
    sortByPriorityThenUpdatedAt: true,
  }));

  const columns = useMemo<TableColumnsType<IRecord>>(
    () => [
      {
        title: "id",
        dataIndex: "id",
        width: 50,
      },
      {
        title: "Priority",
        dataIndex: "priority",
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

  return {
    searchParams,
    setSearchParams,
    columns,
    name: "Tag",
    titleSearchField: "like_name",
    crudy: TagCrudy,
    children: (
      <>
        <Form.Item name="priority" label="Priority">
          <InputNumber
            precision={0}
            step={1}
            min={Number.MIN_SAFE_INTEGER}
            max={Number.MAX_SAFE_INTEGER}
            placeholder="Priority"
          />
        </Form.Item>

        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input maxLength={50} placeholder="Name" />
        </Form.Item>
      </>
    ),
  };
}

function TagCrudyButton(props: Partial<ICrudyButtonProps<ITag>>): ReactElement {
  const innerProps = useTagTableProps();
  return <CrudyButton<ITag, ITagSearchParams> {...innerProps} {...props} />;
}

function TagAdvancedSelector(
  props: Partial<IAdvancedCrudySelectorProps<ITag, ITagSearchParams>>,
): ReactElement {
  const tableProps = useTagTableProps();
  const listProps = useMemo<ISelectionListProps<ITag>>(
    () => ({
      // height: 400,
      // itemRender: (record) => <span>{record.name}</span>,
    }),
    [],
  );
  return (
    <AdvancedCrudySelector<ITag, ITagSearchParams>
      {...props}
      // extraFilterFields={["name"]}
      listProps={listProps}
      tableProps={{
        ...tableProps,
        scroll: {
          x: true,
          y: "calc(100vh - 300px)",
        },
      }}
    />
  );
}

function TagSelector(
  props: PropsWithChildren<Partial<ICrudySelectorProps<ITag>>>,
): ReactElement {
  const sp = useMemo<ISearchParams>(
    () => ({
      ...BaseSearchParams,
      orderBy_priority: "desc",
    }),
    [],
  );

  return (
    <PagedCrudySelector<IRecord, ISearchParams>
      placeholder="Select Tag"
      {...props}
      crudy={TagCrudy}
      pageSize={20}
      searchParams={sp}
      searchPropName="like_keyword"
      inKeyword="in_id"
    />
  );
}

// endregion
