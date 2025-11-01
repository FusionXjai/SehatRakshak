    "use client";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      <Navigation />

      {/* ===== Hero Section ===== */}
      <section className="text-center py-20 px-6 bg-gradient-to-r from-primary/5 to-secondary/5">
        <motion.h1
          className="text-4xl md:text-6xl font-bold mb-4"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Get in Touch with <span className="text-primary">SehatRakshak</span>
        </motion.h1>
        <motion.p
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Have a question, feedback, or partnership idea?  
          We’d love to connect and make healthcare smarter together.
        </motion.p>
      </section>

      {/* ===== Contact Info Cards ===== */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Mail,
              title: "Email",
              info: "support@sehatrakshak.com",
              desc: "Drop us an email anytime — we respond within 24 hours.",
            },
            {
              icon: Phone,
              title: "Phone",
              info: "+91 98765 43210",
              desc: "Available from 9 AM to 7 PM IST, Monday to Saturday.",
            },
            {
              icon: MapPin,
              title: "Location",
              info: "Lucknow, Uttar Pradesh, India",
              desc: "Visit our head office or connect virtually.",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="bg-card border border-border/50 shadow-md rounded-3xl p-8 text-center hover:shadow-xl transition"
            >
              <div className="w-14 h-14 flex items-center justify-center bg-primary/10 text-primary rounded-full mx-auto mb-4">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground mb-1">{item.desc}</p>
              <p className="font-medium">{item.info}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== Contact Form ===== */}
      <section className="bg-muted/10 py-20 px-6">
        <div className="max-w-5xl mx-auto bg-card border border-border/50 shadow-lg rounded-3xl p-8 md:p-12">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Send Us a Message
          </motion.h2>

          <form className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-sm font-medium">Full Name</label>
              <input
                type="text"
                placeholder="Your Name"
                className="w-full p-3 rounded-xl border border-border/50 focus:ring-2 focus:ring-primary outline-none bg-background"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full p-3 rounded-xl border border-border/50 focus:ring-2 focus:ring-primary outline-none bg-background"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Phone</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                className="w-full p-3 rounded-xl border border-border/50 focus:ring-2 focus:ring-primary outline-none bg-background"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium">Message</label>
              <textarea
                rows={4}
                placeholder="Write your message here..."
                className="w-full p-3 rounded-xl border border-border/50 focus:ring-2 focus:ring-primary outline-none resize-none bg-background"
              ></textarea>
            </div>

            <div className="md:col-span-2 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-primary/90 transition"
              >
                <Send className="w-5 h-5" />
                Send Message
              </motion.button>
            </div>
          </form>
        </div>
      </section>

      {/* ===== Map & Chat Section ===== */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          {/* Live Chat Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-card border border-border/50 rounded-3xl shadow-md p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold">Live Chat Support</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Need help right now? Connect with our AI-powered assistant for instant responses about appointments or features.
            </p>
            <button className="bg-secondary text-white px-6 py-3 rounded-full font-semibold hover:bg-secondary/90 transition">
              Start Chat
            </button>
          </motion.div>

          {/* Map */}
          <div className="rounded-3xl overflow-hidden shadow-lg border border-border/40">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3559.875501660247!2d80.94616657523532!3d26.848902476677336!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399be2d4e1a2fd27%3A0x84d54f7768d77b14!2sLucknow%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1693327812345!5m2!1sen!2sin"
              width="100%"
              height="380"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}