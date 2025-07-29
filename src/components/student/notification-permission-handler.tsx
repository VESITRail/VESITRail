"use client";

import { useFcm } from "@/hooks/use-fcm";
import { authClient } from "@/lib/auth-client";

const NotificationPermissionHandler = () => {
  const { data, isPending } = authClient.useSession();

  if (!isPending && data?.user?.id) {
    useFcm(data.user.id);
  }

  return null;
};

export default NotificationPermissionHandler;
