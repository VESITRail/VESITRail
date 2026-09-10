/**
 * Utility functions for triggering browser print dialogs directly on PDF data
 * using a hidden iframe, avoiding new tab navigation and manual Ctrl+P.
 */

/**
 * Initiates direct browser printing for raw PDF byte data.
 * Creates an offscreen iframe, loads the PDF blob, and calls the native print dialog.
 *
 * @param pdfData - Uint8Array or byte array containing valid PDF data.
 */
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
			if (iframe.parentNode) {
				iframe.parentNode.removeChild(iframe);
			}
		} catch {
			// Ignore DOM cleanup errors
		}
		URL.revokeObjectURL(blobUrl);
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
			// Cleanup blob URL after fallback window had time to read it
			setTimeout(cleanup, 60_000);
		}
	};

	iframe.onload = () => {
		// Small delay to allow PDF viewer plugin to mount inside iframe
		setTimeout(triggerPrint, 150);
	};

	document.body.appendChild(iframe);
	iframe.src = blobUrl;

	// Fallback timeout in case onload does not fire (some browsers/PDF plugins suppress iframe onload)
	const fallbackTimeout = setTimeout(triggerPrint, 2000);

	// Safety cleanup timeout (5 minutes) in case afterprint does not fire
	setTimeout(() => {
		clearTimeout(fallbackTimeout);
		cleanup();
	}, 300_000);
};

/**
 * Initiates direct browser printing for base64 encoded PDF data URLs or raw base64 strings.
 *
 * @param base64DataUrl - Base64 data URL (e.g. "data:application/pdf;base64,...") or raw base64 string.
 */
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
