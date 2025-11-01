import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-medical.jpg";

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Healthcare professionals collaborating"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-secondary/80" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <Shield className="w-4 h-4 text-white" />
            <span className="text-sm text-white font-medium">Hospital-Connected Digital Health Assistant</span>
          </div>

          {/* Hindi Tagline */}
          <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-4">
            आपकी सेहत, हमारा वचन
          </h2>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Sehat Rakshak
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Ensuring patients take medicines on time, follow treatment plans, and stay connected to their doctors after discharge
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              variant="hero" 
              size="xl" 
              className="bg-white text-primary hover:bg-white/90 hover:text-primary"
              onClick={() => navigate('/login')}
            >
              Reception Dashboard
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              variant="hero" 
              size="xl" 
              className="bg-transparent border-2 border-white text-white hover:bg-white/10"
              onClick={() => navigate('/features')}
            >
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-white/20">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">95%+</div>
              <div className="text-sm text-white/80">Patient Compliance</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">50K+</div>
              <div className="text-sm text-white/80">Active Patients</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">24/7</div>
              <div className="text-sm text-white/80">AI Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
