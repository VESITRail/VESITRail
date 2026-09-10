export const printPDF = (pdfData: Uint8Array | number[]): void => {
	if (typeof window === "undefined" || !pdfData || (Array.isArray(pdfData) && pdfData.length === 0)) {
		console.warn("printPDF: Invalid or empty PDF data provided.");
		return;
	}

	const byteArray = pdfData instanceof Uint8Array ? pdfData : new Uint8Array(pdfData);
	const blob = new Blob([byteArray as BlobPart], { type: "application/pdf" });
	const blobUrl = URL.createObjectURL(blob);

	const iframe = document.createElement("iframe");
	iframe.style.position = "fixed";
	iframe.style.top = "-9999px";
	iframe.style.left = "-9999px";
	iframe.style.width = "1px";
	iframe.style.height = "1px";
	iframe.style.opacity = "0";
	iframe.style.pointerEvents = "none";
	iframe.style.border = "0";
	iframe.setAttribute("aria-hidden", "true");
	iframe.tabIndex = -1;

	let cleanedUp = false;
	const cleanup = () => {
		if (cleanedUp) return;
		cleanedUp = true;
		try {
			iframe.remove();
		} catch (error) {
			console.warn("Failed to detach print iframe:", error);
		} finally {
			URL.revokeObjectURL(blobUrl);
		}
	};

	let hasTriggered = false;
	const triggerPrint = () => {
		if (hasTriggered) return;
		hasTriggered = true;

		try {
			const targetWindow = iframe.contentWindow;
			if (!targetWindow) {
				throw new Error("Iframe contentWindow is inaccessible");
			}

			targetWindow.focus();
			targetWindow.addEventListener("afterprint", cleanup, { once: true });
			window.addEventListener("afterprint", cleanup, { once: true });

			targetWindow.print();
		} catch (err) {
			console.warn("Direct iframe print failed, falling back to new window:", err);
			const fallbackWin = window.open(blobUrl, "_blank", "noopener,noreferrer");
			if (fallbackWin) {
				fallbackWin.focus();
			}
			setTimeout(cleanup, 60_000);
		}
	};

	iframe.onload = () => {
		setTimeout(triggerPrint, 150);
	};

	document.body.appendChild(iframe);
	iframe.src = blobUrl;

	const fallbackTimeout = setTimeout(triggerPrint, 2000);

	setTimeout(() => {
		clearTimeout(fallbackTimeout);
		cleanup();
	}, 300_000);
};

export const printBase64PDF = (base64DataUrl: string): void => {
	if (typeof window === "undefined" || !base64DataUrl || typeof base64DataUrl !== "string") {
		console.warn("printBase64PDF: Invalid base64 data provided.");
		return;
	}

	try {
		const base64Content = base64DataUrl.includes(",") ? base64DataUrl.split(",")[1] : base64DataUrl;
		const binaryString = window.atob(base64Content.trim());
		const len = binaryString.length;
		const bytes = new Uint8Array(len);

		for (let i = 0; i < len; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}

		printPDF(bytes);
	} catch (error) {
		console.error("printBase64PDF: Failed to decode base64 PDF data", error);
		throw new Error("Unable to parse PDF data for printing.");
	}
};
