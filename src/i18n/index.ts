import i18next, { type Resource, type TFunction } from "i18next";
import { initReactI18next } from "react-i18next";

const Default = {
  gocrud: {
    retryQuestionMark: "Retry?",
    error: "Error",
    cancel: "Cancel",
    manage: "Manage",
    reload: "Reload",
    add: "Add",
    edit: "Edit",
    save: "Save",
    search: "Search",
    reset: "Reset",
    close: "Close",
    delete: "Delete",
    deleteThisRecord: "Delete this record?",
    actions: "Actions",
    viewer: "Viewer",
    clickToReview: "Click to review",
    totalRender: "{{from}}-{{to}} of {{total}}",
  },
};

export default Default;

export const EN = Default;

export const ZHCN: typeof Default = {
  gocrud: {
    add: "添加",
    cancel: "取消",
    close: "关闭",
    edit: "编辑",
    error: "错误",
    manage: "管理",
    reload: "刷新",
    search: "搜索",
    reset: "重置",
    retryQuestionMark: "重试？",
    save: "保存",
    delete: "删除",
    deleteThisRecord: "删除这条记录？",
    actions: "操作",
    viewer: "查看器",
    clickToReview: "点击查看详情",
    totalRender: "{{from}}-{{to}} 共 {{total}}",
  },
};

export function getLanguage(): string {
  return navigator.language;
}

export async function setup(
  resources: Resource = {
    zh: {
      translation: ZHCN,
    },
    en: {
      translation: EN,
    },
  },
): Promise<TFunction> {
  return i18next.use(initReactI18next).init({
    resources,
    lng: getLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
}
