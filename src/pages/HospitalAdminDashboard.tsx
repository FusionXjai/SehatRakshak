import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import emailjs from '@emailjs/browser';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  Building2, Users, UserCog, LogOut, Stethoscope, MessageSquare,
  BarChart3, Settings, Activity, Bell, Plus, FileText, Clock,
  CheckCircle2, TrendingUp, Pill, Brain, Shield, Mail, CreditCard,
  AlertTriangle, Home, UsersRound, Briefcase
} from "lucide-react";

const HospitalAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [activeSection, setActiveSection] = useState("dashboard");
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalData, setHospitalData] = useState<any>(null);
  const [showAddDoctorDialog, setShowAddDoctorDialog] = useState(false);
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    totalPrescriptions: 0,
    remindersSent: 0,
    missedDoses: 0,
    criticalAlerts: 0,
  });

  const [doctorForm, setDoctorForm] = useState({
    name: "",
    email: "",
    specialization: "",
    phone: "",
  });

  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    role: "receptionist",
    phone: "",
  });

  useEffect(() => {
    fetchHospitalContext();
  }, [user]);

  useEffect(() => {
    if (hospitalId) {
      fetchDashboardStats();
    }
  }, [hospitalId]);

  const fetchHospitalContext = async () => {
    try {
      if (!user?.id) return;
      
      const { data: hospitalData, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('admin_id', user.id)
        .single();

      if (error) throw error;
      
      setHospitalId(hospitalData.id);
      setHospitalData(hospitalData);
    } catch (error) {
      console.error('Error fetching hospital context:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('id', { count: 'exact' })
        .eq('hospital_id', hospitalId);

      setStats({
        totalDoctors: 0,
        totalPatients: patientsCount || 0,
        totalPrescriptions: 0,
        remindersSent: 0,
        missedDoses: 0,
        criticalAlerts: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleAddDoctor = async () => {
    if (!doctorForm.name || !doctorForm.email || !doctorForm.specialization) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const password = generatePassword();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: doctorForm.email,
        password: password,
        options: {
          data: {
            full_name: doctorForm.name,
            email: doctorForm.email,
            role: 'doctor',
            mobile: doctorForm.phone
          }
        }
      });

      if (authError) throw authError;

      toast({
        title: "Doctor Added Successfully!",
        description: `Credentials sent to ${doctorForm.email}`,
      });

      setDoctorForm({ name: "", email: "", specialization: "", phone: "" });
      setShowAddDoctorDialog(false);
      fetchDashboardStats();
    } catch (error: any) {
      toast({
        title: "Failed to Add Doctor",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "doctors", label: "Doctors", icon: Stethoscope },
    { id: "staff", label: "Staff", icon: UsersRound },
    { id: "patients", label: "Patients", icon: Users },
    { id: "prescriptions", label: "Prescriptions", icon: Pill },
    { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "ai-assistant", label: "AI Assistant", icon: Brain },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "feedback", label: "Feedback", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Left Sidebar */}
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-sm">{hospitalData?.name || 'Hospital'}</h2>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>{user?.email}</span>
            </div>
            <Button variant="outline" onClick={handleLogout} className="w-full gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-xl font-bold">
              {menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
            </h1>
          </header>

          <main className="p-6">
            {/* Dashboard Section */}
            {activeSection === "dashboard" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700">
                        <Stethoscope className="w-4 h-4" />
                        Doctors Registered
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-900">{stats.totalDoctors}</div>
                      <p className="text-xs text-blue-600 mt-1">Active doctors</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700">
                        <Users className="w-4 h-4" />
                        Active Patients
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-900">{stats.totalPatients}</div>
                      <p className="text-xs text-green-600 mt-1">Registered patients</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700">
                        <Pill className="w-4 h-4" />
                        Prescriptions Issued
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-900">{stats.totalPrescriptions}</div>
                      <p className="text-xs text-purple-600 mt-1">Total active</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-cyan-700">
                        <Bell className="w-4 h-4" />
                        Reminders Sent Today
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-cyan-900">{stats.remindersSent}</div>
                      <p className="text-xs text-cyan-600 mt-1">WhatsApp messages</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-4 h-4" />
                        Missed Doses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-900">{stats.missedDoses}%</div>
                      <p className="text-xs text-red-600 mt-1">Adherence score</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700">
                        <Activity className="w-4 h-4" />
                        Critical Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-900">{stats.criticalAlerts}</div>
                      <p className="text-xs text-orange-600 mt-1">Patients &gt;2 missed doses</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Placeholder */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Adherence Trend</CardTitle>
                      <CardDescription>Daily adherence rate over time</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                      Chart coming soon
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Most Prescribed Medicines</CardTitle>
                      <CardDescription>Top medications by volume</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                      Chart coming soon
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Doctors Section */}
            {activeSection === "doctors" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Doctor Management</h2>
                    <p className="text-muted-foreground">Manage hospital doctors</p>
                  </div>
                  <Button onClick={() => setShowAddDoctorDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Doctor
                  </Button>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12 text-muted-foreground">
                      <Stethoscope className="w-16 h-16 mx-auto opacity-20 mb-4" />
                      <p>No doctors registered yet</p>
                      <p className="text-sm mt-2">Click "Add Doctor" to get started</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Other sections placeholder */}
            {activeSection !== "dashboard" && activeSection !== "doctors" && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto opacity-20 mb-4" />
                    <p className="text-xl font-semibold mb-2">
                      {menuItems.find(item => item.id === activeSection)?.label}
                    </p>
                    <p>This feature is coming soon</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </SidebarInset>
      </div>

      {/* Add Doctor Dialog */}
      <Dialog open={showAddDoctorDialog} onOpenChange={setShowAddDoctorDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Add New Doctor
            </DialogTitle>
            <DialogDescription>
              Register a new doctor. Login credentials will be sent via email.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doctorName">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  id="doctorName"
                  placeholder="Dr. John Doe"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctorEmail">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="doctorEmail"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization <span className="text-red-500">*</span></Label>
                <Input
                  id="specialization"
                  placeholder="Cardiology"
                  value={doctorForm.specialization}
                  onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctorPhone">Phone</Label>
                <Input
                  id="doctorPhone"
                  placeholder="+91 XXXXXXXXXX"
                  value={doctorForm.phone}
                  onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDoctorDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAddDoctor} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Doctor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default HospitalAdminDashboard;
