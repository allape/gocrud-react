import { i18n, IBase, IBaseSearchParams } from "@allape/gocrud";
import { useToggle } from "@allape/use-loading";
import { Button, ButtonProps, ModalProps, TableProps } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EEEvent } from "../../helper/eventemitter.ts";
import Default from "../../i18n";
import CrudyModal from "../CrudyModal";
import CrudyTable, { ICrudyTableProps } from "../CrudyTable";
import NewCrudyButtonEventEmitter, {
  CrudyButtonEventEmitter,
} from "./eventemitter.ts";

const OpenEvent = new EEEvent("open", undefined);

const TableScroll: TableProps["scroll"] = {
  y: "calc(100vh - 240px)",
  x: "auto",
};

export interface ICrudyButtonProps<
  T extends IBase = IBase,
  SP extends IBaseSearchParams = IBaseSearchParams,
> extends ICrudyTableProps<T, SP> {
  emitter?: CrudyButtonEventEmitter<T, SP>;
  buttonProps?: Omit<ButtonProps, "onClick" | "children">;
  modalProps?: ModalProps;
}

export default function CrudyButton<
  T extends IBase = IBase,
  SP extends IBaseSearchParams = IBaseSearchParams,
>({
  name,
  emitter = NewCrudyButtonEventEmitter<T, SP>(),
  buttonProps,
  modalProps,
  searchParams: searchParamsFromProps,
  ...props
}: ICrudyButtonProps<T, SP>): React.ReactElement {
  const { t } = useTranslation();

  const [tableVisible, openTable_, closeTable] = useToggle(false);

  /**
   * When the modal content has not been rendered, `reload` event will be captured by listeners.
   * Therefore, we need to use searchParams as well
   */
  const [searchParams, setSearchParams] = useState<SP | undefined>(
    () => searchParamsFromProps,
  );

  useEffect(() => {
    if (
      !searchParamsFromProps ||
      Object.keys(searchParamsFromProps).length === 0
    ) {
      return;
    }

    setSearchParams((o) => ({
      ...o,
      ...searchParamsFromProps,
    }));
  }, [searchParamsFromProps]);

  const openTable = useCallback(
    (e: EEEvent<"open", SP | undefined>) => {
      setSearchParams(
        (o) =>
          ({
            ...o,
            ...e?.value,
          }) as SP,
      );
      emitter.dispatchEvent("reload" /*, e?.value*/);
      openTable_();
    },
    [emitter, openTable_],
  );

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
      <Button {...buttonProps} onClick={() => openTable(OpenEvent)}>
        {i18n.ot("gocrud.manage", Default.gocrud.manage, t)} {name}
      </Button>
      <CrudyModal
        open={tableVisible}
        width={{
          md: "90%",
          lg: "80%",
        }}
        footer={null}
        onCancel={closeTable}
        {...modalProps}
      >
        <CrudyTable<T, SP>
          name={name}
          emitter={emitter}
          searchParams={searchParams}
          scroll={TableScroll}
          {...props}
        />
      </CrudyModal>
    </>
  );
}
