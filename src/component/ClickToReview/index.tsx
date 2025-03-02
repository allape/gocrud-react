import { App, Modal, Tooltip } from "antd";
import { PropsWithChildren, ReactElement, ReactNode } from "react";

export interface IClickToReviewProps {
  tooltip?: ReactNode;
  title?: ReactNode;
  content?: ReactNode;
  okText?: ReactNode;
}

export default function ClickToReview({
  children,
  content,
  tooltip,
  title,
  okText,
}: PropsWithChildren<IClickToReviewProps>): ReactElement {
  const app = App.useApp();
  return (
    <Tooltip title={tooltip}>
      <span
        style={{ cursor: "pointer" }}
        onClick={() =>
          (app?.modal || Modal).info({
            title: title,
            content: content,
            width: "calc(100vw - 20px)",
            maskClosable: true,
            style: { top: "10px" },
            okText,
          })
        }
      >
        {children}
      </span>
    </Tooltip>
  );
}
