export function DefaultChannel(): EventTarget {
  try {
    return window;
  } catch {
    /* empty */
  }
  try {
    return self;
  } catch {
    /* empty */
  }
  try {
    return global;
  } catch {
    /* empty */
  }

  throw new Error("No global channel found");
}

export type EEEventListener<NAME extends string = string, PAYLOAD = unknown> = (
  e: EEEvent<NAME, PAYLOAD>,
) => void;

export class EEEvent<NAME extends string, T> extends Event {
  constructor(
    public readonly event: NAME,
    public readonly value: T,
  ) {
    super(event);
  }
}

export interface IOptions {
  warningThreshold: number;
}

export default class EventEmitter<
  NAME extends string = string,
  PAYLOAD = unknown,
  OPTIONS extends IOptions = IOptions,
> {
  private readonly _prefix = `EventEmitter:${Date.now()}:${Math.random().toString(36).slice(2)}`;

  private readonly _listeners: Partial<
    Record<NAME, EEEventListener<NAME, PAYLOAD>[]>
  > = {};

  protected readonly options: OPTIONS;

  constructor(
    protected readonly channel: EventTarget = DefaultChannel(),
    options?: Partial<OPTIONS>,
  ) {
    this.options = {
      warningThreshold: 10,
      ...options,
    } as OPTIONS;
  }

  protected getUniqueEventName(event: NAME): string {
    return `${this._prefix}:${event}`;
  }

  dispatchEvent(event: NAME, data?: PAYLOAD): void {
    this.channel.dispatchEvent(
      new EEEvent(this.getUniqueEventName(event), data),
    );
  }

  addEventListener(
    event: NAME,
    listener: EEEventListener<NAME, PAYLOAD>,
    options?: AddEventListenerOptions | boolean,
  ): void {
    if (this._listeners[event]) {
      if (!this._listeners[event].includes(listener)) {
        this._listeners[event].push(listener);
      }
    } else {
      this._listeners[event] = [listener];
    }

    this.channel.addEventListener(
      this.getUniqueEventName(event),
      listener as EventListener,
      options,
    );

    if (this._listeners[event].length > this.options.warningThreshold) {
      console.warn(
        this,
        `${event} has more than 10 listeners, did you forget to remove them?`,
      );
    }
  }

  removeEventListener(
    event: NAME,
    listener: EEEventListener<NAME, PAYLOAD>,
    options?: EventListenerOptions | boolean,
  ): void {
    this._listeners[event] = (this._listeners[event] || []).filter(
      (l) => l !== listener,
    );
    this.channel.removeEventListener(
      this.getUniqueEventName(event),
      listener as EventListener,
      options,
    );
  }

  removeAllListeners(event?: NAME): void {
    if (event) {
      this._listeners[event]?.forEach((listener) =>
        this.removeEventListener(event, listener),
      );
      this._listeners[event] = [];
    } else {
      Object.keys(this._listeners).forEach(
        (e) => e && this.removeAllListeners(e as NAME),
      );
    }
  }

  once(
    event: NAME,
    listener: EEEventListener<NAME, PAYLOAD>,
    options?: AddEventListenerOptions | boolean,
  ): void {
    const onceListener = (e: EEEvent<NAME, PAYLOAD>) => {
      this.removeEventListener(event, onceListener);
      listener(e);
    };
    this.addEventListener(event, onceListener, options);
  }
}
