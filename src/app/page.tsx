import Hero from "@/components/layout/hero";
import Guide from "@/components/layout/guide";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Contact from "@/components/layout/contact";
import ScrollToTop from "@/components/utils/scroll-to-top";
import Contributors from "@/components/layout/contributors";
import FloatingGithubButton from "@/components/utils/floating-github-button";

const Home = () => {
	return (
		<main>
			<Header />
			<Hero />
			<Guide />
			<Contributors />
			<Contact />
			<Footer />
			<FloatingGithubButton />
			<ScrollToTop />
		</main>
	);
};

export default Home;
