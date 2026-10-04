import { Modal, ModalProps } from "antd";
import React, { CSSProperties, useCallback, useState } from "react";
import { AntdModalInitZIndex } from "../../config/antd.ts";
import useMobile from "../../hook/useMobile.ts";

let ModalOpenCount = 0;
let ModalOpenAccumulatedCount = 0;

export type ModalStyles = { body?: CSSProperties };

export default function CrudyModal({
  children,
  open,
  afterOpenChange,
  styles,
  ...props
}: ModalProps): React.ReactElement {
  const isMobile = useMobile();

  const [zIndex, setZIndex] = useState<number>(AntdModalInitZIndex);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      afterOpenChange?.(open);
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
    },
    [afterOpenChange],
  );

  return (
    <Modal
      open={open}
      zIndex={zIndex}
      {...props}
      afterOpenChange={handleOpenChange}
      styles={{
        ...styles,
        body: {
          padding: isMobile ? "10px" : "",
          ...(styles as ModalStyles)?.body, // TypeScript emits "TS2339: Property body does not exist on type"
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
