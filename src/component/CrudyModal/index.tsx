import { Modal, ModalProps } from "antd";
import React from "react";
import useMobile from "../../hook/useMobile.ts";

export default function CrudyModal({
  children,
  ...props
}: ModalProps): React.ReactElement {
  const isMobile = useMobile();
  return (
    <Modal
      {...props}
      styles={{
        ...props.styles,
        content: {
          padding: isMobile ? "10px" : "",
          ...props.styles?.content,
        },
      }}
      style={{
        top: isMobile ? "0" : "10px",
        paddingBottom: isMobile ? "0" : undefined,
        ...props.style,
      }}
    >
      {children}
    </Modal>
  );
}
