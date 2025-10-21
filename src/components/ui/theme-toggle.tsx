"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";

type ThemeToggleProps = {
	duration?: number;
};

export const ThemeToggle = ({ duration = 400 }: ThemeToggleProps) => {
	const { theme, setTheme } = useTheme();
	const buttonRef = useRef<HTMLButtonElement>(null);

	const toggleTheme = useCallback(() => {
		if (!buttonRef.current) return;

		const { top, left, width, height } =
			buttonRef.current.getBoundingClientRect();
		const x = left + width / 2;
		const y = top + height / 2;
		const maxRadius = Math.hypot(
			Math.max(left, window.innerWidth - left),
			Math.max(top, window.innerHeight - top),
		);

		document
			.startViewTransition(() => {
				flushSync(() => {
					setTheme(theme === "dark" ? "light" : "dark");
				});
			})
			.ready.then(() => {
				document.documentElement.animate(
					{
						clipPath: [
							`circle(0px at ${x}px ${y}px)`,
							`circle(${maxRadius}px at ${x}px ${y}px)`,
						],
					},
					{
						duration,
						easing: "ease-in-out",
						pseudoElement: "::view-transition-new(root)",
					},
				);
			});
	}, [theme, setTheme, duration]);

	return (
		<Button ref={buttonRef} size="icon" variant="outline" onClick={toggleTheme}>
			<Sun className="size-[1.15rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon className="absolute size-[1.15rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
};
