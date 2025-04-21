import { i18n, IBase } from "@allape/gocrud";
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
import Crudy from "../../api/antd.ts";
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
  scroll?: TableProps["scroll"];
  columns: TableColumnsType<T>;
  pagination?: Pagination;
  actions?: (options: {
    record: T;
    execute: UseLoadingReturn["execute"];
    size?: Size;
  }) => React.ReactNode;
  actionColumnProps?: TableColumnsType<T>[number];
  deleteButtonProps?: ButtonProps;
}

export interface ICard {
  extra?: React.ReactNode;
  titleExtra?: React.ReactNode;
}

export interface ICrudyTableProps<
  T extends IBase = IBase,
  SP extends object = object,
> extends ISwitch,
    IForm<T>,
    IFormEvent<T>,
    ITable<T>,
    ICard {
  name: string;
  crudy?: Crudy<T>;
  className?: string;
  searchParams?: SP;
  emitter?: CrudyEventEmitter<T>;
  mobileMaxWidth?: number;
}

export default function CrudyTable<
  T extends IBase = IBase,
  SP extends object = object,
>({
  reloadable = true,
  creatable = true,
  editable = true,
  deletable = true,
  pageable = true,

  name,
  crudy,
  className,
  searchParams: searchParamsFromProps,
  emitter,
  mobileMaxWidth,

  scroll,
  columns,
  pagination: paginationFromProps,
  actions,
  actionColumnProps,
  deleteButtonProps,

  children,
  defaultFormValue,
  saveModalProps,

  extra,
  titleExtra,

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
  const [formVisible, openForm, _closeForm] = useToggle(false);

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

    await execute(async () => {
      let total = 0;
      let records: T[];

      const sp = searchParamsRef.current;

      if (pageable) {
        records = await crudy.page<SP>(
          paginationRef.current.current,
          paginationRef.current.pageSize,
          sp,
        );

        total = await crudy.count<SP>(sp);
      } else {
        records = await crudy.all<SP>(sp);
      }

      const newRecords = await afterListed?.(records);
      setList(newRecords || records);
      setPagination((prev) => ({
        ...defaultPagination,
        ...prev,
        total,
      }));
    });
  }, [
    afterListed,
    crudy,
    defaultPagination,
    execute,
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
        const newRecord = await beforeEdit?.(record, form);
        setEditingRecord(newRecord || record);
        form.setFieldsValue((newRecord || record) as RecursivePartial<T>);
        openForm();
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
      openForm();
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

    emitter.addEventListener("reload", getList);

    const handleOpenSaveForm = (
      e: EEEvent<"open-save-form", RecursivePartial<T> | undefined>,
    ) => {
      if (e.value) {
        form.setFieldsValue(e.value);
      } else {
        form.resetFields();
      }
      openForm();
    };
    emitter.addEventListener("open-save-form", handleOpenSaveForm);

    const handleCloseForm = () => {
      closeForm(undefined);
    };
    emitter.addEventListener("close-save-form", handleCloseForm);

    return () => {
      emitter.removeEventListener("reload", getList);
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
    searchParamsRef.current = searchParamsFromProps;

    getList().then();
  }, [getList, searchParamsFromProps, setPagination]);

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
            <span>
              {i18n.ot("gocrud.manage", Default.gocrud.manage, t)} {name}
            </span>
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
      >
        <Table<T>
          className={styles.table}
          loading={loading}
          columns={columnsWithActions}
          rowKey="id"
          dataSource={list}
          pagination={pageable ? pagination : false}
          onChange={handleChange}
          scroll={scroll || { x: true }}
          size={size}
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
        destroyOnClose
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
