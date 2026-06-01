import Crudy, {
  Config,
  get,
  GetFunc,
  i18n,
  upload as uploady,
} from "@allape/gocrud";
import { Modal } from "antd";
import Default from "../i18n";
import { AntdAppWindow } from "../vite-env";

export async function antdget<T = unknown>(
  url: string,
  config: Config<T> = {},
): Promise<T> {
  return get<T>(url, {
    onError: async (e: unknown | Error, message: string): Promise<T> => {
      return new Promise((resolve, reject) => {
        ((window as AntdAppWindow).antd?.modal || Modal).confirm({
          title: i18n.ot("gocrud.error", Default.gocrud.error),
          content: (
            <>
              <p>{url}</p>
              <p>{message}</p>
            </>
          ),
          okText: i18n.ot(
            "gocrud.retryQuestionMark",
            Default.gocrud.retryQuestionMark,
          ),
          cancelText: i18n.ot("gocrud.cancel", Default.gocrud.cancel),
          onOk: () => resolve(antdget<T>(url, config)),
          onCancel: () => reject(e),
        });
      });
    },
    ...config,
  });
}

export function antdupload(
  url: string,
  file: File | Blob,
  getFunc: GetFunc = antdget,
  config?: Config<string>,
): Promise<string> {
  return uploady(url, file, getFunc, config);
}

export default class AntdCrudy<T> extends Crudy<T> {
  constructor(public readonly baseUrl: string) {
    super(baseUrl, antdget);
  }
}
