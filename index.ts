import Crudy from "./src/api/antd.ts";
import "./src/index.scss";

export default Crudy;

export * as aapi from "./src/api/antd.ts";

export { default as CrudyButton } from "./src/component/CrudyButton";
export { default as CrudySelector } from "./src/component/CrudySelector";
export { default as CrudyTable } from "./src/component/CrudyTable";
export { default as TableSearchDropdown } from "./src/component/CrudyTable/TableSearchDropdown.tsx";
export { searchable } from "./src/component/CrudyTable/TableSearchDropdown.tsx";

export { default as Flex } from "./src/component/Flex";
export { default as ThemeProvider } from "./src/component/ThemeProvider";
export { default as UpperModal } from "./src/component/UpperModal";
export { default as useColorScheme } from "./src/hook/useColorScheme";

export * as aconfig from "./src/config/antd.ts";
export * as config from "./src/config";
export * as ahelper from "./src/helper/antd";

export { default as i18n } from "./src/i18n";
