'use client';

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Cloud, Code, Shield, Zap, Network } from "lucide-react";

const services = [
  {
    icon: Brain,
    title: "IT Managed Services",
    description: "Proactive monitoring, support, and maintenance to keep your systems secure and running smoothly—24/7",
  },
  {
    icon: Cloud,
    title: "Cloud Adoption",
    description: "Plan, migrate, and optimize your cloud journey with the right architecture, security, and cost control.",
  },
  {
    icon: Code,
    title: "Software Development",
    description: "Full-stack development with cutting-edge technologies and frameworks.",
  },
  {
    icon: Shield,
    title: "DevOps",
    description: "Automate builds, deployments, and infrastructure to ship faster with reliable CI/CD and scalable environments.",
  },
  {
    icon: Zap,
    title: "Technology Consultancy",
    description: "Clear technical direction that turns business needs into practical roadmaps, smarter decisions, and measurable results.",
  },
  {
    icon: Network,
    title: "Web Development",
    description: "Modern, responsive websites and web apps built for performance, usability, and easy future growth.",
  },
];

export default function ServicesPage() {
  return (
    <section className="pt-32 pb-24 px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-8">
            Our <span className="text-primary">Services</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Comprehensive technology solutions designed to accelerate your digital transformation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
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
                    <service.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3 text-white group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {service.description}
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
