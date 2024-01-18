import React, { useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Toast = ({ id, message, type }: any) => {
  useEffect(() => {
    showToast();
  }, []);

  const showToast = () => {
    // toast(message, { type });
    toast(message, {
      toastId: id,
      type,
    });
  };

  return <span style={{ display: "none" }}>{message}</span>;
};

const ToastWrapper = ({ toasts }: any) => {
  return (
    <div>
      <ToastContainer stacked />
      {toasts.map((toast: any) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};

export default ToastWrapper;
