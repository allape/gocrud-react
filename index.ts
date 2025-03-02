import "./src/index.scss";

import Crudy from "./src/api/antd.ts";

export default Crudy;

export * from "./src/api/antd.ts";

export {
  default as CrudyButton,
  type ICrudyButtonProps,
} from "./src/component/CrudyButton";

export {
  default as NewCrudyButtonEventEmitter,
  type CrudyButtonEventEmitter,
} from "./src/component/CrudyButton/eventemitter.ts";

export {
  default as CrudySelector,
  type ICrudySelectorProps,
} from "./src/component/CrudySelector";

export {
  default as CrudyTable,
  type ICrudyTableProps,
} from "./src/component/CrudyTable";
export { default as CrudyEventEmitter } from "./src/component/CrudyTable/eventemitter.ts";

export {
  default as Ellipsis,
  type IEllipsisProps,
} from "./src/component/Ellipsis";

export {
  default as TableSearchDropdown,
  searchable,
  type ITableSearchDropdownProps,
} from "./src/component/CrudyTable/TableSearchDropdown.tsx";

export {
  default as ClickToReview,
  type IClickToReviewProps,
} from "./src/component/ClickToReview";
export { default as Flex, type IFlexProps } from "./src/component/Flex";

export {
  default as ThemeProvider,
  type IThemeProviderProps,
} from "./src/component/ThemeProvider";

export {
  default as Uploader,
  type IUploaderProps,
} from "./src/component/Uploader";

export { default as CrudyModal } from "./src/component/CrudyModal";

export { default as useColorScheme } from "./src/hook/useColorScheme";

export * as config from "./src/config";

export * from "./src/helper/antd";
export * from "./src/helper/datetime";
export {
  default as EventEmitter,
  EEEvent,
  type EEEventListener,
  DefaultChannel,
  type IOptions,
} from "./src/helper/eventemitter";

export * as i18n from "./src/i18n";
