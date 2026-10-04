import { i18n, IBase, IBaseSearchParams } from "@allape/gocrud";
import { useLoading, useProxy, useToggle } from "@allape/use-loading";
import { UseLoadingReturn } from "@allape/use-loading/lib/hook/useLoading";
import {
  AppstoreAddOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Button,
  ButtonProps,
  Card,
  CardProps,
  Form,
  FormInstance,
  Input,
  ModalProps,
  Popconfirm,
  Space,
  Table,
  TableColumnsType,
  TableProps,
} from "antd";
import cls from "classnames";
import { t } from "i18next";
import React, {
  Key,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import AntdCrudy from "../../api/antd.tsx";
import {
  DefaultFormLayoutProps,
  DefaultFormModalProps,
} from "../../config/antd.ts";
import { Millisecond } from "../../config/misc.ts";
import { Pagination, RecursivePartial } from "../../helper/antd.tsx";
import { newSet } from "../../helper/array.ts";
import { EEEvent } from "../../helper/eventemitter.ts";
import { FalseToStop, Promisable } from "../../helper/misc.ts";
import { Size, useSize } from "../../hook/useMobile.ts";
import Default from "../../i18n";
import CrudyModal from "../CrudyModal";
import Flex from "../Flex";
import CrudyEventEmitter from "./eventemitter.ts";
import styles from "./style.module.scss";

type ModifiedPagination = Omit<Pagination, "current" | "pageSize"> &
  Required<Pick<Pagination, "current" | "pageSize">>;

type FormAction = "add" | "edit" | "duplicate";

// noinspection JSUnusedGlobalSymbols
const DefaultPagination: ModifiedPagination = {
  current: 1,
  pageSize: 50,
  showSizeChanger: true,
  showQuickJumper: true,
  pageSizeOptions: ["10", "20", "50", "100"],
  showTotal: (total, range) =>
    t("gocrud.totalRender", {
      from: range[0],
      to: range[1],
      total,
    }),
};

export interface ISwitch {
  reloadable?: boolean;
  creatable?: boolean;
  editable?: boolean;
  duplicatable?: boolean;
  deletable?: boolean;
  pageable?: boolean;
}

export interface IForm<T extends IBase> {
  children?:
    React.ReactNode | ((record?: RecursivePartial<T>) => React.ReactNode);
  defaultFormValue?: RecursivePartial<T>;
  saveModalProps?: ModalProps;
}

export interface IFormEvent<T extends IBase> {
  onFormInit?: (form: FormInstance<T>) => void;
  beforeEdit?: (
    record: T | undefined,
    form: FormInstance<T>,
    action: FormAction,
  ) => Promisable<RecursivePartial<T> | T | void>;
  beforeSave?: (record: T, form: FormInstance<T>) => Promisable<T | void>;
  onSave?: (record: T) => Promisable<T>;
  afterSaved?: (
    record: T,
    form: FormInstance<T>,
  ) => Promisable<FalseToStop | void>;
  afterListed?: (records: T[]) => Promisable<T[]>;
  onDelete?: (record: T) => Promisable<void>;
}

export interface ITable<T extends IBase> {
  scroll?: TableProps<T>["scroll"];
  columns: TableColumnsType<T>;
  pagination?: Pagination;
  actions?: (options: {
    record: T;
    execute: UseLoadingReturn["execute"];
    size?: Size;
  }) => React.ReactNode;
  actionColumnProps?: TableColumnsType<T>[number];
  deleteButtonProps?: ButtonProps;
  tableProps?: TableProps<T>;
}

export interface ICard<SP extends IBaseSearchParams = IBaseSearchParams> {
  extra?: React.ReactNode;
  titleSearchField?: keyof SP;
  titleExtra?: React.ReactNode;
  cardProps?: CardProps;
  onTitleSearch?: (searchParams: SP) => Promisable<SP>;
}

export interface IFormControllerProps<T extends IBase = IBase> {
  value?: T["id"][];
  /**
   * Table will display checkboxes when {@link onChange} is not undefined
   * @param value All selected ids
   * @param partialRecords This param only contains the records in current page
   *          not all records compares to {@link value}
   */
  onChange?: (value: T["id"][], partialRecords: T[]) => void;
}

export interface ICrudyTableProps<
  T extends IBase = IBase,
  SP extends IBaseSearchParams = IBaseSearchParams,
>
  extends
    ISwitch,
    IForm<T>,
    IFormEvent<T>,
    ITable<T>,
    ICard<SP>,
    IFormControllerProps<T> {
  name: string;
  title?: string;
  crudy?: AntdCrudy<T, SP>;
  className?: string;
  searchParams?: SP;
  emitter?: CrudyEventEmitter<T, SP>;
  mobileMaxWidth?: number;
  /**
   * Delay for `getList` function, for rapid props change
   */
  delay?: Millisecond;
  loadingFunctions?: UseLoadingReturn;
}

export default function CrudyTable<
  T extends IBase = IBase,
  SP extends IBaseSearchParams = IBaseSearchParams,
>({
  reloadable = true,
  creatable = true,
  editable = true,
  duplicatable = false,
  deletable = true,
  pageable = true,

  name,
  title,
  crudy,
  className,
  searchParams: propsSearchParams,
  emitter,
  mobileMaxWidth,
  delay = 50,
  loadingFunctions: propsLoadingFunctions,

  scroll,
  columns,
  pagination: propsPagination,
  actions,
  actionColumnProps,
  deleteButtonProps,
  tableProps,

  children,
  defaultFormValue,
  saveModalProps,

  extra,
  titleSearchField,
  titleExtra,
  cardProps,
  onTitleSearch,

  onFormInit,
  beforeEdit,
  beforeSave,
  onSave,
  afterSaved,
  afterListed,
  onDelete: _handleDelete,

  value,
  onChange,
}: ICrudyTableProps<T, SP>): React.ReactElement {
  const { t } = useTranslation();

  const loadingFunctions = useLoading();
  const { loading, isLoading, execute } =
    propsLoadingFunctions || loadingFunctions;

  const getListDelayerTimerRef = useRef(-1);

  const getListAbortController = useMemo(() => new AbortController(), []);

  const defaultPagination = useMemo<ModifiedPagination>(
    () => ({
      ...DefaultPagination,
      ...propsPagination,
      className: cls(
        styles.pagination,
        DefaultPagination?.className,
        propsPagination?.className,
      ),
    }),
    [propsPagination],
  );

  const [titleSearch, titleSearchRef, setTitleSearch] = useProxy<string>("");

  const searchParamsRef = useRef<SP>({} as SP);

  const [pagination, paginationRef, setPagination] =
    useProxy<ModifiedPagination>(defaultPagination);

  const [list, , setList] = useProxy<T[]>([]);

  const [formVisible, _openForm, _closeForm] = useToggle(false);

  const [form] = Form.useForm<T>();
  const [editingRecord, setEditingRecord] = useState<
    RecursivePartial<T> | undefined
  >();

  const openForm = useCallback(
    (record?: RecursivePartial<T> | T) => {
      emitter?.dispatchEvent("save-form-opened", record);
      setEditingRecord(record as RecursivePartial<T>);
      _openForm();
    },
    [_openForm, emitter],
  );

  const closeForm = useCallback(
    (record?: T) => {
      emitter?.dispatchEvent("save-form-closed", record);
      form.resetFields();
      setEditingRecord(undefined);
      _closeForm();
    },
    [_closeForm, emitter, form],
  );

  useEffect(() => {
    onFormInit?.(form);
  }, [form, onFormInit]);

  const getList = useCallback(async () => {
    if (!crudy) {
      return;
    }

    clearTimeout(getListDelayerTimerRef.current);
    // getListAbortController.abort("new request"); // ignore for now, there will be a popup alert when aborted

    getListDelayerTimerRef.current = setTimeout(() => {
      execute(async () => {
        let total = 0;
        let records: T[];

        const sp = searchParamsRef.current;

        if (pageable) {
          records = await crudy.page(
            paginationRef.current.current,
            paginationRef.current.pageSize,
            sp,
            {
              signal: getListAbortController.signal,
            },
          );

          total = await crudy.count(sp, {
            signal: getListAbortController.signal,
          });
        } else {
          records = await crudy.all(sp, {
            signal: getListAbortController.signal,
          });
        }

        const newRecords = await afterListed?.(records);
        setList(newRecords || records);
        setPagination((prev) => ({
          ...defaultPagination,
          ...prev,
          total,
        }));
      }).then();
    }, delay) as unknown as number;
  }, [
    afterListed,
    crudy,
    defaultPagination,
    delay,
    execute,
    getListAbortController,
    pageable,
    paginationRef,
    setList,
    setPagination,
  ]);

  const handleChange = useCallback<Exclude<TableProps["onChange"], undefined>>(
    (pagination) => {
      paginationRef.current = pagination as ModifiedPagination;
      getList().then();
    },
    [getList, paginationRef],
  );

  const handleSave = useCallback(async () => {
    if (!crudy || isLoading()) {
      return;
    }
    await execute(async () => {
      let record = await form.validateFields();
      if (beforeSave) {
        const newRecord = await beforeSave(record, form);
        if (newRecord) {
          record = newRecord;
        }
      }

      const saved = await (onSave ? onSave(record) : crudy.save(record));
      if ((await afterSaved?.(saved, form)) === false) {
        return;
      }

      closeForm(saved);
      await getList();
    });
  }, [
    afterSaved,
    beforeSave,
    closeForm,
    crudy,
    execute,
    form,
    getList,
    isLoading,
    onSave,
  ]);

  const handleDelete = useCallback(
    async (record: T) => {
      if (!crudy) {
        return;
      }
      await execute(async () => {
        if (_handleDelete) {
          await _handleDelete(record);
        } else {
          await crudy.delete(record.id);
        }
        await getList();
      });
    },
    [_handleDelete, crudy, execute, getList],
  );

  const handleEdit = useCallback(
    (record: T | undefined = undefined, action: FormAction = "edit") => {
      execute(async () => {
        let newRecord =
          (await beforeEdit?.(record, form, action)) ||
          record ||
          defaultFormValue;

        if (newRecord) {
          if (action === "duplicate") {
            newRecord = {
              ...newRecord,
              id: undefined,
            };
          }

          form.setFieldsValue(newRecord as RecursivePartial<T>);
        } else {
          form.resetFields();
        }

        openForm(newRecord);
      }).then();
    },
    [beforeEdit, defaultFormValue, execute, form, openForm],
  );

  const size = useSize(mobileMaxWidth);

  const columnsWithActions = useMemo<TableColumnsType<T>>(
    () => [
      ...columns,
      {
        title: i18n.ot("gocrud.actions", Default.gocrud.actions, t),
        key: "actions",
        align: "center",
        fixed: "right",
        ...actionColumnProps,
        render: (_, record) => (
          <Space wrap>
            {editable && (
              <Button
                title={i18n.ot("gocrud.edit", Default.gocrud.edit, t)}
                size={size}
                type="link"
                onClick={() => handleEdit(record, "edit")}
              >
                <EditOutlined />
              </Button>
            )}
            {duplicatable && (
              <Button
                title={i18n.ot("gocrud.duplicate", Default.gocrud.duplicate, t)}
                size={size}
                type="link"
                onClick={() => handleEdit(record, "duplicate")}
              >
                <CopyOutlined />
              </Button>
            )}
            {deletable && (
              <Popconfirm
                title={i18n.ot(
                  "gocrud.deleteThisRecord",
                  Default.gocrud.deleteThisRecord,
                  t,
                )}
                onConfirm={() => handleDelete(record)}
              >
                <Button
                  title={i18n.ot("gocrud.delete", Default.gocrud.delete, t)}
                  size={size}
                  type="link"
                  danger
                  {...deleteButtonProps}
                >
                  {deleteButtonProps?.children || <DeleteOutlined />}
                </Button>
              </Popconfirm>
            )}
            {actions?.({ record, execute, size })}
          </Space>
        ),
      },
    ],
    [
      columns,
      t,
      actionColumnProps,
      editable,
      size,
      duplicatable,
      deletable,
      deleteButtonProps,
      actions,
      execute,
      handleEdit,
      handleDelete,
    ],
  );

  useEffect(() => {
    if (!emitter) {
      return undefined;
    }

    const handleReload = (e: EEEvent<"reload", SP | undefined>) => {
      searchParamsRef.current = {
        ...searchParamsRef.current,
        ...e.value,
      } as SP;

      getList().then();
    };

    emitter.addEventListener("reload", handleReload);

    const handleOpenSaveForm = (
      e: EEEvent<"open-save-form", RecursivePartial<T> | undefined>,
    ) => {
      handleEdit(e.value as T, e.value?.id ? "edit" : "add");
    };
    emitter.addEventListener("open-save-form", handleOpenSaveForm);

    const handleCloseForm = () => {
      closeForm(undefined);
    };
    emitter.addEventListener("close-save-form", handleCloseForm);

    return () => {
      emitter.removeEventListener("reload", handleReload);
      emitter.removeEventListener("open-save-form", handleOpenSaveForm);
      emitter.removeEventListener("close-save-form", handleCloseForm);
    };
  }, [closeForm, emitter, getList, handleEdit]);

  // useEffect(() => {
  //   getList().then();
  // }, [getList]);

  useEffect(() => {
    if (propsSearchParams !== searchParamsRef.current) {
      setPagination((old) => ({
        ...old,
        current: 1,
      }));
    }

    searchParamsRef.current = {
      ...searchParamsRef.current,
      ...propsSearchParams,
    } as SP;

    getList().then();
  }, [getList, propsSearchParams, setPagination]);

  useEffect(() => {
    return () => {
      clearTimeout(getListDelayerTimerRef.current);
    };
  }, []);

  const handleTitleSearch = useCallback(
    async (force?: boolean) => {
      if (
        !titleSearchField ||
        (!force &&
          searchParamsRef.current[titleSearchField] === titleSearchRef.current)
      ) {
        return;
      }

      searchParamsRef.current = {
        ...searchParamsRef.current,
        [titleSearchField]: titleSearchRef.current,
      } as SP;

      setPagination((old) => ({
        ...old,
        current: 1,
      }));

      if (onTitleSearch) {
        searchParamsRef.current = await onTitleSearch(searchParamsRef.current);
      }

      getList().then();
    },
    [getList, onTitleSearch, setPagination, titleSearchField, titleSearchRef],
  );

  return (
    <>
      <Card
        className={cls(styles.wrapper, className)}
        styles={{
          body: {
            padding: "0",
          },
        }}
        title={
          <Flex justifyContent="flex-start">
            {title ? (
              title
            ) : (
              <span>
                {i18n.ot("gocrud.manage", Default.gocrud.manage, t)} {name}
              </span>
            )}

            {creatable && (
              <Button
                title={`${i18n.ot("gocrud.add", Default.gocrud.add, t)} ${name}`}
                type="primary"
                onClick={() => handleEdit(undefined, "add")}
              >
                <AppstoreAddOutlined />
              </Button>
            )}
            {reloadable && (
              <Button
                title={`${i18n.ot("gocrud.reload", Default.gocrud.reload, t)}`}
                disabled={loading}
                onClick={getList}
              >
                {loading ? <LoadingOutlined /> : <ReloadOutlined />}
              </Button>
            )}
            {titleSearchField && (
              <Input
                className={styles.titleSearch}
                placeholder={`${i18n.ot("gocrud.search", Default.gocrud.search, t)}`}
                allowClear
                value={titleSearch}
                onChange={(e) => setTitleSearch(e.target.value)}
                onBlur={() => handleTitleSearch()}
                onPressEnter={() => handleTitleSearch(true)}
              />
            )}
            {titleExtra}
          </Flex>
        }
        extra={extra}
        {...cardProps}
      >
        <Table<T>
          className={styles.table}
          loading={loading}
          columns={columnsWithActions}
          rowKey="id"
          dataSource={list}
          pagination={pageable ? pagination : false}
          onChange={handleChange}
          scroll={scroll}
          size={size}
          rowSelection={
            onChange
              ? {
                  selectedRowKeys: value,
                  onChange: (selectedRowKeys: Key[], selectedRows: T[]) => {
                    let newValue = value || [];
                    // remove all ids in current page
                    newValue = newValue.filter(
                      (id) =>
                        list.findIndex((record) => record.id === id) === -1,
                    );
                    onChange?.(
                      newSet([...(selectedRowKeys as T["id"][]), ...newValue]),
                      selectedRows,
                    );
                  },
                }
              : undefined
          }
          {...tableProps}
        />
      </Card>
      <CrudyModal
        open={formVisible}
        title={`${editingRecord?.id ? i18n.ot("gocrud.edit", Default.gocrud.edit, t) : i18n.ot("gocrud.add", Default.gocrud.add, t)} ${name}`}
        cancelButtonProps={{ disabled: loading }}
        cancelText={i18n.ot("gocrud.cancel", Default.gocrud.cancel, t)}
        confirmLoading={loading}
        okText={i18n.ot("gocrud.save", Default.gocrud.save, t)}
        onOk={handleSave}
        destroyOnHidden
        {...DefaultFormModalProps}
        {...saveModalProps}
        onCancel={(e) => {
          closeForm();
          saveModalProps?.onCancel?.(e);
        }}
      >
        <Form<T> {...DefaultFormLayoutProps} form={form}>
          <Form.Item name="id" noStyle hidden>
            <Input />
          </Form.Item>
          {typeof children === "function" ? children(editingRecord) : children}
        </Form>
      </CrudyModal>
    </>
  );
}
