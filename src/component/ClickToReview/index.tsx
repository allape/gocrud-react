import { App, Modal, ModalFuncProps, Tooltip } from "antd";
import { PropsWithChildren, ReactElement, ReactNode } from "react";

export interface IClickToReviewProps {
  tooltip?: ReactNode;
  content?: ReactNode;
  modalProps?: ModalFuncProps;
}

export default function ClickToReview({
  children,
  content,
  tooltip,
  modalProps,
}: PropsWithChildren<IClickToReviewProps>): ReactElement {
  const app = App.useApp();
  return (
    <Tooltip title={tooltip}>
      <span
        style={{ cursor: "pointer" }}
        onClick={() =>
          (app?.modal || Modal).info({
            icon: null,
            content: content,
            width: "100%",
            closable: true,
            mask: {
              closable: true,
            },
            style: { top: "10px" },
            styles: {
              container: {
                padding: "20px",
              },
              body: {
                padding: "0",
                maxHeight: "calc(100dvh - 60px)",
                overflowY: "auto",
                overflowX: "hidden",
              },
            },
            footer: null,
            ...modalProps,
          })
        }
      >
        {children}
      </span>
    </Tooltip>
  );
}
