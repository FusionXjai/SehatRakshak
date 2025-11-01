import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Download, Upload, Users, UserPlus, Filter, Calendar, Send, Bell, LogOut } from "lucide-react";
import PatientTable from "@/components/reception/PatientTable";
import AddPatientDialog from "@/components/reception/AddPatientDialog";
import type { Patient } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";

const Reception = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "discharged">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [appointmentsToday, setAppointmentsToday] = useState(0);
  const [dischargesToday, setDischargesToday] = useState(0);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchQuery, statusFilter, patients]);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients((data || []) as Patient[]);
    } catch (error: any) {
      toast({
        title: "Error fetching patients",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    // Filter by status
    if (statusFilter === "active") {
      filtered = filtered.filter(p => !p.is_discharged && p.is_active);
    } else if (statusFilter === "discharged") {
      filtered = filtered.filter(p => p.is_discharged);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(patient =>
        patient.full_name.toLowerCase().includes(query) ||
        patient.mrn.toLowerCase().includes(query) ||
        patient.mobile.includes(query) ||
        patient.qr_code_id.toLowerCase().includes(query) ||
        patient.email?.toLowerCase().includes(query)
      );
    }

    setFilteredPatients(filtered);
  };

  const exportToCSV = () => {
    try {
      const headers = ['MRN', 'Name', 'Gender', 'DOB', 'Mobile', 'Email', 'Discharge Status'];
      const rows = filteredPatients.map(p => [
        p.mrn,
        p.full_name,
        p.gender,
        p.date_of_birth,
        p.mobile,
        p.email || '',
        p.is_discharged ? 'Discharged' : 'Active'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patients-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();

      toast({
        title: "Export successful",
        description: `Exported ${filteredPatients.length} patient records`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

      // Skip header row
      const dataLines = lines.slice(1).filter(line => line.trim());

      let successCount = 0;
      let errorCount = 0;

      for (const line of dataLines) {
        try {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          
          // Map CSV columns to patient data
          const patientData = {
            full_name: values[1] || '', // Name
            gender: (values[2] || 'other').toLowerCase() as 'male' | 'female' | 'other',
            date_of_birth: values[3] || new Date().toISOString().split('T')[0],
            mobile: values[4] || '',
            email: values[5] || null,
            created_by: user.id,
            mrn: '', // Will be auto-generated
            qr_code_id: '', // Will be auto-generated
          };

          const { error } = await supabase.from('patients').insert(patientData);
          
          if (error) {
            console.error('Error importing row:', error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (rowError) {
          console.error('Error processing row:', rowError);
          errorCount++;
        }
      }

      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} patients. ${errorCount > 0 ? `${errorCount} errors.` : ''}`,
      });

      fetchPatients();
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const sendWhatsAppConfirmation = (patient: Patient) => {
    const message = `Hello ${patient.full_name},

Your appointment has been confirmed.

MRN: ${patient.mrn}
Date: ${new Date().toLocaleDateString()}

Thank you,
Sehat Rakshak Team`;
    const whatsappUrl = `https://wa.me/${patient.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp Opened",
      description: "Send confirmation message to patient",
    });
  };

  const sendManualReminder = (patient: Patient) => {
    const message = `Hello ${patient.full_name},

This is a reminder about your medication schedule.

Please ensure you take your medicines on time.

For any queries, contact us.

Sehat Rakshak Team`;
    const whatsappUrl = `https://wa.me/${patient.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Reminder Sent",
      description: `Reminder sent to ${patient.full_name}`,
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Reception Dashboard</h1>
                <p className="text-sm text-muted-foreground">Patient Management</p>
              </div>
            </div>
            <Button variant="ghost" onClick={async () => {
              await signOut();
              navigate('/');
            }}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{patients.filter(p => !p.is_discharged).length}</p>
              </div>
              <UserPlus className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Appointments Today</p>
                <p className="text-2xl font-bold">{appointmentsToday}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Discharges Today</p>
                <p className="text-2xl font-bold">{dischargesToday}</p>
              </div>
              <Download className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Today</p>
                <p className="text-2xl font-bold">
                  {patients.filter(p => 
                    new Date(p.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <Plus className="w-8 h-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* Actions Bar */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full md:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, MRN, mobile, QR code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Patients</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="discharged">Discharged</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => document.getElementById('csv-upload')?.click()} disabled={isImporting}>
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import CSV'}
                </Button>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Patient
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Patients Table */}
        <PatientTable
          patients={filteredPatients}
          isLoading={isLoading}
          onRefresh={fetchPatients}
          onWhatsAppClick={sendWhatsAppConfirmation}
          onReminderClick={sendManualReminder}
        />
      </div>

      {/* Add Patient Dialog */}
      <AddPatientDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          fetchPatients();
          setIsAddDialogOpen(false);
        }}
      />
    </div>
  );
};

export default Reception;
