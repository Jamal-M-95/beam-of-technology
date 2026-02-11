'use client';

import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <section className="pt-32 pb-24 px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-8">
            About <span className="text-primary">Us</span>
          </h1>
          <p className="text-xl text-gray-400 mb-12 leading-relaxed">
            We are architects of the Digital Singularity, bridging the gap between biological thought and digital execution.
          </p>

          <div className="grid md:grid-cols-2 gap-8 text-left mt-16">
            <div className="glass-panel p-8 rounded-2xl border-white/10">
              <h3 className="text-2xl font-display font-bold mb-4 text-white">Our Mission</h3>
              <p className="text-gray-400">
                To illuminate the path of progress through ethical and powerful artificial intelligence solutions that empower humanity.
              </p>
            </div>
            <div className="glass-panel p-8 rounded-2xl border-white/10">
              <h3 className="text-2xl font-display font-bold mb-4 text-white">Our Vision</h3>
              <p className="text-gray-400">
                A world where technology and consciousness evolve in harmony, creating a brighter future for all.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
