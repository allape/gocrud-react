import { v4 } from "uuid";
import { Millisecond } from "../config/misc.ts";

export type Priority = number;

export interface ITitleFrame {
  title: string;
  priority: Priority;
  id: string;
  blinkInterval: Millisecond;
  createdTime: number;
}

export function DefaultSetTitleFunc(title: string): void {
  window.document.title = title;
}

export default class TitleManager {
  private _blinkTimerId: number = -1;
  private _titleStack: ITitleFrame[] = [];

  constructor(
    private setTitleFunc: typeof DefaultSetTitleFunc = DefaultSetTitleFunc,
  ) {}

  private _renderTitle(frame?: ITitleFrame): void {
    if (frame) {
      this._titleStack.push(frame);
    }

    this._titleStack
      .sort((a, b) => b.priority - a.priority)
      .sort((a, b) => b.createdTime - a.createdTime);

    clearInterval(this._blinkTimerId);

    const top = this._titleStack[0];
    if (!top) {
      return;
    }

    this.setTitleFunc(top.title);

    if (top.blinkInterval > 0) {
      const secondaryFrame = this._titleStack[1]?.title || "";

      let count = 0;
      this._blinkTimerId = setInterval(() => {
        count += 1;
        this.setTitleFunc(count % 2 === 0 ? top.title : secondaryFrame);
      }, top.blinkInterval);
    }
  }

  public setTitle(
    title: string,
    priority: Priority = TitleManager.PresetPriorities.Page,
    options?: Partial<Pick<ITitleFrame, "id" | "blinkInterval">>,
  ): ITitleFrame {
    const { id = v4(), blinkInterval = 0 } = options || {};

    const frame: ITitleFrame = {
      title,
      priority,
      id,
      blinkInterval,
      createdTime: performance.now(),
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
