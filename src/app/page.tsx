import Hero from "@/components/layout/hero";
import Header from "@/components/layout/header";
import Contact from "@/components/layout/contact";
import ScrollToTop from "@/components/utils/scroll-to-top";

const Home = () => {
  return (
    <main>
      <Header />
      <Hero />
      <Contact />
      <ScrollToTop />
    </main>
  );
};

export default Home;
