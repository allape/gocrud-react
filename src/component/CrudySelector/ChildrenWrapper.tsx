import { Divider } from "antd";
import { PropsWithChildren, ReactElement } from "react";

export default function ChildrenWrapper({
  children,
}: PropsWithChildren): ReactElement {
  return (
    <>
      {children ? (
        <>
          {children}
          <Divider style={{ margin: "10px 0" }} />
        </>
      ) : undefined}
    </>
  );
}
