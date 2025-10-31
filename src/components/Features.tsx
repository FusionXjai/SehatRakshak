import { Card } from "@/components/ui/card";
import { Bell, FileText, MessageSquare, Activity, Clock, Users } from "lucide-react";
import featureReminders from "@/assets/feature-reminders.png";
import featureDigital from "@/assets/feature-digital.png";
import featureAI from "@/assets/feature-ai.png";

const Features = () => {
  const features = [
    {
      icon: Bell,
      title: "Automated Reminders",
      description: "WhatsApp & IVR medicine reminders ensure patients never miss a dose",
      image: featureReminders,
      color: "bg-primary/10 text-primary",
    },
    {
      icon: FileText,
      title: "Digital Prescriptions",
      description: "Paperless prescriptions with complete medication tracking and history",
      image: featureDigital,
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: MessageSquare,
      title: "AI Health Assistant",
      description: "Multilingual AI support for medicine queries and health guidance",
      image: featureAI,
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Activity,
      title: "Compliance Tracking",
      description: "Real-time monitoring of patient adherence to treatment plans",
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: Clock,
      title: "Follow-up Management",
      description: "Automated appointment reminders and doctor-patient communication",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Users,
      title: "Care Team Coordination",
      description: "Seamless collaboration between doctors, nurses, and care managers",
      color: "bg-secondary/10 text-secondary",
    },
  ];

  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Activity className="w-4 h-4" />
            Core Features
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Complete Patient Care Solution
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From hospital discharge to complete recovery, we ensure continuous care and monitoring
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="p-6 hover:shadow-[var(--shadow-lg)] transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card"
            >
              <div className="space-y-4">
                {/* Icon or Image */}
                {feature.image ? (
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-3/4 h-3/4 object-contain"
                    />
                  </div>
                ) : (
                  <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                )}

                {/* Content */}
                <div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
