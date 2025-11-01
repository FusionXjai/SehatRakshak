import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import emailjs from '@emailjs/browser';
import {
  Building2, Users, UserCog, BarChart3, LogOut, Shield, MessageSquare,
  CreditCard, Settings, Activity, Bell, TrendingUp, AlertTriangle,
  Brain, Mail, Search, Filter, Plus, FileText, Clock, CheckCircle2,
  XCircle, PieChart, LineChart, DollarSign, Stethoscope, Pill
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddHospitalDialog, setShowAddHospitalDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [hospitalForm, setHospitalForm] = useState({
    name: "",
    address: "",
    contactNumber: "",
    email: "",
    adminName: "",
    adminEmail: "",
    plan: "free"
  });
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    role: "patient" as any,
    hospitalId: ""
  });
  const [stats, setStats] = useState({
    totalHospitals: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalPrescriptions: 0,
    remindersSent: 0,
    aiQueries: 0,
    activeHospitals: 0,
    revenue: 0
  });

  useEffect(() => {
    fetchDashboardStats();
    fetchHospitals();
    fetchUsers();
  }, []);

  const fetchHospitals = async () => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHospitals(data || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const patientsData = await supabase.from('patients').select('id', { count: 'exact' });
      const hospitalsData = await supabase.from('hospitals').select('id, is_active', { count: 'exact' });

      const activeHospitals = hospitalsData.data?.filter((h: any) => h.is_active).length || 0;

      setStats({
        totalHospitals: hospitalsData.count || 0,
        totalDoctors: 0,
        totalPatients: patientsData.count || 0,
        totalPrescriptions: 0,
        remindersSent: 0,
        aiQueries: 0,
        activeHospitals: activeHospitals,
        revenue: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const sendHospitalCredentialsEmail = async (hospitalData: any, credentials: { email: string; password: string }) => {
    try {
      const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
      const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

      if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
        console.warn('EmailJS not configured');
        return false;
      }

      emailjs.init(EMAILJS_PUBLIC_KEY);

      const templateParams = {
        to_email: credentials.email,
        to_name: hospitalData.adminName,
        subject: `Welcome to Sehat Rakshak - Hospital Account Created`,
        message: `Dear ${hospitalData.adminName},

Welcome to Sehat Rakshak! Your hospital "${hospitalData.name}" has been successfully registered on our platform.

Your Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: ${credentials.email}
🔑 Password: ${credentials.password}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hospital Details:
• Hospital Name: ${hospitalData.name}
• Address: ${hospitalData.address}
• Contact: ${hospitalData.contactNumber}
• Subscription Plan: ${hospitalData.plan.toUpperCase()}

You can now login to your hospital admin dashboard at:
${window.location.origin}/login

⚠️ IMPORTANT: Please change your password after first login for security purposes.

Features Available:
✓ Manage doctors and staff
✓ Patient management
✓ Prescription tracking
✓ Medication reminders
✓ AI Assistant integration
✓ Analytics and reports

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
Sehat Rakshak Team
आपकी सेहत, हमारा वचन`
      };

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
      console.log('✅ Hospital credentials email sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send credentials email:', error);
      return false;
    }
  };

  const handleAddHospital = async () => {
    // Validation
    if (!hospitalForm.name || !hospitalForm.email || !hospitalForm.adminName || !hospitalForm.adminEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields (marked with *)",
        variant: "destructive"
      });
      return;
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(hospitalForm.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid hospital email address",
        variant: "destructive"
      });
      return;
    }

    if (!emailRegex.test(hospitalForm.adminEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid admin email address",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate random password for hospital admin
      const adminPassword = generatePassword();

      // 1. Create hospital admin user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: hospitalForm.adminEmail,
        password: adminPassword,
        options: {
          data: {
            full_name: hospitalForm.adminName,
            email: hospitalForm.adminEmail,
            role: 'hospitaladmin',
            mobile: hospitalForm.contactNumber
          }
        }
      });

      if (authError) throw authError;

      // 2. Create hospital record
      const { data: hospitalData, error: hospitalError } = await supabase
        .from('hospitals')
        .insert([
          {
            name: hospitalForm.name,
            address: hospitalForm.address,
            contact_number: hospitalForm.contactNumber,
            email: hospitalForm.email,
            admin_id: authData.user?.id,
            is_active: true
          }
        ])
        .select()
        .single();

      if (hospitalError) throw hospitalError;

      // 3. Send welcome email with credentials
      await sendHospitalCredentialsEmail(
        {
          name: hospitalForm.name,
          address: hospitalForm.address,
          contactNumber: hospitalForm.contactNumber,
          adminName: hospitalForm.adminName,
          plan: hospitalForm.plan
        },
        {
          email: hospitalForm.adminEmail,
          password: adminPassword
        }
      );

      toast({
        title: "Hospital Added Successfully!",
        description: `Welcome email sent to ${hospitalForm.adminEmail}`,
      });

      // Reset form and close dialog
      setHospitalForm({
        name: "",
        address: "",
        contactNumber: "",
        email: "",
        adminName: "",
        adminEmail: "",
        plan: "free"
      });
      setShowAddHospitalDialog(false);
      fetchHospitals();
      fetchDashboardStats();

    } catch (error: any) {
      console.error('Error adding hospital:', error);
      toast({
        title: "Failed to Add Hospital",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUser = async () => {
    // Validation
    if (!userForm.fullName || !userForm.email || !userForm.role) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields (marked with *)",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate random password
      const userPassword = generatePassword();

      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userForm.email,
        password: userPassword,
        options: {
          data: {
            full_name: userForm.fullName,
            email: userForm.email,
            role: userForm.role,
            mobile: userForm.mobile
          }
        }
      });

      if (authError) throw authError;

      let emailSent = false;

      // 2. Send welcome email with credentials
      const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
      const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

      if (EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID) {
        try {
          emailjs.init(EMAILJS_PUBLIC_KEY);

          const templateParams = {
            to_email: userForm.email,
            to_name: userForm.fullName,
            subject: `Welcome to Sehat Rakshak - Account Created`,
            message: `Dear ${userForm.fullName},

Your account has been successfully created on Sehat Rakshak platform.

Your Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: ${userForm.email}
🔑 Password: ${userPassword}
👤 Role: ${userForm.role.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You can now login to your account at:
${window.location.origin}/login

⚠️ IMPORTANT: Please change your password after first login for security purposes.

Best regards,
Sehat Rakshak Team
आपकी सेहत, हमारा वचन`
          };

          await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
          emailSent = true;
          console.log('✅ User credentials email sent successfully');
        } catch (emailError) {
          console.error('❌ Failed to send email:', emailError);
          // Don't fail the user creation if email fails
        }
      }

      toast({
        title: "User Added Successfully!",
        description: emailSent 
          ? `Welcome email sent to ${userForm.email}` 
          : `User created. Email: ${userForm.email}, Password: ${userPassword} (Save this!)`,
      });

      // Reset form and close dialog
      setUserForm({
        fullName: "",
        email: "",
        mobile: "",
        role: "patient",
        hospitalId: ""
      });
      setShowAddUserDialog(false);
      fetchUsers();
      fetchDashboardStats();

    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Failed to Add User",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Super Admin Control Center
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Welcome, {user?.email?.split('@')[0]}
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-7 w-full bg-white p-1 shadow-sm">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="hospitals" className="gap-2">
              <Building2 className="w-4 h-4" />
              Hospitals
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <FileText className="w-4 h-4" />
              Audit
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700">
                    <Building2 className="w-4 h-4" />
                    Total Hospitals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900">{stats.totalHospitals}</div>
                  <p className="text-xs text-blue-600 mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    {stats.activeHospitals} Active
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700">
                    <Stethoscope className="w-4 h-4" />
                    Total Doctors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-900">{stats.totalDoctors}</div>
                  <p className="text-xs text-green-600 mt-1">Across all hospitals</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700">
                    <Users className="w-4 h-4" />
                    Total Patients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-900">{stats.totalPatients}</div>
                  <p className="text-xs text-purple-600 mt-1">Registered users</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700">
                    <Pill className="w-4 h-4" />
                    Prescriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-900">{stats.totalPrescriptions}</div>
                  <p className="text-xs text-orange-600 mt-1">Total issued</p>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-cyan-700">
                    <Bell className="w-4 h-4" />
                    Reminders Sent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-900">{stats.remindersSent}</div>
                  <p className="text-xs text-cyan-600 mt-1">This month</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-violet-700">
                    <Brain className="w-4 h-4" />
                    AI Queries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-violet-900">{stats.aiQueries}</div>
                  <p className="text-xs text-violet-600 mt-1">Total interactions</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    Adherence Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-900">85%</div>
                  <p className="text-xs text-emerald-600 mt-1">Platform average</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700">
                    <DollarSign className="w-4 h-4" />
                    Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">₹{stats.revenue}</div>
                  <p className="text-xs text-amber-600 mt-1">This month</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Platform Growth
                  </CardTitle>
                  <CardDescription>Hospital registrations over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <LineChart className="w-16 h-16 opacity-20" />
                    <p className="ml-4">Chart visualization coming soon</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-500" />
                    Subscription Distribution
                  </CardTitle>
                  <CardDescription>Plan breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Enterprise</span>
                      </div>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Pro</span>
                      </div>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        <span className="text-sm">Free</span>
                      </div>
                      <span className="font-semibold">1</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-500" />
                  Recent Platform Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Clock className="w-4 h-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm">No recent activities to display</p>
                      <p className="text-xs text-muted-foreground mt-1">Activity logs will appear here</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hospitals Tab */}
          <TabsContent value="hospitals" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Hospital Management</h2>
                <p className="text-muted-foreground">Manage all hospitals in the Sehat Rakshak ecosystem</p>
              </div>
              <Button className="gap-2" onClick={() => setShowAddHospitalDialog(true)}>
                <Plus className="w-4 h-4" />
                Add Hospital
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search hospitals..." className="pl-10" />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {hospitals.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="w-16 h-16 mx-auto opacity-20 mb-4" />
                    <p>No hospitals registered yet</p>
                    <p className="text-sm mt-2">Click "Add Hospital" to register the first hospital</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hospitals.map((hospital: any) => (
                  <Card key={hospital.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-blue-500" />
                          <CardTitle className="text-lg">{hospital.name}</CardTitle>
                        </div>
                        <Badge variant={hospital.is_active ? "default" : "secondary"}>
                          {hospital.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">{hospital.address}</p>
                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {hospital.email}
                        </p>
                        <p>{hospital.contact_number}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">User Management</h2>
                <p className="text-muted-foreground">Oversee all platform users</p>
              </div>
              <Button className="gap-2" onClick={() => setShowAddUserDialog(true)}>
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-700">Super Admins</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-900">1</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-indigo-700">Hospital Admins</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-indigo-900">0</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-teal-700">Doctors</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-teal-900">{stats.totalDoctors}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-pink-700">Receptionists</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-pink-900">0</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-16 h-16 mx-auto opacity-20 mb-4" />
                  <p>User management interface coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">WhatsApp Integration</h2>
              <p className="text-muted-foreground">Configure and monitor WhatsApp messaging</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-4 h-4" />
                    Messages Sent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-900">0</p>
                  <p className="text-xs text-green-600 mt-1">This month</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                    <XCircle className="w-4 h-4" />
                    Failed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-900">0</p>
                  <p className="text-xs text-red-600 mt-1">Delivery failures</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                    <Activity className="w-4 h-4" />
                    Delivery Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-900">100%</p>
                  <p className="text-xs text-blue-600 mt-1">Success rate</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Providers</CardTitle>
                <CardDescription>Configure messaging providers for hospitals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mx-auto opacity-20 mb-4" />
                  <p>No WhatsApp integrations configured</p>
                  <p className="text-sm mt-2">Configure Twilio, Gupshup, or 360dialog</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Subscription & Billing</h2>
              <p className="text-muted-foreground">Manage plans and invoices</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Free Plan</CardTitle>
                  <CardDescription>For small clinics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">₹0/mo</div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      1 Doctor
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      50 Patients
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      100 WhatsApp messages
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-500">
                <CardHeader>
                  <Badge className="w-fit mb-2">Popular</Badge>
                  <CardTitle>Pro Plan</CardTitle>
                  <CardDescription>For growing practices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">₹4,999/mo</div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      10 Doctors
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Unlimited Patients
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      5000 WhatsApp messages
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      AI Assistant
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>For hospitals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">Custom</div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Unlimited Doctors
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Unlimited Patients
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Unlimited Messages
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Priority Support
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Audit & Logs</h2>
              <p className="text-muted-foreground">Track all system activities</p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-700">User Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                  <p className="text-xs text-slate-600 mt-1">Last 24h</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-sky-700">API Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-sky-900">0</p>
                  <p className="text-xs text-sky-600 mt-1">Last 24h</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-yellow-700">
                    <AlertTriangle className="w-4 h-4" />
                    Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-yellow-900">0</p>
                  <p className="text-xs text-yellow-600 mt-1">Last 24h</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-lime-50 to-lime-100 border-lime-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-lime-700">Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-lime-900">99.9%</p>
                  <p className="text-xs text-lime-600 mt-1">This month</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Activity Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto opacity-20 mb-4" />
                  <p>No audit logs available</p>
                  <p className="text-sm mt-2">System activities will be logged here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Platform Settings</h2>
              <p className="text-muted-foreground">Configure global platform settings</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Mail className="w-5 h-5" />
                    Email Configuration
                  </CardTitle>
                  <CardDescription>Manage email templates and settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                    Configure Email Templates
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Brain className="w-5 h-5" />
                    AI Configuration
                  </CardTitle>
                  <CardDescription>OpenAI and AI assistant settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                    Manage AI Settings
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-700">
                    <Settings className="w-5 h-5" />
                    Branding
                  </CardTitle>
                  <CardDescription>Customize platform appearance</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-pink-300 text-pink-700 hover:bg-pink-50">
                    Edit Branding
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Shield className="w-5 h-5" />
                    Security
                  </CardTitle>
                  <CardDescription>Security and access control</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                    Security Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Hospital Dialog */}
      <Dialog open={showAddHospitalDialog} onOpenChange={setShowAddHospitalDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Add New Hospital
            </DialogTitle>
            <DialogDescription>
              Register a new hospital and create admin credentials. Welcome email will be sent automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hospitalName" className="flex items-center gap-1">
                  Hospital Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hospitalName"
                  placeholder="e.g., City General Hospital"
                  value={hospitalForm.name}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospitalEmail" className="flex items-center gap-1">
                  Hospital Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hospitalEmail"
                  type="email"
                  placeholder="hospital@example.com"
                  value={hospitalForm.email}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter hospital address"
                value={hospitalForm.address}
                onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                placeholder="+91 XXXXXXXXXX"
                value={hospitalForm.contactNumber}
                onChange={(e) => setHospitalForm({ ...hospitalForm, contactNumber: e.target.value })}
              />
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="font-semibold mb-3">Hospital Admin Details</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName" className="flex items-center gap-1">
                    Admin Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="adminName"
                    placeholder="John Doe"
                    value={hospitalForm.adminName}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, adminName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail" className="flex items-center gap-1">
                    Admin Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@example.com"
                    value={hospitalForm.adminEmail}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, adminEmail: e.target.value })}
                    required
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                🔐 A secure password will be auto-generated and sent to the admin email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Subscription Plan</Label>
              <Select
                value={hospitalForm.plan}
                onValueChange={(value) => setHospitalForm({ ...hospitalForm, plan: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Plan</SelectItem>
                  <SelectItem value="pro">Pro Plan (₹4,999/mo)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (Custom)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddHospitalDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddHospital} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Hospital
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account. Welcome email with credentials will be sent automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userFullName" className="flex items-center gap-1">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="userFullName"
                  placeholder="John Doe"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail" className="flex items-center gap-1">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="userEmail"
                  type="email"
                  placeholder="user@example.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userMobile">Mobile Number</Label>
                <Input
                  id="userMobile"
                  placeholder="+91 XXXXXXXXXX"
                  value={userForm.mobile}
                  onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userRole" className="flex items-center gap-1">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={userForm.role}
                  onValueChange={(value) => setUserForm({ ...userForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="caremanager">Care Manager</SelectItem>
                    <SelectItem value="hospitaladmin">Hospital Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hospitals.length > 0 && (userForm.role === 'doctor' || userForm.role === 'receptionist' || userForm.role === 'hospitaladmin') && (
              <div className="space-y-2">
                <Label htmlFor="userHospital">Assign Hospital</Label>
                <Select
                  value={userForm.hospitalId}
                  onValueChange={(value) => setUserForm({ ...userForm, hospitalId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals.map((hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                🔐 A secure password will be auto-generated and sent to the user's email
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddUserDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
