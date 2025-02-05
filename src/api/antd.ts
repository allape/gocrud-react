import C, {
  get as getty,
  GetFunc,
  IRequestConfig,
  IResponse,
  stringify,
  upload as uploady,
} from "@allape/gocrud";
import { Modal } from "antd";
import { AntdAppWindow } from "../vite-env";

export async function get<
  T = unknown,
  C extends IRequestConfig<IResponse<T>, T> = IRequestConfig<IResponse<T>, T>,
>(url: string, config?: C): Promise<T> {
  return getty<T>(url, {
    onError: async (e: unknown | Error): Promise<T> => {
      return new Promise((resolve, reject) => {
        ((window as AntdAppWindow).antd?.modal || Modal).confirm({
          title: "Error",
          content: `${url}: ${stringify(e)}`,
          okText: "Retry",
          cancelText: "Cancel",
          onOk: () => resolve(get(url, config)),
          onCancel: () => reject(e),
        });
      });
    },
    ...config,
  });
}

export function upload(
  url: string,
  file: File | Blob,
  getty: GetFunc = get,
  config?: IRequestConfig<IResponse<string>, string>,
): Promise<string> {
  return uploady(url, file, getty, config);
}

export default class Crudy<T> extends C<T> {
  constructor(public readonly baseUrl: string) {
    super(baseUrl, get);
  }
}
