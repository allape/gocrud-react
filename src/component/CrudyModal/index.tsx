import { Modal, ModalProps } from "antd";
import React, { CSSProperties, useEffect, useState } from "react";
import { AntdModalInitZIndex } from "../../config/antd.ts";
import useMobile from "../../hook/useMobile.ts";

let ModalOpenCount = 0;
let ModalOpenAccumulatedCount = 0;

function NowIndex(): number {
  return AntdModalInitZIndex + ModalOpenAccumulatedCount * 2;
}

export type ModalStyles = { body?: CSSProperties };

export default function CrudyModal({
  children,
  open,
  styles,
  ...props
}: ModalProps): React.ReactElement {
  const isMobile = useMobile();

  const [zIndex, setZIndex] = useState<number>(NowIndex);

  useEffect(() => {
    if (open) {
      ModalOpenCount += 1;
      ModalOpenAccumulatedCount += 1;
      const id = setTimeout(() => setZIndex(NowIndex));
      return (): void => {
        clearTimeout(id);
      };
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
