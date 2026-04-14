import { IBase, IBaseSearchParams } from "@allape/gocrud";
import { RecursivePartial } from "../../helper/antd.tsx";
import { EEEventListener } from "../../helper/eventemitter.ts";
import CrudyEventEmitter from "../CrudyTable/eventemitter.ts";

export interface CrudyButtonEventEmitter<
  T extends IBase,
  SP extends IBaseSearchParams = IBaseSearchParams,
> extends CrudyEventEmitter<T> {
  dispatchEvent(event: "reload", searchParams?: SP): void;
  dispatchEvent(event: "open-save-form", record?: RecursivePartial<T>): void;
  dispatchEvent(event: "save-form-opened", record?: T): void;
  dispatchEvent(event: "save-form-closed", record?: T): void;
  dispatchEvent(event: "open", searchParams?: SP): void;
  dispatchEvent(event: "close"): void;
  dispatchEvent(event: string, data?: unknown): void;

  addEventListener(
    event: "reload",
    listener: EEEventListener<"reload", SP | undefined>,
    options?: AddEventListenerOptions | boolean,
  ): void;
  addEventListener(
    event: "open-save-form",
    listener: EEEventListener<
      "open-save-form",
      RecursivePartial<T> | undefined
    >,
    options?: AddEventListenerOptions | boolean,
  ): void;
  addEventListener(
    event: "save-form-opened",
    listener: EEEventListener<"save-form-opened", T | undefined>,
    options?: AddEventListenerOptions | boolean,
  ): void;
  addEventListener(
    event: "save-form-closed",
    listener: EEEventListener<"save-form-closed", T | undefined>,
    options?: AddEventListenerOptions | boolean,
  ): void;
  addEventListener(
    event: "open",
    listener: EEEventListener<"open", SP | undefined>,
    options?: AddEventListenerOptions | boolean,
  ): void;
  addEventListener(
    event: "close",
    listener: EEEventListener<"close">,
    options?: AddEventListenerOptions | boolean,
  ): void;
  addEventListener(
    event: string,
    listener: EEEventListener<never, never>,
    options?: AddEventListenerOptions | boolean,
  ): void;

  removeEventListener(
    event: "reload",
    listener: EEEventListener<"reload", SP | undefined>,
    options?: EventListenerOptions | boolean,
  ): void;
  removeEventListener(
    event: "open-save-form",
    listener: EEEventListener<
      "open-save-form",
      RecursivePartial<T> | undefined
    >,
    options?: EventListenerOptions | boolean,
  ): void;
  removeEventListener(
    event: "save-form-opened",
    listener: EEEventListener<"save-form-opened", T | undefined>,
    options?: EventListenerOptions | boolean,
  ): void;
  removeEventListener(
    event: "save-form-closed",
    listener: EEEventListener<"save-form-closed", T | undefined>,
    options?: EventListenerOptions | boolean,
  ): void;
  removeEventListener(
    event: "open",
    listener: EEEventListener<"open", SP | undefined>,
    options?: EventListenerOptions | boolean,
  ): void;
  removeEventListener(
    event: "close",
    listener: EEEventListener<"close">,
    options?: EventListenerOptions | boolean,
  ): void;
  removeEventListener(
    event: string,
    listener: EEEventListener<never, never>,
    options?: EventListenerOptions | boolean,
  ): void;
}

export default function NewCrudyButtonEventEmitter<T extends IBase>() {
  return new CrudyEventEmitter<T>() as CrudyButtonEventEmitter<T>;
}
