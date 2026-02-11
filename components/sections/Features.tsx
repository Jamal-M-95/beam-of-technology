'use client';

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, Database, Globe, Lock, Zap, Network } from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "Managed IT Services",
    description: "24/7 monitoring, incident response, patching, and SLA-driven support to keep operations running smoothly.",
  },
  {
    icon: Database,
    title: "Cloud Adoption",
    description: "Cloud strategy, migration, and optimization with secure foundations and cost-efficient design.",
  },
  {
    icon: Globe,
    title: "DevOps Automation",
    description: "CI/CD pipelines, Infrastructure as Code, and automated deployments to ship faster with confidence.",
  },
  {
    icon: Lock,
    title: "Security & Compliance",
    description: "Hardening, access control, and best-practice policies to reduce risk and meet compliance needs.",
  },
  {
    icon: Zap,
    title: "Performance & Observability",
    description: "End-to-end monitoring and tuning to improve reliability, visibility, and user experience.",
  },
  {
    icon: Network,
    title: "Web Development",
    description: "Modern, responsive websites and portals built for speed, scalability, and long-term growth.",
  },
];


export default function Features() {
  return (
    <section id="technology" className="py-24 relative overflow-hidden bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-display font-bold mb-6"
          >
            Core <span className="text-primary">Capabilities</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            BEAM.Of Technology combine strong engineering with practical execution.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-secondary/20 blur-[60px] rounded-full" />
            <img 
              src="/beam-design/ai-feature.png" 
              alt="AI Neural Node" 
              className="relative z-10 w-full rounded-2xl border border-white/10 shadow-2xl glass-panel hover:scale-[1.02] transition-transform duration-500" 
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-3xl font-display font-bold mb-6 text-white">
              Autonomous Intelligence
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Beam.Of Technology goes beyond building software—we engineer dependable digital foundations. From cloud adoption and DevOps automation to managed IT services and modern web platforms, we design solutions that are secure, scalable, and built for real-world operations. The result: faster delivery, smoother performance, and technology that stays strong as your business grows.
            </p>
            <ul className="space-y-4">
  {[
    'IT Managed Services & 24/7 Monitoring',
    'Cloud Strategy, Migration & Optimization',
    'DevOps & CI/CD Automation',
    'Infrastructure as Code (IaC)',
    'Application Modernization',
    'Web & Portal Development',
    'Security & Compliance Best Practices',
    'Performance Monitoring & Observability',
    'Architecture & Technology Consulting',
    'Support, Maintenance & Continuous Improvement',
  ].map((item) => (
    <li key={item} className="flex items-center gap-3 text-gray-300">
      <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
      {item}
    </li>
  ))}
</ul>

          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-panel border-white/5 hover:border-primary/50 transition-all duration-300 group h-full">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h4 className="text-xl font-display font-bold mb-3 text-white group-hover:text-primary transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
