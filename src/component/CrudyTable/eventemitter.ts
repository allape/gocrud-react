import { IBase } from "@allape/gocrud";
import { RecursivePartial } from "../../helper/antd.tsx";
import EventEmitter, { EEEventListener } from "../../helper/eventemitter.ts";

export default class CrudyEventEmitter<T extends IBase> extends EventEmitter {
  dispatchEvent(event: "reload"): void;
  dispatchEvent(event: "open-save-form", record?: RecursivePartial<T>): void;
  dispatchEvent(event: "save-form-closed", record?: T): void;
  dispatchEvent(event: string, data?: unknown): void {
    super.dispatchEvent(event, data);
  }

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
    event: "save-form-closed",
    listener: EEEventListener<"save-form-closed", T | undefined>,
    options?: AddEventListenerOptions | boolean,
  ): void;
  addEventListener(
    event: string,
    listener: EEEventListener<never, never>,
    options?: AddEventListenerOptions | boolean,
  ): void {
    super.addEventListener(event, listener as EventListener, options);
  }

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
    event: "save-form-closed",
    listener: EEEventListener<"save-form-closed", T>,
    options?: EventListenerOptions | boolean,
  ): void;
  removeEventListener(
    event: string,
    listener: EEEventListener<never, never>,
    options?: EventListenerOptions | boolean,
  ): void {
    super.removeEventListener(event, listener as EventListener, options);
  }
}
