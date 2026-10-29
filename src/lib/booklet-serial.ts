const BOOKLET_PAGE_SIZE = 50;
const SERIAL_PATTERN = /^(.*?)(\d+)$/;

export type ParsedSerialNumber = {
	prefix: string;
	startNumber: number;
	digitLength: number;
};

export type SlipRange = {
	minSlip: string;
	maxSlip: string;
	rangeLabel: string;
	placeholder: string;
	maxInputLength: number;
};

export const parseSerialNumber = (serialNumber: string): ParsedSerialNumber | null => {
	const match = serialNumber.match(SERIAL_PATTERN);
	if (!match) return null;

	return {
		prefix: match[1],
		digitLength: match[2].length,
		startNumber: parseInt(match[2], 10)
	};
};

export const deriveCertificateNumber = (serialStartNumber: string, pageOffset: number): string | null => {
	const parsed = parseSerialNumber(serialStartNumber);
	if (!parsed) return null;

	const certificateNumber = parsed.startNumber + pageOffset;
	return `${parsed.prefix}${certificateNumber.toString().padStart(parsed.digitLength, "0")}`;
};

export const getBookletSerialNo = (certificateNo: string): number => {
	const certificateNumber = parseSerialNumber(certificateNo)?.startNumber ?? 0;
	return ((certificateNumber - 1) % BOOKLET_PAGE_SIZE) + 1;
};

export const formatSlipDisplay = (serialStartNumber: string, offset: number): string => {
	const startNumber = parseSerialNumber(serialStartNumber)?.startNumber ?? 0;
	const currentNumber = startNumber + offset;
	const isUnderHundred = startNumber % 100 <= 50 && startNumber % 100 > 0;

	if (currentNumber % 100 === 0) {
		return "100";
	}

	if (isUnderHundred) {
		return (currentNumber % 100).toString().padStart(2, "0");
	}

	return (currentNumber % 100).toString();
};

export const getSlipRange = (serialStartNumber: string, totalPages: number): SlipRange => {
	const minSlip = formatSlipDisplay(serialStartNumber, 0);
	const maxSlip = formatSlipDisplay(serialStartNumber, totalPages - 1);

	return {
		minSlip,
		maxSlip,
		placeholder: "Slip No.",
		rangeLabel: `${minSlip} to ${maxSlip}`,
		maxInputLength: Math.max(minSlip.length, maxSlip.length, 2)
	};
};

export const slipInputToOffset = (input: string, serialStartNumber: string, totalPages: number): number | null => {
	const trimmed = input.trim();
	if (!trimmed) return null;

	const startNumber = parseSerialNumber(serialStartNumber)?.startNumber ?? 0;
	const endNumber = startNumber + totalPages - 1;

	let inputNumber = parseInt(trimmed, 10);
	if (isNaN(inputNumber)) return null;

	if ((trimmed === "00" || trimmed === "0") && endNumber % 100 === 0) {
		inputNumber = 100;
	}

	for (let offset = 0; offset < totalPages; offset++) {
		const slip = formatSlipDisplay(serialStartNumber, offset);
		if (slip === trimmed || parseInt(slip, 10) === inputNumber) {
			return offset;
		}
	}

	return null;
};
