"use client";

import { useAppUpdate } from "@/hooks/use-app-update";
import UpdateModal from "@/components/utils/update-modal";
import React, { createContext, useContext, useEffect, useState } from "react";

type UpdateContextType = {
  loading: boolean;
  available: boolean;
  lastChecked: Date | null;
  checkForUpdates: (force?: boolean) => Promise<boolean>;
};

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const useUpdateContext = () => {
  const context = useContext(UpdateContext);
  if (context === undefined) {
    throw new Error("useUpdateContext must be used within an UpdateProvider");
  }
  return context;
};

type UpdateProviderProps = {
  children: React.ReactNode;
};

export const UpdateProvider = ({ children }: UpdateProviderProps) => {
  const {
    info,
    loading,
    available,
    lastChecked,
    applyUpdate,
    dismissUpdate,
    checkForUpdates,
    backgroundCheck,
  } = useAppUpdate();
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    if (available && info) {
      setShowModal(true);
    }
  }, [available, info]);

  useEffect(() => {
    let mounted = true;

    const performBackgroundCheck = async () => {
      if (typeof window === "undefined") return;

      try {
        await backgroundCheck();
      } catch (error) {
        console.error("Background update check failed:", error);
      }
    };

    const timer = setTimeout(() => {
      if (mounted) {
        performBackgroundCheck();
      }
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [backgroundCheck]);

  const handleModalClose = (open: boolean) => {
    setShowModal(open);
    if (!open && available) {
      dismissUpdate();
    }
  };

  const contextValue: UpdateContextType = {
    loading,
    available,
    lastChecked,
    checkForUpdates,
  };

  return (
    <UpdateContext.Provider value={contextValue}>
      {children}

      {info && (
        <UpdateModal
          open={showModal}
          updateInfo={info}
          onUpdate={applyUpdate}
          onIgnore={dismissUpdate}
          onOpenChange={handleModalClose}
        />
      )}
    </UpdateContext.Provider>
  );
};
