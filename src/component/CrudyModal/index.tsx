import { Modal, ModalProps } from "antd";
import { ModalSemanticType } from "antd/es/modal/interface";
import cls from "classnames";
import { ReactElement, useEffect, useMemo, useState } from "react";
import { AntdModalInitZIndex } from "../../config/antd.ts";
import { mergeSemanticType } from "../../helper/antd.tsx";
import styles from "./style.module.scss";

let ModalOpenCount = 0;
let ModalOpenAccumulatedCount = 0;

function NowIndex(): number {
  return AntdModalInitZIndex + ModalOpenAccumulatedCount * 2;
}

export type ICrudyModalProps = ModalProps;

export default function CrudyModal({
  children,
  open,
  className,
  classNames: propsClassNames,
  ...props
}: ICrudyModalProps): ReactElement {
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

  const classNames = useMemo(() => {
    return mergeSemanticType<ModalProps, ModalSemanticType, "classNames">(
      propsClassNames,
      (old) => {
        return {
          ...old,
          container: cls(styles.container, old?.container),
          body: cls(styles.body, old?.body),
        };
      },
    );
  }, [propsClassNames]);

  return (
    <Modal
      open={open}
      zIndex={zIndex}
      {...props}
      classNames={classNames}
      className={cls(styles.dialog, className)}
    >
      {children}
    </Modal>
  );
}
