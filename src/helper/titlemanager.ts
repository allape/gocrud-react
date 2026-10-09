import { v4 } from "uuid";
import { Millisecond } from "../config/misc.ts";

export type Priority = number;

/**
 * Make title blink.
 */
export interface IBlinkOptions {
  /**
   * Only blink when {@link interval} is larger than 0
   * @default 0
   */
  interval?: Millisecond;
  /**
   * @default "secondary-title"
   */
  placeholder?: "empty" | "secondary-title" | "app-title";
}

export const DefaultWordSplitter: Exclude<
  IScrollOptions["wordSplitter"],
  undefined
> = /\S+\s+/g;

export const DefaultScrollGap: Exclude<IScrollOptions["gap"], undefined> = " ";

/**
 * Make title scrollable.
 *
 * For example: displaying "Never Gonna Give You Up - Rick Astley" with gap of two spaces and a word splitter of /\S+/
 * - Step 0: Never Gonna Give You Up - Rick Astley  Never ...
 * - Step 1: Gonna Give You Up - Rick Astley  Never
 * - Step 2: Give You Up - Rick Astley  Never Gonna
 * - Step 3: You Up - Rick Astley  Never Gonna Give
 * - Step 4: Up - Rick Astley  Never Gonna Give You
 * - Step 5: - Rick Astley  Never Gonna Give You Up
 * - Step 6: Rick Astley  Never Gonna Give You Up -
 * - Step 6: Astley  Never Gonna Give You Up - Rick
 * - Step 7: Never Gonna Give You Up - Rick Astley  Never ...
 */
export interface IScrollOptions {
  /**
   * Only scroll when {@link interval} is larger than 0
   * @default 0
   */
  interval?: Millisecond;
  /**
   * @default {@link DefaultWordSplitter}
   */
  wordSplitter?: RegExp;
  /**
   * @default {@link DefaultScrollGap}
   */
  gap?: string;
}

/**
 * It is not recommended to use {@link ITitleFrame#blink} and {@link ITitleFrame#scroll} at the same time.
 */
export interface ITitleFrame {
  title: string;
  priority: Priority;
  id: string;
  createdTime: number;

  /**
   * @see {@link IBlinkOptions}
   */
  blink?: IBlinkOptions;
  /**
   * @see {@link IScrollOptions}
   */
  scroll?: IScrollOptions;
}

export function DefaultSetTitleFunc(title: string): void {
  window.document.title = title;
}

export default class TitleManager {
  private _blinkTimerId: number = -1;
  private _scrollTimerId: number = -1;

  private _titleStack: ITitleFrame[] = [];

  private _lastRenderedTitle = "";

  private readonly _setTitleFunc: typeof DefaultSetTitleFunc;

  constructor(
    private setTitleFunc: typeof DefaultSetTitleFunc = DefaultSetTitleFunc,
  ) {
    this._setTitleFunc = (title: string) => {
      this.setTitleFunc(title);
      this._lastRenderedTitle = title;
    };
  }

  private _renderTitle(frame?: ITitleFrame): void {
    if (frame) {
      this._titleStack.push(frame);
    }

    this._titleStack
      .sort((a, b) => b.priority - a.priority)
      .sort((a, b) => b.createdTime - a.createdTime);

    clearInterval(this._blinkTimerId);
    clearInterval(this._scrollTimerId);

    const top = this._titleStack[0];
    if (!top) {
      return;
    }

    this._setTitleFunc(top.title);

    if (top.blink?.interval && top.blink.interval > 0) {
      let placeholder = "";

      if (
        !top.blink?.placeholder ||
        top.blink.placeholder === "secondary-title"
      ) {
        placeholder = this._titleStack[1]?.title || "";
      } else if (top.blink.placeholder === "app-title") {
        placeholder =
          this._titleStack.find(
            (i) => i.priority === TitleManager.PresetPriorities.App,
          )?.title || "";
      }

      let count = 0;
      this._blinkTimerId = setInterval(() => {
        count += 1;
        this._setTitleFunc(count % 2 === 0 ? top.title : placeholder);
      }, top.blink.interval);
    }

    if (top.scroll?.interval && top.scroll.interval > 0) {
      let segments = Array.from(
        `${top.title}${top.scroll.gap || DefaultScrollGap}${top.title}`.match(
          top.scroll.wordSplitter || DefaultWordSplitter,
        ) || [],
      );

      this._setTitleFunc(segments.join("").trim());

      this._scrollTimerId = setInterval(() => {
        const first = segments.shift() || "";
        segments = [...segments, first];
        this._setTitleFunc(segments.join("").trim());
      }, top.scroll.interval);
    }
  }

  public setTitle(
    title: string,
    priority: Priority = TitleManager.PresetPriorities.Page,
    options?: Partial<Pick<ITitleFrame, "id" | "blink" | "scroll">>,
  ): ITitleFrame {
    const { id = v4(), ...otherOptions } = options || {};

    const frame: ITitleFrame = {
      title,
      priority,
      id,
      createdTime: performance.now(),
      ...otherOptions,
    };

    this._renderTitle(frame);

    return frame;
  }

  public unsetTitleById(id: ITitleFrame["id"]): void {
    this._titleStack = this._titleStack.filter((frame) => frame.id !== id);
    this._renderTitle();
  }

  public unsetTitleByPriority(priority: ITitleFrame["priority"]): void {
    this._titleStack = this._titleStack.filter(
      (frame) => frame.priority !== priority,
    );
    this._renderTitle();
  }

  public getTitleFrameRef(): typeof this._titleStack {
    return this._titleStack;
  }

  public replaceTitleByPriority(
    priority: ITitleFrame["priority"],
    ...args: Parameters<typeof this.setTitle>
  ): ITitleFrame {
    this.unsetTitleByPriority(priority);
    return this.setTitle(...args);
  }

  public removeAllAndSetTitle(
    ...args: Parameters<typeof this.setTitle>
  ): ITitleFrame {
    this._titleStack = [];
    return this.setTitle(...args);
  }

  public setAppTitle(title: string): ITitleFrame {
    return this.setTitle(title, TitleManager.PresetPriorities.App, {
      id: "app",
    });
  }

  public getLastRenderedTitle(): string {
    return this._lastRenderedTitle;
  }

  /**
   * - {@link PresetPriorities#App} Default priority when there is no one to set title.
   *   Just like the name of an Application.
   * - {@link PresetPriorities#Page} Priority for a page or a storyboard which user can navigate through each other.
   * - {@link PresetPriorities#Message} Priority for new messages or notifications.
   * - {@link PresetPriorities#Critical} Priority for critical alert.
   *   For example: natural disaster alert(earthquake, tsunami etc.), system critical error alert.
   */
  public static PresetPriorities = {
    App: 0 as Priority,
    Page: 10 as Priority,
    Message: 1_000 as Priority,
    Critical: 1_000_000 as Priority,
  };
}

export const defaultTitleManager = new TitleManager();
