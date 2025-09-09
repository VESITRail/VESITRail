import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon } from "lucide-react";
import CacheManagement from "@/components/settings/cache-management";
import NotificationPreferences from "@/components/settings/notification-preferences";

const Settings = () => {
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-3">
          <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <SettingsIcon className="size-5" />
          </div>

          <h1 className="text-2xl font-semibold">Manage Settings</h1>
        </span>
      </div>

      <Separator className="my-6" />

      <NotificationPreferences />

      <CacheManagement />
    </div>
  );
};

export default Settings;
