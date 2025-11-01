import React from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { HeartPulse, Brain, ShieldCheck, Users } from "lucide-react";

const About: React.FC = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.6 },
    }),
  };

  const features = [
    "AI-powered Health Assistant with multilingual chat (Hindi & English)",
    "Smart Medicine Reminders via WhatsApp & IVR",
    "Digital Prescription System with PDF export & QR scan",
    "Secure Patient Records (HIPAA / GDPR ready)",
    "Real-time Analytics Dashboard for hospitals",
    "Automated Alerts for missed medicines",
  ];

  const values = [
    {
      icon: <Brain className="text-sky-600 w-7 h-7" />,
      title: "Innovation in Healthcare",
      text: "SehatRakshak integrates AI, automation, and secure cloud systems to create a connected care ecosystem that redefines hospital management and patient recovery.",
    },
    {
      icon: <HeartPulse className="text-sky-600 w-7 h-7" />,
      title: "Patient-Centered Care",
      text: "Our mission is to make healthcare more humane, accessible, and personalized — ensuring every patient feels supported even outside hospital walls.",
    },
    {
      icon: <ShieldCheck className="text-sky-600 w-7 h-7" />,
      title: "Data Privacy First",
      text: "All interactions are encrypted with industry-grade security, maintaining compliance with HIPAA and GDPR for total trust and transparency.",
    },
    {
      icon: <Users className="text-sky-600 w-7 h-7" />,
      title: "Seamless Collaboration",
      text: "Bridging doctors, receptionists, care managers, and patients through one unified platform, making communication effortless and efficient.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-100 to-white flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="relative text-center py-16 px-6 md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold text-blue-700 mb-4">
            About <span className="text-sky-500">SehatRakshak</span>
          </h1>
          <p className="text-gray-700 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
            Revolutionizing digital healthcare through <strong>AI-driven innovation</strong>, 
            secure data systems, and patient-first technology — bringing care closer than ever before.
          </p>
        </motion.div>
      </section>

      {/* About Overview Card */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-8 md:p-12 mb-16 border border-gray-200"
      >
        <p className="text-gray-700 text-base md:text-lg leading-relaxed text-justify">
          <strong>SehatRakshak</strong> is a next-generation healthcare companion designed to 
          empower hospitals, doctors, and patients with intelligent, secure, and automated tools 
          for continuous care. From <strong>AI health assistants</strong> to <strong>smart medicine 
          reminders</strong>, SehatRakshak ensures treatment adherence becomes effortless, effective, 
          and accessible for everyone — from metros to rural clinics.
        </p>
      </motion.section>

      {/* Features Section */}
      <section className="px-6 md:px-16 mb-16">
        <h2 className="text-3xl font-bold text-blue-800 text-center mb-10">
          💡 Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={i}
              className="bg-white/80 backdrop-blur-md border border-sky-100 p-6 rounded-2xl shadow hover:shadow-lg transition transform hover:-translate-y-1"
            >
              <p className="text-gray-700 text-base font-medium leading-relaxed">
                {item}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Core Values Section */}
      <section className="bg-gradient-to-br from-white via-sky-50 to-blue-100 py-16 px-6 md:px-16">
        <h2 className="text-3xl font-bold text-blue-800 text-center mb-12">
          🌟 Our Core Values
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {values.map((val, i) => (
            <motion.div
              key={i}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={i}
              className="flex flex-col items-center md:items-start bg-white/80 border border-gray-200 rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
            >
              <div className="mb-3">{val.icon}</div>
              <h3 className="text-xl font-semibold text-blue-700 mb-2">
                {val.title}
              </h3>
              <p className="text-gray-600 text-base leading-relaxed">{val.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 px-6 md:px-16 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold text-blue-800 mb-4">
            🚀 Vision for the Future
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            Our vision is to become India’s most trusted digital healthcare ecosystem — 
            integrating <strong>AI, IoT, and data analytics</strong> to enable predictive care, 
            faster recoveries, and smarter hospital operations that reach every corner of the nation.
          </p>
        </motion.div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-6 md:px-16 bg-gradient-to-t from-blue-50 to-white">
        <h2 className="text-3xl font-bold text-blue-800 text-center mb-10">
          👥 Meet Our Team
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {["Dr. Meera Singh", "Abhinav Pandey", "Vivek Yadav", "Akash Vishwakarma"].map(
            (name, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                custom={i}
                className="bg-white/80 border border-sky-100 rounded-2xl p-6 text-center shadow hover:shadow-lg transition hover:-translate-y-1"
              >
                <div className="w-24 h-24 mx-auto bg-sky-200 rounded-full flex items-center justify-center text-3xl mb-3">
                  👤
                </div>
                <h3 className="font-semibold text-blue-700">{name}</h3>
                <p className="text-sm text-gray-500 mt-1">Healthcare Innovator</p>
              </motion.div>
            )
          )}
        </div>
      </section>

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center mt-10 mb-16 px-6"
      >
        <p className="text-sm md:text-base text-gray-600">
          Built with ❤️ by Team{" "}
          <strong className="text-blue-700">SehatRakshak</strong> — Empowering
          care, enhancing recovery, and saving lives.
        </p>
      </motion.div>

      <Footer />
    </div>
  );
};

export default About;