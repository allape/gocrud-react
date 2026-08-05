/**
 * All modals created by {@link CrudyModal} will be effected by this z-index.
 *
 * z-index will be increased or decreased by one at every change of {@link import("antd").ModalProps#open}.
 *
 * Change this variable for next modal when all modals are closed.
 */
// eslint-disable-next-line
export let AntdModalInitZIndex = 1000;
