import { IBase, IBaseSearchParams } from "@allape/gocrud";
import { Dispatch, SetStateAction } from "react";
import { ICrudyTableProps } from "./index.tsx";

export interface IUseProps<
  T extends IBase = IBase,
  SP extends IBaseSearchParams = IBaseSearchParams,
> extends ICrudyTableProps<T, SP> {
  setSearchParams: SetStateAction<Dispatch<SP>>;
}
