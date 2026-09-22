import { useProxy } from "@allape/use-loading";
import { Select, SelectProps } from "antd";
import {
  FocusEvent,
  KeyboardEvent,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { cut } from "../../helper/misc.ts";

export interface IAdvancedSearchProps extends Exclude<
  SelectProps<string[]>,
  | "children"
  | "onChange"
  | "mode"
  | "options"
  | "open"
  | "value"
  | "onDeselect"
  | "onSelect"
  // | "onInputKeyDown"
  // | "onFocus"
  // | "onBlur"
  | "onClear"
  | "searchValue"
  | "onSearch"
> {
  fields: Record<string, string[]>;
  extraOptions?: string[];
  strict?: boolean;
  separator?: string;
  onChange?: (value: string[]) => void;
  /**
   * Emitted when press Enter with Ctrl or Command
   */
  onMaskedEnter?: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export default function AdvancedSearch({
  separator = ":",
  strict = false,
  fields,
  extraOptions,
  value: propsValue,
  onChange,
  onInputKeyDown,
  onFocus,
  onBlur,
  onMaskedEnter,
  ...props
}: IAdvancedSearchProps): ReactElement {
  const [value, valueRef, setValue] = useProxy<string[]>([]);
  const [open, openRef, setOpen] = useProxy<boolean>(false);
  const [searchValue, searchValueRef, setSearchValue] = useProxy<string>("");

  const options = useMemo<SelectProps<string[]>["options"]>(() => {
    const optionsFromFields = Object.entries(fields)
      .map(([name, presets]) => {
        const opts = [];
        if (presets.length === 0) {
          opts.push(`${name}${separator}`);
        }
        opts.push(...presets.map((preset) => `${name}${separator}${preset}`));
        return opts;
      })
      .reduce((p, c) => [...p, ...c], []);
    const mergedOptions = [...optionsFromFields, ...(extraOptions || [])];
    return mergedOptions.map((value) => ({ label: value, value: value }));
  }, [extraOptions, fields, separator]);

  const emitChange = useCallback(
    (v: string) => {
      if (strict) {
        const [field, val] = cut(v, separator);
        if (!Object.keys(fields).includes(field) || !val) {
          return;
        }
      }
      onChange?.(Array.from(new Set([...valueRef.current, v])));
      setSearchValue("");
    },
    [fields, onChange, separator, setSearchValue, strict, valueRef],
  );

  const handleSearch = useCallback(
    (sv: string) => {
      setSearchValue(sv);
    },
    [setSearchValue],
  );

  const handleSelect = useCallback(
    (v: string) => {
      if (!openRef.current) {
        return;
      }
      if (v.endsWith(separator)) {
        setSearchValue(v);
      } else {
        emitChange(v);
      }
    },
    [emitChange, openRef, separator, setSearchValue],
  );

  const handleDeselect = useCallback(
    (v: string) => {
      const index = valueRef.current.indexOf(v);
      if (index === -1) {
        return;
      }
      onChange?.([
        ...valueRef.current.slice(0, index),
        ...valueRef.current.slice(index + 1),
      ]);
    },
    [onChange, valueRef],
  );

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      let shouldBlur = false;

      switch (e.key) {
        case "Tab":
        case "Enter": {
          if (e.ctrlKey || e.metaKey) {
            if (onMaskedEnter) {
              onMaskedEnter(e);
              shouldBlur = true;
            }
            break;
          }

          if (!searchValueRef.current) {
            break;
          }

          emitChange(searchValueRef.current);
          break;
        }
        case "Escape": {
          if (searchValueRef.current) {
            setSearchValue("");
            break;
          }
          shouldBlur = true;
          break;
        }
      }

      if (shouldBlur) {
        setOpen(false);
        const ele = e.target as HTMLInputElement;
        ele.blur();
      }

      onInputKeyDown?.(e);
    },
    [
      emitChange,
      onInputKeyDown,
      onMaskedEnter,
      searchValueRef,
      setOpen,
      setSearchValue,
    ],
  );

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      setOpen(true);
      onFocus?.(e);
    },
    [onFocus, setOpen],
  );

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      setOpen(false);
      onBlur?.(e);
    },
    [onBlur, setOpen],
  );

  const handleClear = useCallback(() => {
    onChange?.([]);
    setSearchValue("");
  }, [onChange, setSearchValue]);

  useEffect(() => {
    setValue(propsValue || []);
  }, [propsValue, setValue]);

  return (
    <Select
      allowClear
      showSearch
      {...props}
      mode="tags"
      options={options}
      open={open}
      value={value}
      onDeselect={handleDeselect}
      onSelect={handleSelect}
      onInputKeyDown={handleInputKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClear={handleClear}
      searchValue={searchValue}
      onSearch={handleSearch}
    />
  );
}
