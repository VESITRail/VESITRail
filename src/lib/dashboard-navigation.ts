export const shouldResetDashboardPage = (pathname: string, href: string, resetOnReselect = false): boolean =>
	resetOnReselect && (pathname === href || pathname === `${href}/`);
