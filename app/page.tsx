import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import AboutSection from "@/components/sections/About";
import ContactSection from "@/components/sections/Contact";

export default function HomePage() {
  return (
    <div>
      <Hero />
      <Features />
      <AboutSection />
      <ContactSection />
    </div>
  );
}
