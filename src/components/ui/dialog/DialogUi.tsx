"use client";
import React, { useState } from "react";
import ModalUi from "./ModalUi";

const DialogUi = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleModal = () => {
    setIsOpen(!isOpen);
  };

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="flex items-center">
      <button
        className="
          rounded-md
          px-4
          py-2
          text-sm
          font-medium
          text-fg-inverse
          bg-primary
          hover:bg-primary-hover
          transition-all
          focus-ring-visible
        "
        onClick={handleModal}
      >
        Open Dialog
      </button>

      {isOpen ? (
        <ModalUi
          handleClose={onClose}
          title="Dialog"
          description="Cyan UI dialog content."
        >
          <p className="text-sm text-fg-muted">Add your dialog content here.</p>
        </ModalUi>
      ) : null}
    </div>
  );
};

export default DialogUi;
