"use client";

import { Github } from "lucide-react";
import { useEffect, useState } from "react";

const FloatingGithubButton = () => {
	const [visible, setVisible] = useState<boolean>(false);

	useEffect(() => {
		const handleScroll = () => {
			setVisible(window.scrollY > 200);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const redirectToGithub = () => {
		window.open("https://github.com/VESITRail/VESITRail", "_blank");
	};

	return (
		<button
			onClick={redirectToGithub}
			aria-label="View on GitHub"
			style={{ boxShadow: "0 4px 24px 0 rgba(60,60,120,0.15)" }}
			className={`fixed z-50 bottom-44 lg:bottom-24 cursor-pointer right-8 p-2 rounded-full bg-secondary text-secondary-foreground shadow-lg transition-all duration-300 border-2 border-border hover:scale-110 hover:bg-secondary/90 focus-visible:ring-2 focus-visible:ring-secondary/60 flex items-center justify-center ${
				visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
			}`}
		>
			<Github size={25} />
		</button>
	);
};

export default FloatingGithubButton;
