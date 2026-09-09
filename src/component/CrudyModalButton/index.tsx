import { UseLoadingReturn } from "@allape/use-loading/lib/hook/useLoading";
import {
  Button,
  ButtonProps,
  Form,
  FormInstance,
  FormProps,
  ModalProps,
} from "antd";
import {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  DefaultFormLayoutProps,
  DefaultFormModalProps,
} from "../../config/antd.ts";
import { RecursivePartial } from "../../helper/antd.tsx";
import { FalseToStop, Promisable } from "../../helper/misc.ts";
import CrudyModal from "../CrudyModal";

export interface ICrudyModalButtonProps<T = unknown>
  extends
    Partial<Pick<UseLoadingReturn, "loading" | "execute">>,
    Pick<ModalProps, "okText" | "cancelText" | "title">,
    Pick<ButtonProps, "children" | "type" | "size"> {
  buttonProps?: Omit<ButtonProps, "children" | "type" | "size" | "loading">;

  modalProps?: Omit<
    ModalProps,
    "onOk" | "okText" | "cancelText" | "onCancel" | "title"
  >;
  onOk?: (record: T, form: FormInstance<T>) => Promisable<FalseToStop | void>;
  onCancel?: () => Promisable<FalseToStop | void>;
  cancelButtonDisabled?: boolean;

  formProps?: Omit<FormProps<T>, "form">;
  defaultValue?: RecursivePartial<T>;
  onFormInit?: (form: FormInstance<T>) => void;
  formChildren?: ReactNode;
}

export default function CrudyModalButton<T = unknown>({
  loading: upperLoading,
  // execute: upperExecute,

  buttonProps,
  type,
  size,
  children,

  modalProps,
  okText,
  onOk,
  cancelText,
  onCancel,
  cancelButtonDisabled,

  title,

  formProps,
  defaultValue,
  onFormInit,
  formChildren,
}: ICrudyModalButtonProps<T>): ReactElement {
  // const { loading: innerLoading, execute: innerExec } = useLoading();
  // const execute = useMemo<UseLoadingReturn["execute"]>(
  //   () => upperExecute || innerExec,
  //   [innerExec, upperExecute],
  // );

  const [open, setOpen] = useState<boolean>(false);

  const [form] = Form.useForm<T>();

  useEffect(() => {
    onFormInit?.(form);
  }, [form, onFormInit]);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleCancel = useCallback(async () => {
    const falseToStop = await onCancel?.();
    if (falseToStop === false) {
      return;
    }
    setOpen(false);
  }, [onCancel]);

  const handleAfterClose = useCallback(() => {
    modalProps?.afterClose?.();
    form.resetFields();
    if (defaultValue) {
      form.setFieldsValue(defaultValue);
    }
  }, [defaultValue, form, modalProps]);

  const handleOk = useCallback(async () => {
    const value = await form.validateFields();
    const falseToStop = await onOk?.(value, form);
    if (falseToStop === false) {
      return false;
    }
    setOpen(false);
  }, [form, onOk]);

  // const loading = upperLoading || innerLoading;
  const loading = upperLoading;

  return (
    <>
      <Button
        {...buttonProps}
        loading={loading}
        type={type}
        size={size}
        onClick={handleOpen}
      >
        {children}
      </Button>
      <CrudyModal
        open={open}
        title={title}
        okText={okText}
        cancelText={cancelText}
        onOk={handleOk}
        {...DefaultFormModalProps}
        {...modalProps}
        confirmLoading={loading}
        afterClose={handleAfterClose}
        cancelButtonProps={{
          disabled:
            cancelButtonDisabled !== undefined ? cancelButtonDisabled : loading,
          ...modalProps?.cancelButtonProps,
        }}
        onCancel={handleCancel}
      >
        <Form<T> {...DefaultFormLayoutProps} {...formProps} form={form}>
          {formChildren}
        </Form>
      </CrudyModal>
    </>
  );
}
