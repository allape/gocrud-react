import { GetFunc } from "@allape/gocrud";
import { sha256ToHex } from "@allape/gocrud/src/sha256.ts";
import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload, UploadFile, UploadProps } from "antd";
import { RcFile } from "rc-upload/lib/interface";
import React, { useEffect, useState } from "react";
import { upload } from "../../api/antd.ts";

export interface IUploaderProps
  extends Omit<UploadProps, "onChange" | "fileList"> {
  get?: GetFunc;
  serverURL: string;
  value?: string | string[];
  onChange?: (value?: string | string[]) => void;
}

export default function Uploader({
  get,
  serverURL,
  value,
  onChange,
  listType,
  maxCount = 1,
  ...props
}: IUploaderProps): React.ReactElement {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | undefined>();

  const handlePreview: UploadProps["onPreview"] = async (file: UploadFile) => {
    setPreviewImage(file.url);
    setPreviewOpen(true);
  };

  const handleChange: UploadProps["onChange"] = ({ fileList }) => {
    if (fileList.length == 0) {
      onChange?.(undefined);
      return;
    }

    if (fileList.length === 1) {
      onChange?.(fileList[0].response);
    } else {
      onChange?.(fileList.filter((f) => !!f.response).map((f) => f.response));
    }
  };

  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  const handleCustomRequest: UploadProps["customRequest"] = ({
    file: f,
    onError,
    onSuccess,
    onProgress,
  }) => {
    const file = f as RcFile;

    const ac = new AbortController();
    (async () => {
      onProgress?.({ percent: 0 });
      const digest = await sha256ToHex(file);

      const fileItem: UploadFile = {
        uid: digest,
        name: file.name,
        status: "uploading",
      };
      file.uid = digest;
      setFileList((old) => [...old, fileItem]);

      try {
        onProgress?.({ percent: 50 });
        const url = await upload(
          `${serverURL}/${digest}.${file.name.split(".").pop() || "bin"}`,
          file,
          get,
          {
            signal: ac.signal,
          },
        );
        onProgress?.({ percent: 100 });
        onSuccess?.(url, file);
      } catch (e) {
        onError?.(e as Error);
      }
    })();
    return {
      abort: ac.abort,
    };
  };

  useEffect(() => {
    if (!value) {
      setFileList([]);
      return;
    }

    if (Array.isArray(value)) {
      setFileList(
        value.map((v) => ({
          uid: v,
          name: v,
          url: `${serverURL}${v}`,
          response: v,
        })),
      );
    } else {
      setFileList([
        {
          uid: value,
          name: value,
          url: `${serverURL}${value}`,
          response: value,
        },
      ]);
    }
  }, [serverURL, value]);

  return (
    <>
      <Upload
        listType={listType || "picture-circle"}
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        {...props}
        customRequest={handleCustomRequest}
      >
        {fileList.length >= maxCount ? null : uploadButton}
      </Upload>
      {previewImage && (
        <Image
          wrapperStyle={{ display: "none" }}
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) => !visible && setPreviewImage(""),
          }}
          src={previewImage}
        />
      )}
    </>
  );
}
