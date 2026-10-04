import { i18n, IBase, IBaseSearchParams } from "@allape/gocrud";
import { useLoading, useProxy } from "@allape/use-loading";
import {
  ExpandAltOutlined,
  ExportOutlined,
  ShrinkOutlined,
} from "@ant-design/icons";
import {
  Button,
  Divider,
  Empty,
  ModalProps,
  Spin,
  Splitter,
  SplitterProps,
} from "antd";
import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useMobile } from "../../../index.ts";
import Default from "../../i18n";
import CrudyModal from "../CrudyModal";
import CrudyTable, { ICrudyTableProps } from "../CrudyTable";
import SelectionList, { ISelectionListProps } from "./SelectionList.tsx";
import styles from "./style.module.scss";

/**
 * Use {@link ids} as order indicator to create an array of {@link T} with data provided by {@link records}
 * @param ids
 * @param records
 */
function ids2records<T extends IBase = IBase>(
  ids: T["id"][],
  records: T[],
): T[] {
  let changed: boolean;

  if (ids.length !== records.length) {
    changed = true;
  } else {
    changed = ids.findIndex((id, index) => records[index]?.id !== id) !== -1;
  }

  if (!changed) {
    return records;
  }

  return ids
    .map((id) => records.find((record) => record.id === id))
    .filter<T>((v) => !!v);
}

const SplitterStyles: SplitterProps["styles"] = {
  dragger: {
    default: {
      width: "20px",
    },
  },
};

export interface IAdvancedCrudySelectorProps<
  T extends IBase = IBase,
  SP extends IBaseSearchParams = IBaseSearchParams,
> {
  value?: T["id"][];
  onChange?: (value: T["id"][]) => void;

  height?: ISelectionListProps["height"];
  /**
   * ID field will always be available for search
   * @deprecated not support yet
   */
  extraFilterFields?: (keyof T)[];

  listProps?: Omit<ISelectionListProps<T>, "value" | "onChange" | "height">;
  tableProps: ICrudyTableProps<T, SP>;
}

export default function AdvancedCrudySelector<
  T extends IBase = IBase,
  SP extends IBaseSearchParams = IBaseSearchParams,
