import { toast, ToastContainer } from 'react-toastify';

export const notifySuccess = (msg: any) => toast.success(msg);
export const notifyError = (msg: any) => toast.error(msg);
export const notifyWarn = (msg: any) => toast.warn(msg);
