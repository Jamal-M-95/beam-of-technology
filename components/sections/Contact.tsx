'use client';

import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ✅ Static list (no packages, no dynamic imports)
type CountryOption = { value: string; label: string; dialCode: string };

const COUNTRIES: CountryOption[] = [
  // GCC / MENA
  { value: "SA", label: "Saudi Arabia (+966)", dialCode: "+966" },
  { value: "AE", label: "United Arab Emirates (+971)", dialCode: "+971" },
  { value: "KW", label: "Kuwait (+965)", dialCode: "+965" },
  { value: "BH", label: "Bahrain (+973)", dialCode: "+973" },
  { value: "OM", label: "Oman (+968)", dialCode: "+968" },
  { value: "QA", label: "Qatar (+974)", dialCode: "+974" },
  { value: "JO", label: "Jordan (+962)", dialCode: "+962" },
  { value: "EG", label: "Egypt (+20)", dialCode: "+20" },
  { value: "LB", label: "Lebanon (+961)", dialCode: "+961" },
  { value: "IQ", label: "Iraq (+964)", dialCode: "+964" },
  { value: "SY", label: "Syria (+963)", dialCode: "+963" },
  { value: "PS", label: "Palestine (+970)", dialCode: "+970" },
  { value: "YE", label: "Yemen (+967)", dialCode: "+967" },
  { value: "LY", label: "Libya (+218)", dialCode: "+218" },
  { value: "TN", label: "Tunisia (+216)", dialCode: "+216" },
  { value: "DZ", label: "Algeria (+213)", dialCode: "+213" },
  { value: "MA", label: "Morocco (+212)", dialCode: "+212" },
  { value: "SD", label: "Sudan (+249)", dialCode: "+249" },

  // Europe
  { value: "GB", label: "United Kingdom (+44)", dialCode: "+44" },
  { value: "IE", label: "Ireland (+353)", dialCode: "+353" },
  { value: "FR", label: "France (+33)", dialCode: "+33" },
  { value: "DE", label: "Germany (+49)", dialCode: "+49" },
  { value: "IT", label: "Italy (+39)", dialCode: "+39" },
  { value: "ES", label: "Spain (+34)", dialCode: "+34" },
  { value: "PT", label: "Portugal (+351)", dialCode: "+351" },
  { value: "NL", label: "Netherlands (+31)", dialCode: "+31" },
  { value: "BE", label: "Belgium (+32)", dialCode: "+32" },
  { value: "CH", label: "Switzerland (+41)", dialCode: "+41" },
  { value: "AT", label: "Austria (+43)", dialCode: "+43" },
  { value: "SE", label: "Sweden (+46)", dialCode: "+46" },
  { value: "NO", label: "Norway (+47)", dialCode: "+47" },
  { value: "DK", label: "Denmark (+45)", dialCode: "+45" },
  { value: "FI", label: "Finland (+358)", dialCode: "+358" },
  { value: "PL", label: "Poland (+48)", dialCode: "+48" },
  { value: "CZ", label: "Czechia (+420)", dialCode: "+420" },
  { value: "SK", label: "Slovakia (+421)", dialCode: "+421" },
  { value: "HU", label: "Hungary (+36)", dialCode: "+36" },
  { value: "RO", label: "Romania (+40)", dialCode: "+40" },
  { value: "BG", label: "Bulgaria (+359)", dialCode: "+359" },
  { value: "GR", label: "Greece (+30)", dialCode: "+30" },
  { value: "TR", label: "Türkiye (+90)", dialCode: "+90" },
  { value: "UA", label: "Ukraine (+380)", dialCode: "+380" },
  { value: "RU", label: "Russia (+7)", dialCode: "+7" },

  // Americas
  { value: "US", label: "United States (+1)", dialCode: "+1" },
  { value: "CA", label: "Canada (+1)", dialCode: "+1" },
  { value: "MX", label: "Mexico (+52)", dialCode: "+52" },
  { value: "BR", label: "Brazil (+55)", dialCode: "+55" },
  { value: "AR", label: "Argentina (+54)", dialCode: "+54" },
  { value: "CL", label: "Chile (+56)", dialCode: "+56" },
  { value: "CO", label: "Colombia (+57)", dialCode: "+57" },
  { value: "PE", label: "Peru (+51)", dialCode: "+51" },

  // Asia
  { value: "IN", label: "India (+91)", dialCode: "+91" },
  { value: "PK", label: "Pakistan (+92)", dialCode: "+92" },
  { value: "BD", label: "Bangladesh (+880)", dialCode: "+880" },
  { value: "LK", label: "Sri Lanka (+94)", dialCode: "+94" },
  { value: "NP", label: "Nepal (+977)", dialCode: "+977" },
  { value: "CN", label: "China (+86)", dialCode: "+86" },
  { value: "HK", label: "Hong Kong (+852)", dialCode: "+852" },
  { value: "TW", label: "Taiwan (+886)", dialCode: "+886" },
  { value: "JP", label: "Japan (+81)", dialCode: "+81" },
  { value: "KR", label: "South Korea (+82)", dialCode: "+82" },
  { value: "SG", label: "Singapore (+65)", dialCode: "+65" },
  { value: "MY", label: "Malaysia (+60)", dialCode: "+60" },
  { value: "TH", label: "Thailand (+66)", dialCode: "+66" },
  { value: "VN", label: "Vietnam (+84)", dialCode: "+84" },
  { value: "PH", label: "Philippines (+63)", dialCode: "+63" },
  { value: "ID", label: "Indonesia (+62)", dialCode: "+62" },

  // Africa (major)
  { value: "NG", label: "Nigeria (+234)", dialCode: "+234" },
  { value: "KE", label: "Kenya (+254)", dialCode: "+254" },
  { value: "ET", label: "Ethiopia (+251)", dialCode: "+251" },
  { value: "GH", label: "Ghana (+233)", dialCode: "+233" },
  { value: "ZA", label: "South Africa (+27)", dialCode: "+27" },

  // Oceania
  { value: "AU", label: "Australia (+61)", dialCode: "+61" },
  { value: "NZ", label: "New Zealand (+64)", dialCode: "+64" },
];

