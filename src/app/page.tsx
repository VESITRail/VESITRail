import { Header } from "@/components/layout/header";

const Home = () => {
  return (
    <main>
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to VESITRail</h1>
        <p className="text-lg">
          This is the home page of the VESITRail application. Explore the
          features and functionalities we offer.
        </p>
        <p className="text-lg mt-4">
          Use the navigation menu to access different sections of the
          application. You can also install this app on your device for a better
          experience.
        </p>
        <p className="text-lg mt-4">
          If you have any questions or need assistance, feel free to reach out
          to our support team.
        </p>
      </div>
    </main>
  );
};

export default Home;
