import { Metadata } from "next";
import AdminDashboardLayoutContent from "@/components/layout-content/admin-dashboard-layout-content";

export const metadata: Metadata = {
  title: "Admin Dashboard | VESITRail",
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return <AdminDashboardLayoutContent>{children}</AdminDashboardLayoutContent>;
};

export default DashboardLayout;
