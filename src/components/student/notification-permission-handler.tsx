"use client";

import { useFcm } from "@/hooks/use-fcm";
import { authClient } from "@/lib/auth-client";

const NotificationPermissionHandler = () => {
  const { data, isPending } = authClient.useSession();

  const studentId = !isPending && data?.user?.id ? data.user.id : undefined;
  useFcm(studentId);

  return null;
};

export default NotificationPermissionHandler;