const DIAL_CODE_BY_ISO = Object.fromEntries(
  COUNTRIES.map((c) => [c.value, c.dialCode])
) as Record<string, string>;

const localPhoneRegex = /^[0-9()\-\s.]{5,20}$/;

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  company: z.string().min(2, "Company name is required"),
  country: z.string().min(2, "Country is required"),
  phone: z
    .string()
    .min(5, "Phone number is required")
    .max(20, "Phone number is too long")
    .regex(localPhoneRegex, "Invalid phone number"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function Contact() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      country: "SA",
      phone: "",
      email: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const dial = DIAL_CODE_BY_ISO[values.country] || "+966";

    const payload = {
      ...values,
      phone: `${dial} ${values.phone}`.trim(),
    };

    delete (payload as any).country;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "send_failed");

      toast({
        title: "Message Sent",
        description: "We have received your message. We'll get back to you soon.",
      });

      form.reset({
        name: "",
        company: "",
        country: "SA",
        phone: "",
        email: "",
        message: "",
      });
    } catch (err: any) {
      console.error("[contact] send failed", err);
      toast({
        title: "Failed to send",
        description:
          "We couldn't send your message right now. Please try again or email us directly.",
        variant: "destructive",
      });
    }
  }

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Initiate <span className="text-primary">Contact</span>
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              Ready to build something reliable and scalable? Fill out the form and we’ll reach out to schedule a consultation.
            </p>

            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-xl border-l-4 border-primary">
                <h3 className="text-xl font-bold mb-2">Technical Support</h3>
                <p className="text-gray-400">support@beam.tech</p>
              </div>
              <div className="glass-panel p-6 rounded-xl border-l-4 border-secondary">
                <h3 className="text-xl font-bold mb-2">Enterprise Sales</h3>
                <p className="text-gray-400">sales@beam.tech</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="glass-panel border-white/10">
              <CardContent className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John Doe"
                              {...field}
                              className="bg-black/20 border-white/10 focus:border-primary/50 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

<div className="grid grid-cols-1 md:grid-cols-12 gap-6">
  {/* Company */}
  <FormField
    control={form.control}
    name="company"
    render={({ field }) => (
      <FormItem className="md:col-span-4">
        <FormLabel className="text-gray-300">Company Name</FormLabel>
        <FormControl>
          <Input
            placeholder="Beam.Of Technology"
            {...field}
            className="bg-black/20 border-white/10 focus:border-primary/50 text-white"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />

  {/* Country */}
  <FormField
    control={form.control}
    name="country"
    render={({ field }) => (
      <FormItem className="md:col-span-4">
        <FormLabel className="text-gray-300">Phone Number</FormLabel>
        <Select value={field.value} onValueChange={field.onChange}>
          <FormControl>
            <SelectTrigger className="bg-black/20 border-white/10 focus:border-primary/50 text-white">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
          </FormControl>
          <SelectContent className="max-h-[320px] overflow-y-auto">
            {COUNTRIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />

  {/* Phone */}
  <FormField
    control={form.control}
    name="phone"
    render={({ field }) => (
      <FormItem className="md:col-span-4">
        <FormLabel className="text-gray-300 opacity-0 select-none">
          Phone
        </FormLabel>
        <FormControl>
          <Input
            placeholder="5X XXX XXXX"
            {...field}
            inputMode="tel"
            className="bg-black/20 border-white/10 focus:border-primary/50 text-white"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>


                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="john@example.com"
                              {...field}
                              className="bg-black/20 border-white/10 focus:border-primary/50 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about your project..."
                              className="min-h-[120px] bg-black/20 border-white/10 focus:border-primary/50 text-white"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-primary text-background hover:bg-primary/90 font-bold"
                    >
                      Transmit Message
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
