"use client";

import {
  useSidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, ChevronsUpDown } from "lucide-react";
import { getUserInitials, toTitleCase } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AdminNavUser = () => {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { data, isPending } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  if (isPending || isSigningOut) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="opacity-50">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-lg" />

              <div className="grid flex-1 text-left text-sm leading-tight">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32 mt-1" />
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage
                  alt={data?.user.name || "Admin"}
                  src={data?.user.image || undefined}
                />
                <AvatarFallback className="rounded-lg">
                  {getUserInitials("Admin", data?.user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {toTitleCase(data?.user.name)}
                </span>
                <span className="truncate text-xs">{data?.user.email}</span>
              </div>

              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={4}
            side={isMobile ? "bottom" : "right"}
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage
                    src={data?.user.image || undefined}
                    alt={toTitleCase(data?.user.name) || "Admin"}
                  />
                  <AvatarFallback className="rounded-lg">
                    {getUserInitials("Admin", data?.user.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {toTitleCase(data?.user.name)}
                  </span>

                  <span className="truncate text-xs">{data?.user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={async () => {
                setIsSigningOut(true);
                toast.loading("Signing Out", {
                  description: "Please wait while we log you out securely.",
                });

                try {
                  await authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        toast.dismiss();
                        toast.success("Signed Out Successfully", {
                          description:
                            "You've been logged out securely. See you next time!",
                        });
                        router.push("/");
                      },
                      onError: () => {
                        toast.dismiss();
                        toast.error("Sign Out Failed", {
                          description:
                            "Unable to log you out right now. Please try again.",
                        });
                        setIsSigningOut(false);
                      },
                    },
                  });
                } catch (error) {
                  toast.dismiss();
                  toast.error("Sign Out Error", {
                    description:
                      "Something unexpected happened while logging out. Please try again.",
                  });
                  setIsSigningOut(false);
                }
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default AdminNavUser;
