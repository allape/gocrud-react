import { Millisecond, Second } from "../config/misc.ts";

export async function delay(ms: Millisecond): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sleep(s: Second): Promise<void> {
  return delay(s * 1000);
}
