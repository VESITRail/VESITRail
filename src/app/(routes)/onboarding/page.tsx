import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MultiStepForm from "@/components/onboarding/multi-step-form";

const Onboarding = () => {
  return (
    <main>
      <Header />

      <div className="py-12 px-4 md:px-8">
        <MultiStepForm />
      </div>

      <Footer />
    </main>
  );
};

export default Onboarding;