>({
  value,
  onChange,
  height: propsHeight = 300,
  // extraFilterFields: propsExtraFilterFields,
  listProps,
  tableProps,
}: IAdvancedCrudySelectorProps<T, SP>): ReactElement {
  const { crudy } = tableProps;

  const isMobile = useMobile();

  const { t } = useTranslation();

  const { loading, execute } = useLoading();

  // const extraFilterFieldsRef = usePropAsRef(propsExtraFilterFields);

  // const [keywords, keywordsRef, setKeywords] = useProxy<string>("");

  const [records, recordsRef, _setRecords] = useProxy<T[]>([]);
  // const [listRecords, setListRecords] = useState<T[]>([]);

  // const searchList = useCallback(() => {
  //   const kw = keywordsRef.current.trim();
  //
  //   if (!kw) {
  //     setListRecords(recordsRef.current);
  //     return;
  //   }
  //
  //   const extraFilterFields = extraFilterFieldsRef.current || [];
  //
  //   setListRecords(
  //     recordsRef.current.filter((record) => {
  //       if (`${record.id}` === keywordsRef.current) {
  //         return true;
  //       }
  //
  //       for (const field of extraFilterFields) {
  //         if (`${record[field]}`.includes(keywordsRef.current)) {
  //           return true;
  //         }
  //       }
  //
  //       return false;
  //     }),
  //   );
  // }, [extraFilterFieldsRef, keywordsRef, recordsRef]);

  const setRecords = useCallback<Dispatch<SetStateAction<T[]>>>(
    (recordsOrSetter) => {
      _setRecords(recordsOrSetter);
      // searchList();
    },
    // [_setRecords, searchList],
    [_setRecords],
  );

  // const handleSearchChange = useCallback(
  //   (e: ChangeEvent<HTMLInputElement>) => {
  //     setKeywords(e.target.value);
  //     searchList();
  //   },
  //   [searchList, setKeywords],
  // );

  useEffect(() => {
    const id = setTimeout(() => {
      if (!value || value.length === 0) {
        setRecords([]);
        return;
      }

      const missedId = value.filter(
        (id) =>
          recordsRef.current.findIndex((record) => record.id === id) === -1,
      );
      if (missedId.length === 0) {
        setRecords(ids2records(value, recordsRef.current));
        return;
      }

      execute(async () => {
        const newRecords =
          (await crudy?.all({
            in_id: missedId,
          } as SP)) || [];

        const mergedRecords = [...recordsRef.current, ...newRecords];

        setRecords(ids2records(value, mergedRecords));
      }).then();
    });
    return () => {
      clearTimeout(id);
    };
  }, [crudy, execute, recordsRef, setRecords, value]);

  const handleSelectionListChange = useCallback(
    (records: T[]) => {
      setRecords(records);
      onChange?.(records.map((record) => record.id));
    },
    [onChange, setRecords],
  );

  const modalStyles = useMemo<ModalProps["styles"]>(
    () => ({
      body: {
        maxHeight: isMobile ? "calc(100dvh - 120px)" : "calc(100dvh - 60px)",
        overflowY: "auto",
        overflowX: "hidden",
      },
    }),
    [isMobile],
  );

  const [height, setHeight] = useState<number>(300);

  const [tableContainer, setTableContainer] = useState<HTMLDivElement | null>(
    null,
  );

  useEffect(() => {
    if (!tableContainer) return;

    const ro = new ResizeObserver(([entry]) => {
      const { height } = entry.contentRect;
      setHeight(height - 56 - 21);
    });

    ro.observe(tableContainer);

    return () => {
      ro.disconnect();
    };
  }, [tableContainer]);

  const [open, setOpen] = useState<boolean>(false);

  const handleTableSelectionChange = useCallback(
    (ids: T["id"][], partialRecords: T[]) => {
      // do NOT use setRecords, let onChange to trigger the next rendering with recordsRef.current
      recordsRef.current = [...partialRecords, ...recordsRef.current];
      onChange?.(ids);
    },
    [onChange, recordsRef],
  );

  const renderedList = (
    <Spin spinning={loading}>
      <SelectionList
        // value={listRecords}
        value={records}
        onChange={handleSelectionListChange}
        cardProps={{
          styles: {
            root: open
              ? {
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                }
              : undefined,
          },
          // title: (
          //   <Input
          //     type="search"
          //     placeholder={i18n.ot(
          //       "gocrud.selector.total",
          //       Default.gocrud.selector.total,
          //       t,
          //       {
          //         count: records.length,
          //       },
          //     )}
          //     allowClear
          //     value={keywords}
          //     onChange={handleSearchChange}
          //   />
          // ),
          title: i18n.ot(
            "gocrud.selector.total",
            Default.gocrud.selector.total,
            t,
            {
              count: records.length,
            },
          ),
          extra: (
            <>
              <Divider orientation="vertical" />
              <Button
                type="primary"
                danger={open}
                onClick={() => setOpen((o) => !o)}
              >
                {open ? <ShrinkOutlined /> : <ExpandAltOutlined />}
              </Button>
            </>
          ),
        }}
        height={open ? height : propsHeight}
        {...listProps}
      />
    </Spin>
  );

  return (
    <div className={styles.wrapper}>
      {open ? (
        <Empty
          image={<ExportOutlined style={{ fontSize: "50px" }} />}
          description=""
        />
      ) : (
        renderedList
      )}
      <CrudyModal
        width="xxxl"
        destroyOnHidden
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        styles={modalStyles}
      >
        <Splitter styles={SplitterStyles}>
          <Splitter.Panel defaultSize="30%" min="20%" max="50%">
            {renderedList}
          </Splitter.Panel>
          <Splitter.Panel>
            <div ref={setTableContainer}>
              <CrudyTable
                {...tableProps}
                value={value}
                onChange={handleTableSelectionChange}
                cardProps={{
                  styles: {
                    root: open
                      ? {
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0,
                        }
                      : undefined,
                  },
                }}
              />
            </div>
          </Splitter.Panel>
        </Splitter>
      </CrudyModal>
    </div>
  );
}
