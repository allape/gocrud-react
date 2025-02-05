import { IBase } from "@allape/gocrud";
import { useLoading, useProxy, useToggle } from "@allape/use-loading";
import { UseLoadingReturn } from "@allape/use-loading/lib/hook/useLoading";
import {
  Button,
  ButtonProps,
  Card,
  Form,
  FormProps,
  Input,
  Popconfirm,
  Space,
  Table,
  TableColumnsType,
  TableProps,
} from "antd";
import { FormInstance } from "rc-field-form/es/interface";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Crudy from "../../api/antd.ts";
import { Pagination, RecursivePartial } from "../../helper/antd.tsx";
import { EEEvent } from "../../helper/eventemitter.ts";
import Flex from "../Flex";
import UpperModal from "../UpperModal";
import CrudyEventEmitter from "./eventemitter.ts";

type ModifiedPagination = Omit<Pagination, "current" | "pageSize"> &
  Required<Pick<Pagination, "current" | "pageSize">>;

const FormLayoutProps: Pick<FormProps, "labelCol" | "wrapperCol"> = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

const DefaultPagination: ModifiedPagination = {
  current: 1,
  pageSize: 20,
  showSizeChanger: true,
  showQuickJumper: true,
  pageSizeOptions: ["10", "20", "50", "100"],
  showTotal: (total) => total,
};

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
}

export interface IFormEvent<T extends IBase> {
  beforeEdit?: (
    record: T | undefined,
    form: FormInstance<T>,
  ) => Promise<T | undefined> | T | void;
  beforeSave?: (record: T, form: FormInstance<T>) => Promise<T> | T | void;
  afterSaved?: (record: T, form: FormInstance<T>) => Promise<void> | void;
  afterListed?: (records: T[]) => Promise<T[]> | T[];
  onDelete?: (record: T) => Promise<void>;
}

export interface ITable<T extends IBase> {
  scroll?: TableProps["scroll"];
  columns: TableColumnsType<T>;
  actions?: (
    record: T,
    execute: UseLoadingReturn["execute"],
  ) => React.ReactNode;
  deleteButtonProps?: ButtonProps;
}

export interface ICrudyTableProps<
  T extends IBase = IBase,
  SP extends object = object,
> extends ISwitch,
    IForm<T>,
    IFormEvent<T>,
    ITable<T> {
  name: string;
  emitter?: CrudyEventEmitter<T>;
  crudy: Crudy<T>;
  searchParams?: SP;
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
  emitter,
  crudy,
  searchParams,

  scroll,
  columns,
  actions,
  deleteButtonProps,

  children,
  defaultFormValue,

  beforeEdit,
  beforeSave,
  afterSaved,
  afterListed,
  onDelete: _handleDelete,
}: ICrudyTableProps<T, SP>): React.ReactElement {
  const { loading, execute } = useLoading();

  const [pagination, paginationRef, setPagination] =
    useProxy<ModifiedPagination>(DefaultPagination);
  const [list, , setList] = useProxy<T[]>([]);
  const [formVisible, openForm, closeForm] = useToggle(false);

  const [form] = Form.useForm<T>();
  const [editingRecord, setEditingRecord] = useState<Partial<T> | undefined>();

  const getList = useCallback(async () => {
    await execute(async () => {
      let total = 0;
      let records: T[];

      if (pageable) {
        records = await crudy.page<SP>(
          paginationRef.current.current,
          paginationRef.current.pageSize,
          searchParams,
        );

        total = await crudy.count<SP>(searchParams);
      } else {
        records = await crudy.all<SP>(searchParams);
      }

      const newRecords = await afterListed?.(records);
      setList(newRecords || records);
      setPagination((prev) => ({ ...prev, total }));
    });
  }, [
    afterListed,
    crudy,
    execute,
    pageable,
    paginationRef,
    searchParams,
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
  }, [form]);

  const handleSave = useCallback(async () => {
    await execute(async () => {
      let record = await form.validateFields();
      if (beforeSave) {
        const newRecord = await beforeSave(record, form);
        if (newRecord) {
          record = newRecord;
        }
      }
      const saved = await crudy.save(record);
      await afterSaved?.(saved, form);
      closeForm();
      await getList();
    });
  }, [afterSaved, beforeSave, closeForm, crudy, execute, form, getList]);

  const handleDelete = useCallback(
    async (record: T) => {
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

  const columnsWithActions = useMemo<TableColumnsType<T>>(
    () => [
      ...columns,
      {
        title: "Actions",
        key: "actions",
        fixed: "right",
        width: 300,
        render: (_, record) => (
          <Space wrap>
            {editable && (
              <Button
                size="small"
                type="link"
                onClick={() => handleEdit(record)}
              >
                Edit
              </Button>
            )}
            {deletable && (
              <Popconfirm
                title={`Delete this record?`}
                onConfirm={() => handleDelete(record)}
              >
                <Button size="small" type="link" danger {...deleteButtonProps}>
                  {deleteButtonProps?.children || "Delete"}
                </Button>
              </Popconfirm>
            )}
            {actions?.(record, execute)}
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

    return () => {
      emitter.removeEventListener("reload", getList);
      emitter.removeEventListener("open-save-form", handleOpenSaveForm);
    };
  }, [emitter, form, getList, openForm]);

  useEffect(() => {
    setPagination({
      ...DefaultPagination,
    });
    getList().then();
  }, [getList, setPagination]);

  return (
    <>
      <Card
        title={
          <Flex justifyContent="flex-start">
            <span>Manage {name}</span>
            {creatable && (
              <Button type="primary" onClick={handleAdd}>
                Add {name}
              </Button>
            )}
            {reloadable && (
              <Button loading={loading} onClick={getList}>
                Reload
              </Button>
            )}
          </Flex>
        }
      >
        <Table<T>
          loading={loading}
          columns={columnsWithActions}
          rowKey="id"
          dataSource={list}
          pagination={pageable ? pagination : false}
          onChange={handleChange}
          scroll={scroll || { x: true }}
        />
      </Card>
      <UpperModal
        open={formVisible}
        width={800}
        title={`${editingRecord?.id ? "Edit" : "Create"} ${name}`}
        afterClose={handleFormClose}
        onCancel={closeForm}
        keyboard={false}
        cancelButtonProps={{ disabled: loading }}
        cancelText="Cancel"
        okButtonProps={{ loading }}
        okText="Save"
        onOk={handleSave}
        destroyOnClose
      >
        <Form<T> {...FormLayoutProps} form={form}>
          <Form.Item name="id" noStyle hidden>
            <Input />
          </Form.Item>
          {typeof children === "function" ? children(editingRecord) : children}
        </Form>
      </UpperModal>
    </>
  );
}
