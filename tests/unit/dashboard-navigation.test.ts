import { describe, expect, it } from "vitest";
import { shouldResetDashboardPage } from "@/lib/dashboard-navigation";

describe("shouldResetDashboardPage", () => {
	it.each(["/dashboard/student", "/dashboard/student/"])("resets an enabled page at %s", (pathname) => {
		expect(shouldResetDashboardPage(pathname, "/dashboard/student", true)).toBe(true);
	});

	it.each(["/dashboard/admin", "/dashboard/admin/booklets/example", ""])(
		"preserves normal navigation from %s to the Booklets page",
		(pathname) => {
			expect(shouldResetDashboardPage(pathname, "/dashboard/admin/booklets", true)).toBe(false);
		}
	);

	it.each([false, undefined])("preserves normal navigation for an opted-out link (%s)", (resetOnReselect) => {
		const pathname = "/dashboard/student/change-address";
		expect(shouldResetDashboardPage(pathname, pathname, resetOnReselect)).toBe(false);
	});
});
