import C, {
  get as getty,
  GetFunc,
  IRequestConfig,
  IResponse,
  stringify,
  upload as uploady,
} from "@allape/gocrud";
import { Modal } from "antd";
import i18next from "i18next";
import Default from "../i18n";
import { AntdAppWindow } from "../vite-env";

export async function get<
  T = unknown,
  C extends IRequestConfig<IResponse<T>, T> = IRequestConfig<IResponse<T>, T>,
>(url: string, config?: C): Promise<T> {
  return getty<T>(url, {
    onError: async (e: unknown | Error): Promise<T> => {
      return new Promise((resolve, reject) => {
        ((window as AntdAppWindow).antd?.modal || Modal).confirm({
          title: i18next.t("gocrud.error") || Default.gocrud.error,
          content: `${url}: ${stringify(e)}`,
          okText:
            i18next.t("gocrud.retryQuestionMark") ||
            Default.gocrud.retryQuestionMark,
          cancelText: i18next.t("gocrud.cancel") || Default.gocrud.cancel,
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
