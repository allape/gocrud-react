import { Modal, ModalProps } from "antd";
import React, { useEffect, useState } from "react";
import { AntdModalInitZIndex } from "../../config/antd.ts";
import useMobile from "../../hook/useMobile.ts";

let ModalOpenCount = 0;
let ModalOpenAccumulatedCount = 0;

export default function CrudyModal({
  children,
  open,
  ...props
}: ModalProps): React.ReactElement {
  const isMobile = useMobile();

  const [zIndex, setZIndex] = useState<number>(AntdModalInitZIndex);

  useEffect(() => {
    if (open) {
      ModalOpenCount += 1;
      ModalOpenAccumulatedCount += 1;
      setZIndex(AntdModalInitZIndex + ModalOpenAccumulatedCount);
    } else {
      ModalOpenCount -= 1;
      if (ModalOpenCount <= 0) {
        ModalOpenCount = 0;
        ModalOpenAccumulatedCount = 0;
      }
    }
  }, [open]);

  return (
    <Modal
      open={open}
      zIndex={zIndex}
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
