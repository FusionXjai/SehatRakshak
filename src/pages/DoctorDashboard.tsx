import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ensureDoctorProfile } from "@/lib/setupDatabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import AddPatientDialog from "@/components/reception/AddPatientDialog";
import { Activity, Users, Calendar, FileText, LogOut, Plus } from "lucide-react";
import type { Patient } from "@/types/database";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  useEffect(() => {
    fetchDoctorData();
  }, [user]);

  const fetchDoctorData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Ensure doctor profile exists (auto-create if needed)
      const doctorProfileId = await ensureDoctorProfile(user.id);
      
      if (!doctorProfileId) {
        toast({
          title: "Setup Required",
          description: "Please run the database migration in Supabase dashboard. Check console for SQL.",
          variant: "destructive",
        });
        console.error('\n\n=== DATABASE SETUP REQUIRED ===\n');
        console.error('Go to Supabase Dashboard > SQL Editor and run the migration file:');
        console.error('supabase/migrations/20251030150000_doctor_prescription_system.sql');
        console.error('\n===============================\n\n');
        setIsLoading(false);
        return;
      }

      setDoctorId(doctorProfileId);

      // Get assigned patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('assigned_doctor_id', doctorProfileId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (patientsError) throw patientsError;
      setPatients((patientsData || []) as Patient[]);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome, Dr. {user?.email?.split('@')[0]}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                My Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{patients.length}</p>
              <p className="text-sm text-muted-foreground">Assigned patients</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Today's appointments</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Today's prescriptions</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Patients</CardTitle>
              <Button onClick={() => setIsAddPatientOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : patients.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No patients assigned yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MRN</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono text-sm">{patient.mrn}</TableCell>
                      <TableCell className="font-medium">{patient.full_name}</TableCell>
                      <TableCell className="capitalize">{patient.gender}</TableCell>
                      <TableCell>{patient.mobile}</TableCell>
                      <TableCell>
                        {patient.is_discharged ? (
                          <Badge variant="secondary">Discharged</Badge>
                        ) : (
                          <Badge className="bg-secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/doctor/prescription/new/${patient.id}`)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Prescription
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Patient Dialog */}
      <AddPatientDialog 
        open={isAddPatientOpen} 
        onOpenChange={setIsAddPatientOpen}
        autoAssignDoctorId={doctorId || undefined}
        onSuccess={() => {
          setIsAddPatientOpen(false);
          fetchDoctorData();
        }}
      />
    </div>
  );
};

export default DoctorDashboard;
