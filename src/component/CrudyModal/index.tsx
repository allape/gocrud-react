import { Modal, ModalProps } from "antd";
import React, { useEffect, useState } from "react";
import useMobile from "../../hook/useMobile.ts";

let IncrementZIndex = 1000;

export default function CrudyModal({
  children,
  open,
  ...props
}: ModalProps): React.ReactElement {
  const isMobile = useMobile();

  const [zIndex, setZIndex] = useState<number>(IncrementZIndex);

  useEffect(() => {
    if (open) {
      IncrementZIndex += 1;
      // if (IncrementZIndex >= Number.MAX_SAFE_INTEGER) { // ignore this for now
      //   IncrementZIndex = 1000;
      // }
      setZIndex(IncrementZIndex);
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
