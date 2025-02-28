import { i18n, IBase } from "@allape/gocrud";
import { useToggle } from "@allape/use-loading";
import { Button, ButtonProps } from "antd";
import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Default from "../../i18n";
import CrudyTable, { ICrudyTableProps } from "../CrudyTable";
import UpperModal from "../UpperModal";
import NewCrudyButtonEventEmitter, {
  CrudyButtonEventEmitter,
} from "./eventemitter.ts";

export interface ICrudyButtonProps<
  T extends IBase = IBase,
  SP extends object = object,
> extends ICrudyTableProps<T, SP> {
  emitter?: CrudyButtonEventEmitter<T>;
  buttonProps?: Omit<ButtonProps, "onClick" | "children">;
}

export default function CrudyButton<
  T extends IBase = IBase,
  SP extends object = object,
>({
  name,
  emitter = NewCrudyButtonEventEmitter<T>(),
  buttonProps,
  ...props
}: ICrudyButtonProps<T, SP>): React.ReactElement {
  const { t } = useTranslation();

  const [tableVisible, openTable_, closeTable] = useToggle(false);

  const openTable = useCallback(() => {
    emitter.dispatchEvent("reload");
    openTable_();
  }, [emitter, openTable_]);

  useEffect(() => {
    emitter.addEventListener("open", openTable);
    emitter.addEventListener("close", closeTable);

    return () => {
      emitter.removeEventListener("open", openTable);
      emitter.removeEventListener("close", closeTable);
    };
  }, [closeTable, emitter, openTable]);

  return (
    <>
      <Button {...buttonProps} onClick={openTable}>
        {i18n.ot("gocrud.manage", Default.gocrud.manage, t)} {name}
      </Button>
      <UpperModal
        open={tableVisible}
        width={1200}
        footer={null}
        onCancel={closeTable}
        zIndex={1001}
      >
        <CrudyTable<T, SP> name={name} emitter={emitter} {...props} />
      </UpperModal>
    </>
  );
}
