import { i18n, IBase } from "@allape/gocrud";
import { useProxy } from "@allape/use-loading";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  HolderOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Button,
  Card,
  CardProps,
  Divider,
  Dropdown,
  DropdownProps,
  Empty,
  Input,
  Listy,
  ListyProps,
  MenuProps,
} from "antd";
import cls from "classnames";
import {
  ChangeEvent,
  CSSProperties,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import usePropAsRef from "../../hook/usePropAsRef.ts";
import Default from "../../i18n";
import { ModalStyles } from "../CrudyModal";
import Flex from "../Flex";
import styles from "./style.module.scss";

export type NameableRecord<T extends IBase = IBase> = T & { name?: string };

export interface ISortableItemProps<T extends IBase = IBase> {
  record: T;
  dimmed?: boolean;
  render?: (record: T) => ReactNode;
  className?: string;
  onToTop?: () => void;
  onToBottom?: () => void;
  onMove?: (delta: number) => void;
  onDelete?: () => void;
}

function SortableItem<T extends IBase = IBase>({
  record,
  render,
  dimmed,
  className,
  onToTop,
  onToBottom,
  onMove,
  onDelete,
}: ISortableItemProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: record.id });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: "relative", zIndex: 1 } : {}),
  };

  const menu = useMemo<DropdownProps["menu"]>(() => {
    const items: MenuProps["items"] = [];
    if (onToTop) {
      items.push({
        label: <VerticalAlignTopOutlined />,
        key: "ToTop",
        onClick: () => onToTop(),
      });
    }
    if (onMove) {
      items.push(
        {
          label: <ArrowUpOutlined />,
          key: "Up",
          onClick: () => onMove(-1),
        },
        {
          label: <ArrowDownOutlined />,
          key: "Down",
          onClick: () => onMove(1),
        },
      );
    }
    if (onToBottom) {
      items.push({
        label: <VerticalAlignBottomOutlined />,
        key: "ToBottom",
        onClick: () => onToBottom(),
      });
    }
    return {
      items,
    };
  }, [onMove, onToBottom, onToTop]);

  return (
    <Flex
      ref={setNodeRef}
      className={cls(styles.itemWrapper, dimmed && styles.dimmed)}
      style={style}
      alignItems="center"
      gap="4px"
    >
      <div className={cls(styles.item, className)}>
        {render?.(record) ||
          `${record.id}: ${(record as NameableRecord<T>).name || ""}`}
      </div>
      <Button
        danger
        type="text"
        size="small"
        icon={<DeleteOutlined />}
        onClick={onDelete}
      />
      <Divider orientation="vertical" size="small" />
      <Dropdown menu={menu} trigger={["contextMenu"]}>
        <Button
          type="text"
          size="small"
          icon={<HolderOutlined />}
          style={{ cursor: "move" }}
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
        />
      </Dropdown>
    </Flex>
  );
}

const BodyStyles: CSSProperties = {
  padding: "10px 0",
};

export interface ISelectionListProps<T extends IBase = IBase> extends Omit<
  ListyProps<T, T["id"]>,
  "itemRender" | "rowKey" | "items"
> {
  value?: T[];
  onChange?: (value: T[]) => void;
  itemRender?: ISortableItemProps<T>["render"];

  /**
   * ID field will always be available for search
   */
  extraFilterFields?: (keyof T)[];

  cardProps?: CardProps;
}

export default function SelectionList<T extends IBase = IBase>({
  value = [],
  onChange,
  itemRender: propsItemRender,

  extraFilterFields: propsExtraFilterFields,

  cardProps,
  ...props
}: ISelectionListProps<T>): ReactElement {
  const { t } = useTranslation();

  const extraFilterFieldsRef = usePropAsRef(propsExtraFilterFields);

  const searchTimerRef = useRef(-1);

  const [keywords, keywordsRef, setKeywords] = useProxy<string>("");

  const [highlighted, setHighlighted] = useState<T[]>([]);

  const handleSearch = useCallback(() => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const kw = keywordsRef.current.trim();

      if (!kw) {
        setHighlighted(value);
        return;
      }

      const extraFilterFields = extraFilterFieldsRef.current || [];

      setHighlighted(
        value.filter((record) => {
          if (`${record.id}` === keywordsRef.current) {
            return true;
          }

          for (const field of extraFilterFields) {
            if (
              `${record[field]}`.toLowerCase().includes(keywordsRef.current)
            ) {
              return true;
            }
          }

          return false;
        }),
      );
    }, 200);
  }, [extraFilterFieldsRef, keywordsRef, value]);

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setKeywords(e.target.value.toLowerCase());
      handleSearch();
    },
    [handleSearch, setKeywords],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 1 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    return (): void => {
      clearTimeout(searchTimerRef.current);
    };
  }, []);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // hooks end

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    const activeIndex = value.findIndex((item) => item.id === active.id);
    const overIndex = value.findIndex((item) => item.id === over.id);
    onChange?.(arrayMove(value, activeIndex, overIndex));
  };

  const renderItem = (record: T, index: number): ReactNode => {
    return (
      <SortableItem<T>
        record={record}
        render={propsItemRender}
        dimmed={!highlighted.find((hl) => hl.id === record.id)}
        onMove={(delta) => {
          let changeToIndex = index + delta;
          if (changeToIndex < 0) {
            changeToIndex = 0;
          } else if (changeToIndex >= value.length) {
            changeToIndex = value.length - 1;
          }
          onChange?.(arrayMove(value, index, changeToIndex));
        }}
        onToTop={() => {
          onChange?.(arrayMove(value, index, 0));
        }}
        onToBottom={() => {
          onChange?.(arrayMove(value, index, value.length - 1));
        }}
        onDelete={() => {
          value.splice(index, 1);
          onChange?.([...value]);
        }}
      />
    );
  };

  return (
    <div className={styles.wrapper}>
      <DndContext
        id="listy-drag-sorting"
        sensors={sensors}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={value.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <Card
            {...cardProps}
            title={
              <Flex gap={0}>
                <Input
                  type="search"
                  placeholder={i18n.ot(
                    "gocrud.selector.total",
                    Default.gocrud.selector.total,
                    t,
                    {
                      count: value.length,
                    },
                  )}
                  allowClear
                  value={keywords}
                  onChange={handleSearchChange}
                  onBlur={handleSearch}
                  onPressEnter={handleSearch}
                />
                <Divider orientation="vertical" />
              </Flex>
            }
            styles={{
              ...cardProps?.styles,
              body: {
                ...BodyStyles,
                ...(cardProps?.styles as ModalStyles)?.body,
              },
            }}
          >
            <Listy<T, T["id"]>
              rowKey="id"
              {...props}
              items={value}
              itemRender={renderItem}
            />
            {value.length === 0 ? <Empty /> : undefined}
          </Card>
        </SortableContext>
      </DndContext>
    </div>
  );
}
