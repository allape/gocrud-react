import { expect, test } from "vitest";
import { Millisecond, Second } from "../../config/misc.ts";
import { sleep } from "../promise.ts";
import TitleManager from "../titlemanager.ts";

async function collectTitleSamplesFor(
  s: Second,
  interval: Millisecond = 100,
): Promise<string[]> {
  console.log(`Collecting title samples for ${s}s by step of ${interval}ms...`);

  const titleQueue: string[] = [];
  const timerId = setInterval(() => {
    const title = window.document.title;
    titleQueue.push(title);
    console.log("Title Sample:", title);
  }, interval);

  await sleep(s);

  clearInterval(timerId);

  return titleQueue;
}

test("default", async () => {
  const tm = new TitleManager();

  tm.setAppTitle("Test App Title1");
  expect(window.document.title).toBe("Test App Title1");

  tm.setTitle("Test App Title2", TitleManager.PresetPriorities.App);
  expect(window.document.title).toBe("Test App Title2");

  tm.setTitle("Test Page Title1");
  expect(window.document.title).toBe("Test Page Title1");

  tm.setTitle("Test Page Title2");
  expect(window.document.title).toBe("Test Page Title2");

  tm.setTitle("Test Message Title1", TitleManager.PresetPriorities.Message);
  expect(window.document.title).toBe("Test Message Title1");

  const m2 = tm.setTitle(
    "Test Message Title2",
    TitleManager.PresetPriorities.Message,
  );
  expect(window.document.title).toBe("Test Message Title2");

  tm.setTitle("Test Critical Title1", TitleManager.PresetPriorities.Critical);
  expect(window.document.title).toBe("Test Critical Title1");

  tm.setTitle("Test Critical Title2", TitleManager.PresetPriorities.Critical);
  expect(window.document.title).toBe("Test Critical Title2");

  const c1 = tm.replaceTitleByPriority(
    TitleManager.PresetPriorities.Critical,
    "Test Critical Replace Title1",
  );
  expect(window.document.title).toBe("Test Critical Replace Title1");

  tm.unsetTitleById(c1.id);
  expect(window.document.title).toBe("Test Message Title2");

  const cus1 = tm.setTitle(
    "Test Custom Title",
    TitleManager.PresetPriorities.Critical + 1,
  );
  expect(window.document.title).toBe("Test Custom Title");

  tm.unsetTitleById(cus1.id);
  expect(window.document.title).toBe("Test Message Title2");

  tm.unsetTitleById(m2.id);
  expect(window.document.title).toBe("Test Message Title1");

  console.log(tm.getTitleFrameRef());

  tm.removeAllAndSetTitle(
    "Page But Message",
    TitleManager.PresetPriorities.Message,
    {
      blink: {
        interval: 100,
      },
    },
  );

  const messageFrame1 = tm.setTitle(
    "New Message",
    TitleManager.PresetPriorities.Message,
    {
      blink: {
        interval: 100,
      },
    },
  );
  const samples = await collectTitleSamplesFor(2, 10);
  tm.unsetTitleById(messageFrame1.id);

  expect(samples).contains("New Message");
  expect(samples).contains("Page But Message");

  const noMessageSamples = await collectTitleSamplesFor(2, 10);
  expect(noMessageSamples).not.contains("New Message");
  expect(noMessageSamples).contains("Page But Message");

  tm.removeAllAndSetTitle("App Title", TitleManager.PresetPriorities.App);

  expect(tm.getLastRenderedTitle()).toBe("App Title");

  const messageFrame2 = tm.setTitle(
    "New Message1",
    TitleManager.PresetPriorities.Message,
    {
      blink: {
        interval: 100,
        placeholder: "app-title",
      },
    },
  );
  const appTitleSamples = await collectTitleSamplesFor(2, 10);
  tm.unsetTitleById(messageFrame2.id);
  expect(appTitleSamples).contains("New Message1");
  expect(appTitleSamples).contains("App Title");

  const scrollFrame1 = tm.setTitle(
    "Never Gonna Give You Up - Rick Astley",
    TitleManager.PresetPriorities.Message,
    {
      scroll: {
        interval: 50,
      },
    },
  );
  const scrollSamples = await collectTitleSamplesFor(3, 10);
  tm.unsetTitleById(scrollFrame1.id);
  expect(scrollSamples).contains(
    "Never Gonna Give You Up - Rick Astley Never Gonna Give You Up - Rick",
  );
  expect(scrollSamples).contains(
    "Gonna Give You Up - Rick Never Gonna Give You Up - Rick Astley Never",
  );
  expect(scrollSamples).contains(
    "Astley Never Gonna Give You Up - Rick Never Gonna Give You Up - Rick",
  );
}, 30_000);
