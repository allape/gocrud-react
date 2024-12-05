import { IBase } from "@allape/gocrud/src/model";
import { useLoading, useProxy, useToggle } from "@allape/use-loading";
import {
  Button,
  ButtonProps,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  TableColumnsType,
} from "antd";
import React, { PropsWithChildren, useCallback, useMemo } from "react";
import Crudy from "../../api/antd.ts";
import { FormLayoutProps } from "../../config/antd.ts";
import Flex from "../Flex";

export interface ICrudyButtonProps<
  T extends IBase = IBase,
  SP extends object = object,
> extends Omit<ButtonProps, "onClick" | "children"> {
  crudy: Crudy<T>;
  columns: TableColumnsType<T>;
  searchParams?: SP;
  name: string;
  defaultFormValue?: Partial<T>;
  beforeSave?: (record: T) => Promise<T>;
}

export default function CrudyButton<
  T extends IBase = IBase,
  SP extends object = object,
>({
  children,
  crudy,
  columns,
  searchParams,
  name,
  defaultFormValue,
  beforeSave,
  ...props
}: PropsWithChildren<ICrudyButtonProps<T, SP>>): React.ReactElement {
  const { loading, execute } = useLoading();

  const [list, , setList] = useProxy<T[]>([]);
  const [tableVisible, openTable_, closeTable] = useToggle(false);
  const [formVisible, openForm, closeForm] = useToggle(false);

  const [form] = Form.useForm<T>();

  const getList = useCallback(async () => {
    await execute(async () => {
      const records = await crudy.all<SP>(searchParams);
      setList(records);
    });
  }, [crudy, execute, searchParams, setList]);

  const handleFormClose = useCallback(() => {
    form.resetFields();
  }, [form]);

  const openTable = useCallback(() => {
    getList().then();
    openTable_();
  }, [getList, openTable_]);

  const handleSave = useCallback(async () => {
    await execute(async () => {
      let record = await form.validateFields();
      if (beforeSave) {
        record = await beforeSave(record);
      }
      await crudy.save(record);
      closeForm();
      await getList();
    });
  }, [beforeSave, closeForm, crudy, execute, form, getList]);

  const handleDelete = useCallback(
    async (id: IBase["id"]) => {
      await execute(async () => {
        await crudy.delete(id);
        await getList();
      });
    },
    [crudy, execute, getList],
  );

  const handleEdit = useCallback(
    (record: T) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.setFieldsValue(record as any);
      openForm();
    },
    [form, openForm],
  );

  const handleAdd = useCallback(() => {
    if (defaultFormValue) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.setFieldsValue(defaultFormValue as any);
    }
    openForm();
  }, [defaultFormValue, form, openForm]);

  const columnsWithActions = useMemo<TableColumnsType<T>>(
    () => [
      ...columns,
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button size="small" type="link" onClick={() => handleEdit(record)}>
              Edit
            </Button>
            <Popconfirm
              title={`Delete this record?`}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button size="small" type="link" danger>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [columns, handleDelete, handleEdit],
  );

  return (
    <>
      <Button {...props} onClick={openTable}>
        Manage {name}
      </Button>
      <Modal
        open={tableVisible}
        width={1200}
        footer={null}
        onCancel={closeTable}
        title={
          <Space>
            <span>Manage {name}</span>
            <Button onClick={handleAdd}>Add {name}</Button>
          </Space>
        }
      >
        <Table<T>
          loading={loading}
          columns={columnsWithActions}
          rowKey="id"
          dataSource={list}
          pagination={false}
          scroll={{ x: true }}
        />
      </Modal>
      <Modal
        open={formVisible}
        footer={null}
        width={800}
        title={`Edit ${name}`}
        afterClose={handleFormClose}
        onCancel={closeForm}
        keyboard={false}
      >
        <Form<T> {...FormLayoutProps} form={form}>
          <Form.Item name="id" noStyle hidden>
            <Input />
          </Form.Item>
          {children}
          <Form.Item noStyle>
            <Flex>
              <Button onClick={closeForm}>Cancel</Button>
              <Divider type="vertical" />
              <Button type="primary" onClick={handleSave}>
                Save
              </Button>
            </Flex>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
