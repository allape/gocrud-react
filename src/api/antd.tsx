import Crudy, {
  Config,
  get,
  GetFunc,
  i18n,
  IBase,
  IBaseSearchParams,
  M2MConnectorHandler,
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

export default class AntdCrudy<
  T extends IBase,
  SearchParams extends IBaseSearchParams = IBaseSearchParams,
> extends Crudy<T, SearchParams> {
  constructor(
    public readonly baseUrl: string,
    protected readonly getFunc: GetFunc = antdget,
  ) {
    super(baseUrl, getFunc);
  }
}

export class AntdM2MConnectorHandler<
  M1 extends IBase,
  M2 extends IBase,
  M2M,
  SearchParams = object,
> extends M2MConnectorHandler<M1, M2, M2M, SearchParams> {
  constructor(
    public readonly baseUrl: string,
    protected readonly m1Crudy: AntdCrudy<M1>,
    protected readonly m2Crudy: AntdCrudy<M2>,
    protected readonly m1IdFieldName: keyof M2M,
    protected readonly m2IdFieldName: keyof M2M,
    protected readonly getFunc: GetFunc = antdget,
  ) {
    super(baseUrl, m1Crudy, m2Crudy, m1IdFieldName, m2IdFieldName, getFunc);
  }
}
