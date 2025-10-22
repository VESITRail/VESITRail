"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

const ScrollToTop = () => {
	const [visible, setVisible] = useState<boolean>(false);

	useEffect(() => {
		const handleScroll = () => {
			setVisible(window.scrollY > 200);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<button
			onClick={scrollToTop}
			aria-label="Scroll to top"
			style={{ boxShadow: "0 4px 24px 0 rgba(60,60,120,0.15)" }}
			className={`fixed z-50 bottom-28 lg:bottom-8 cursor-pointer right-8 p-2 rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 border-2 border-primary/40 hover:scale-110 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/60 flex items-center justify-center ${
				visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
			}`}
		>
			<ArrowUp size={25} />
		</button>
	);
};

export default ScrollToTop;
