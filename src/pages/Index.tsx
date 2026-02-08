import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TournamentsSection from "@/components/TournamentsSection";
import GamesSection from "@/components/GamesSection";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <TournamentsSection />
      <GamesSection />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default Index;
