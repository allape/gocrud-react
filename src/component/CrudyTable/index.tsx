import { i18n, IBase, IBaseSearchParams } from "@allape/gocrud";
import { useLoading, useProxy, useToggle } from "@allape/use-loading";
import { UseLoadingReturn } from "@allape/use-loading/lib/hook/useLoading";
import {
  AppstoreAddOutlined,
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
  FormProps,
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
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import Crudy from "../../api/antd.tsx";
import { DefaultTableScroll } from "../../config/antd.ts";
import { Millisecond } from "../../config/misc.ts";
import { Pagination, RecursivePartial } from "../../helper/antd.tsx";
import { EEEvent } from "../../helper/eventemitter.ts";
import { Size, useSize } from "../../hook/useMobile.ts";
import Default from "../../i18n";
import CrudyModal from "../CrudyModal";
import Flex from "../Flex";
import CrudyEventEmitter from "./eventemitter.ts";
import styles from "./style.module.scss";

type ModifiedPagination = Omit<Pagination, "current" | "pageSize"> &
  Required<Pick<Pagination, "current" | "pageSize">>;

const FormLayoutProps: Pick<FormProps, "labelCol" | "wrapperCol"> = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

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

export type FalseToStop = false | boolean | void;

export interface ISwitch {
  reloadable?: boolean;
  creatable?: boolean;
  editable?: boolean;
  deletable?: boolean;
  pageable?: boolean;
}

export interface IForm<T extends IBase> {
  children?: React.ReactNode | ((record?: Partial<T>) => React.ReactNode);
  defaultFormValue?: Partial<T>;
  saveModalProps?: ModalProps;
}

export interface IFormEvent<T extends IBase> {
  onFormInit?: (form: FormInstance<T>) => void;
  beforeEdit?: (
    record: T | undefined,
    form: FormInstance<T>,
  ) => Promise<T | undefined> | T | void;
  beforeSave?: (record: T, form: FormInstance<T>) => Promise<T> | T | void;
  onSave?: (record: T) => Promise<T>;
  afterSaved?: (
    record: T,
    form: FormInstance<T>,
  ) => Promise<FalseToStop> | FalseToStop;
  afterListed?: (records: T[]) => Promise<T[]> | T[];
  onDelete?: (record: T) => Promise<void>;
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

export interface ICard {
  extra?: React.ReactNode;
  titleExtra?: React.ReactNode;
  cardProps?: CardProps;
}

export interface ICrudyTableProps<
  T extends IBase = IBase,
  SP extends IBaseSearchParams = IBaseSearchParams,
>
  extends ISwitch, IForm<T>, IFormEvent<T>, ITable<T>, ICard {
  name: string;
  title?: string;
  crudy?: Crudy<T>;
  className?: string;
  searchParams?: SP;
  emitter?: CrudyEventEmitter<T, SP>;
  mobileMaxWidth?: number;

  /**
   * Delay for `getList` function, for rapid props change
   */
  delay?: Millisecond;
}

export default function CrudyTable<
  T extends IBase = IBase,
  SP extends IBaseSearchParams = IBaseSearchParams,
>({
  reloadable = true,
  creatable = true,
  editable = true,
  deletable = true,
  pageable = true,

  name,
  title,
  crudy,
  className,
  searchParams: searchParamsFromProps,
  emitter,
  mobileMaxWidth,
  delay = 50,

  scroll,
  columns,
  pagination: paginationFromProps,
  actions,
  actionColumnProps,
  deleteButtonProps,
  tableProps,

  children,
  defaultFormValue,
  saveModalProps,

  extra,
  titleExtra,
  cardProps,

  onFormInit,
  beforeEdit,
  beforeSave,
  onSave,
  afterSaved,
  afterListed,
  onDelete: _handleDelete,
}: ICrudyTableProps<T, SP>): React.ReactElement {
  const { t } = useTranslation();

  const { loading, isLoading, execute } = useLoading();

  const getListDelayerTimerRef = useRef(-1);

  const getListAbortController = useMemo(() => new AbortController(), []);

  const defaultPagination = useMemo<ModifiedPagination>(
    () => ({
      ...DefaultPagination,
      ...paginationFromProps,
      className: cls(
        styles.pagination,
        DefaultPagination?.className,
        paginationFromProps?.className,
      ),
    }),
    [paginationFromProps],
  );

  const searchParamsRef = useRef<SP | undefined>(undefined);
  const [pagination, paginationRef, setPagination] =
    useProxy<ModifiedPagination>(defaultPagination);
  const [list, , setList] = useProxy<T[]>([]);
  const [formVisible, _openForm, _closeForm] = useToggle(false);

  const openForm = useCallback(
    (record?: RecursivePartial<T> | Partial<T> | T) => {
      _openForm();
      emitter?.dispatchEvent("save-form-opened", record);
    },
    [_openForm, emitter],
  );

  const closeForm = useCallback(
    (record?: T) => {
      emitter?.dispatchEvent("save-form-closed", record);
      _closeForm();
    },
    [_closeForm, emitter],
  );

  const [form] = Form.useForm<T>();
  const [editingRecord, setEditingRecord] = useState<Partial<T> | undefined>();

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
          records = await crudy.page<SP>(
            paginationRef.current.current,
            paginationRef.current.pageSize,
            sp,
            {
              signal: getListAbortController.signal,
            },
          );

          total = await crudy.count<SP>(sp, {
            signal: getListAbortController.signal,
          });
        } else {
          records = await crudy.all<SP>(sp, {
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

  const handleFormClose = useCallback(() => {
    form.resetFields();
    setEditingRecord(undefined);
  }, [form]);

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
    (record: T) => {
      execute(async () => {
        const newRecord = (await beforeEdit?.(record, form)) || record;
        form.setFieldsValue(newRecord as RecursivePartial<T>);
        setEditingRecord(newRecord);
        openForm(newRecord);
      }).then();
    },
    [beforeEdit, execute, form, openForm],
  );

  const handleAdd = useCallback(() => {
    execute(async () => {
      const newRecord =
        (await beforeEdit?.(defaultFormValue as T, form)) || defaultFormValue;
      if (newRecord) {
        form.setFieldsValue(newRecord as RecursivePartial<T>);
        setEditingRecord(newRecord);
      }
      openForm(newRecord);
    }).then();
  }, [beforeEdit, defaultFormValue, execute, form, openForm]);

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
                onClick={() => handleEdit(record)}
              >
                <EditOutlined />
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
      actions,
      columns,
      deletable,
      deleteButtonProps,
      editable,
      execute,
      handleDelete,
      handleEdit,
      actionColumnProps,
      size,
      t,
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
      if (e.value) {
        form.setFieldsValue(e.value);
      } else {
        form.resetFields();
      }
      openForm(e.value);
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
  }, [closeForm, emitter, form, getList, openForm]);

  // useEffect(() => {
  //   getList().then();
  // }, [getList]);

  useEffect(() => {
    if (searchParamsFromProps !== searchParamsRef.current) {
      setPagination((old) => ({
        ...old,
        current: 1,
      }));
    }

    searchParamsRef.current = {
      ...searchParamsRef.current,
      ...searchParamsFromProps,
    } as SP;

    getList().then();
  }, [getList, searchParamsFromProps, setPagination]);

  useEffect(() => {
    return () => {
      clearTimeout(getListDelayerTimerRef.current);
    };
  }, []);

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
                onClick={handleAdd}
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
          scroll={scroll || DefaultTableScroll}
          size={size}
          {...tableProps}
        />
      </Card>
      <CrudyModal
        open={formVisible}
        width={800}
        title={`${editingRecord?.id ? i18n.ot("gocrud.edit", Default.gocrud.edit, t) : i18n.ot("gocrud.add", Default.gocrud.add, t)} ${name}`}
        afterClose={handleFormClose}
        cancelButtonProps={{ disabled: loading }}
        cancelText={i18n.ot("gocrud.cancel", Default.gocrud.cancel, t)}
        okButtonProps={{ loading }}
        okText={i18n.ot("gocrud.save", Default.gocrud.save, t)}
        onOk={handleSave}
        destroyOnHidden
        {...saveModalProps}
        onCancel={(e) => {
          closeForm();
          saveModalProps?.onCancel?.(e);
        }}
      >
        <Form<T> {...FormLayoutProps} form={form}>
          <Form.Item name="id" noStyle hidden>
            <Input />
          </Form.Item>
          {typeof children === "function" ? children(editingRecord) : children}
        </Form>
      </CrudyModal>
    </>
  );
}
