import { IBase } from "@allape/gocrud/src/model";
import { useLoading, useToggle } from "@allape/use-loading";
import { Button, Card, Form, Input, InputNumber, Modal } from "antd";
import { ReactElement, useCallback, useState } from "react";
import ThemeProvider from "./component/ThemeProvider";
import { FormLayoutProps } from "./config/antd.ts";
import styles from "./style.module.scss";

export default function App(): ReactElement {
  const { loading, execute } = useLoading();

  const [record, setRecord] = useState<IBase | undefined>();

  const [visible, openModal, closeModal] = useToggle(false);

  const [form] = Form.useForm<IBase>();

  const handleOk = useCallback(async () => {
    await execute(async () => {
      const data = await form.validateFields();
      await new Promise((r) => setTimeout(r, 3000));
      setRecord(data);
      closeModal();
    });
  }, [closeModal, execute, form]);

  return (
    <ThemeProvider>
      <Card
        className={styles.wrapper}
        title="Crud for React with AntD"
        extra={
          <>
            <Button type="primary" onClick={openModal}>
              Open Modal
            </Button>
          </>
        }
      >
        <pre>
          <code>{record ? JSON.stringify(record, null, 4) : "----"}</code>
        </pre>
      </Card>
      <Modal
        open={visible}
        title="Modal"
        closable={!loading}
        maskClosable={!loading}
        onCancel={closeModal}
        cancelButtonProps={{ disabled: loading }}
        onOk={handleOk}
        okButtonProps={{ loading }}
      >
        <Form {...FormLayoutProps} form={form}>
          <Form.Item name="name" label="Name">
            <Input placeholder="name" allowClear />
          </Form.Item>
          <Form.Item name="age" label="Age">
            <InputNumber min={18} step={1} precision={0} placeholder="age" />
          </Form.Item>
        </Form>
      </Modal>
    </ThemeProvider>
  );
}
