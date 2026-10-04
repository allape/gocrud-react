import { IBase } from "@allape/gocrud";
import { List, ListProps } from "antd";
import { ReactElement, ReactNode, useCallback } from "react";

export interface ISelectionListProps<T extends IBase = IBase> extends ListProps<T>{
  value?: T[];
  onChange?: (value: T[]) => void;
}

export default function SelectionList<T extends IBase = IBase>({
  value, onChange, renderItem: propsRenderItem, ...props,
                                      }: ISelectionListProps<T>): ReactElement {
  const renderItem = useCallback((record: T): ReactNode => {
    return (
      <SortableListItem key={item.key} itemKey={item.key}>
        <DragHandle /> {item.key} {item.content}
      </SortableListItem>
    );
  }, []);
  return <List<T> renderItem={renderItem} {...props} />;
}
