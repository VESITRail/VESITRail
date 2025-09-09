"use client";

import { useServiceWorker } from "@/hooks/use-service-worker";

const ServiceWorkerProvider = ({ children }: { children: React.ReactNode }) => {
  useServiceWorker();
  return <>{children}</>;
};

export default ServiceWorkerProvider;
