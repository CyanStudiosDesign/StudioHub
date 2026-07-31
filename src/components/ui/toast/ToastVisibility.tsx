// ToastVisibility.tsx

"use client";

import { useState, useEffect } from "react";
import ToastUi from "../toast/ToastUi";

const ToastVisibility = () => {
  const [showToast, setShowToast] = useState(false);

  const handleToast = () => {
    setShowToast(true);
  };

  useEffect(() => {
    if (!showToast) return;

    const timerId = setTimeout(() => {
      setShowToast(false);
    }, 3000);

    return () => {
      clearTimeout(timerId);
    };
  }, [showToast]);

  return (
    <div className="bg-[var(--color-canvas)]">
      <div className="">
        <button
          onClick={handleToast}
          className="
            flex items-center justify-center gap-[var(--spacing-4)]
            h-12 px-[var(--spacing-4)]
            rounded-[var(--radius-md)]
            bg-[var(--color-primary)]
            text-[var(--color-fg-inverse)]
            border border-[var(--color-border)]
            shadow-[var(--shadow-sm)]
            cursor-pointer
            focus-ring-visible
            transition-all duration-[var(--duration-base)]
          "
        >
          Click Me!
        </button>

        {showToast && <ToastUi message="Profile updated successfully!" onDismiss={() => setShowToast(false)} />}
      </div>
    </div>
  );
};

export default ToastVisibility;
