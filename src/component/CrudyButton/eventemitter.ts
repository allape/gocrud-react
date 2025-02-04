import { IBase } from "@allape/gocrud";
import { RecursivePartial } from "../../helper/antd.tsx";
import { EEEventListener } from "../../helper/eventemitter.ts";
import CrudyEventEmitter from "../CrudyTable/eventemitter.ts";

export interface CrudyButtonEventEmitter<T extends IBase>
  extends CrudyEventEmitter<T> {
  dispatchEvent(event: "reload"): void;

  dispatchEvent(event: "open-save-form", record?: RecursivePartial<T>): void;

  dispatchEvent(event: "open"): void;

  dispatchEvent(event: "close"): void;

  addEventListener(
    event: "reload",
    listener: EEEventListener<"reload">,
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
    event: "open",
    listener: EEEventListener<"open">,
    options?: AddEventListenerOptions | boolean,
  ): void;

  addEventListener(
    event: "close",
    listener: EEEventListener<"close">,
    options?: AddEventListenerOptions | boolean,
  ): void;

  removeEventListener(
    event: "reload",
    listener: EEEventListener<"reload">,
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
    event: "open",
    listener: EEEventListener<"open">,
    options?: EventListenerOptions | boolean,
  ): void;

  removeEventListener(
    event: "close",
    listener: EEEventListener<"close">,
    options?: EventListenerOptions | boolean,
  ): void;
}

export default function NewCrudyButtonEventEmitter<T extends IBase>() {
  return new CrudyEventEmitter<T>() as CrudyButtonEventEmitter<T>;
}
