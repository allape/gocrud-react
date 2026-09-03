import { FormProps, ModalProps } from "antd";

/**
 * All modals created by {@link CrudyModal} will be effected by this z-index.
 *
 * z-index will be increased or decreased by one at every change of {@link import("antd").ModalProps#open}.
 *
 * Change this variable for next modal when all modals are closed.
 */
// eslint-disable-next-line
export let AntdModalInitZIndex = 1000;

export const DefaultFormModalProps: ModalProps = {
  width: 800,
};

export const DefaultFormLayoutProps: Pick<FormProps, "labelCol" | "wrapperCol"> = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};
