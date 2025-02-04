import { Modal, ModalProps } from "antd";
import React from "react";

export default function UpperModal({
  children,
  ...props
}: ModalProps): React.ReactElement {
  return (
    <Modal {...props} style={{ top: "10px", ...props.style }}>
      {children}
    </Modal>
  );
}
