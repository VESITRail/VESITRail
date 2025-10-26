import Hero from "@/components/layout/hero";
import Guide from "@/components/layout/guide";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Contact from "@/components/layout/contact";
import Developers from "@/components/layout/developers";
import ScrollToTop from "@/components/utils/scroll-to-top";
import FloatingGithubButton from "@/components/utils/floating-github-button";

const Home = () => {
	return (
		<main>
			<Header />
			<Hero />
			<Guide />
			<Developers />
			<Contact />
			<Footer />
			<FloatingGithubButton />
			<ScrollToTop />
		</main>
	);
};

export default Home;
