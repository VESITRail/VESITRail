"use client";

import { useState, useEffect } from "react";

export const useMediaQuery = (query: string): boolean => {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const media = window.matchMedia(query);

		if (media.matches !== matches) {
			setMatches(media.matches);
		}

		const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
		media.addEventListener("change", listener);

		return () => media.removeEventListener("change", listener);
	}, [matches, query]);

	return matches;
};
