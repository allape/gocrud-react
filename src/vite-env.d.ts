/// <reference types="vite/client" />

import type { useAppProps } from "antd/es/app/context";

declare interface ImportMetaEnv {
  /**
   * URL prefix of the GoCRUD server
   * @example http://localhost:8080/api
   */
  VITE_SERVER_URL?: string;
  /**
   * Static assets URL prefix of the GoCRUD server
   * @example http://localhost:8080/static
   */
  VITE_SERVER_STATIC_URL?: string;
}

declare class AntdAppWindow {
  antd?: useAppProps;
}
