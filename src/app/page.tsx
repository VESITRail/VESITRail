import Hero from "@/components/layout/hero";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Contact from "@/components/layout/contact";
import Developers from "@/components/layout/developers";
import ScrollToTop from "@/components/utils/scroll-to-top";

const Home = () => {
  return (
    <main>
      <Header />
      <Hero />
      <Developers />
      <Contact />
      <Footer />
      <ScrollToTop />
    </main>
  );
};

export default Home;
