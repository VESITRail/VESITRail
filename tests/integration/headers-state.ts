let activeHeaders = new Headers();

export function setTestHeaders(headers: Headers) {
	activeHeaders = headers;
}

export function clearTestHeaders() {
	activeHeaders = new Headers();
}

export function getActiveHeaders(): Headers {
	return activeHeaders;
}
