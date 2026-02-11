'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function About() {
  const stats = [
    { label: "Monitoring & Support", value: "24/7" },
    { label: "Service Reliability", value: "99.9%" },
    { label: "Incident Response", value: "<1 Day" },
    { label: "Automated Delivery", value: "CI/CD" },
  ];

  return (
    <section id="about" className="py-24 bg-black/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-secondary/10 via-transparent to-transparent opacity-40" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-5xl mx-auto text-center"
        >
          <span className="text-primary text-sm font-bold tracking-widest uppercase mb-4 block">
            About BEAM
          </span>

          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
            We build, run, and evolve <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              modern digital foundations
            </span>
          </h2>

          <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed">
            BEAM.Of Technology helps teams deliver reliable IT operations, accelerate cloud adoption,
            automate delivery with DevOps, and build modern web platforms. From strategy to execution,
            we focus on security, performance, and scalability—so your technology stays strong as you grow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button asChild className="px-8">
              <Link href="/contact">Talk to Us</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="px-8 border-white/15 text-white hover:bg-white/5"
            >
              <Link href="/services">View Services</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-12">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
