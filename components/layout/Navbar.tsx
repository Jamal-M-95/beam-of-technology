'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Contact Us", href: "/contact" },
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "py-4 bg-background/80 backdrop-blur-lg border-b border-white/10" : "py-6 bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
            <Image
  src="/logo.png"
  alt="BEAM.Of Technology"
  width={150}
  height={150}
  priority
  className="
    relative z-10
    h-8 w-8
    object-contain
    scale-[3.0]
    -translate-y-4
    -translate-x-4
    origin-center
  "
/>
          </div>
          <span className="text-xl font-display font-bold tracking-wider text-white">
            BEAM<span className="text-primary">.Of Technology</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href ? "text-primary glow-text" : "text-gray-300 hover:text-white hover:glow-text"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Link href="/get-started">
            <Button
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary-foreground hover:border-primary transition-all duration-300"
            >
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-background/95 backdrop-blur-xl border-l border-white/10">
              <div className="flex flex-col gap-8 mt-10">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-2xl font-display font-medium transition-colors ${
                      pathname === link.href ? "text-primary" : "text-white hover:text-primary"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <Link href="/get-started">
                  <Button className="bg-primary text-background hover:bg-primary/90 w-full">Get Started</Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}
