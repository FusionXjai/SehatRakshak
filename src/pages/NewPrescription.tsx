import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { generatePrescriptionPDF, downloadPDF, getPDFDataURL } from "@/lib/pdfGenerator";
import { sendPrescriptionEmail } from "@/lib/emailService";
import { ArrowLeft, Plus, Trash2, Loader2, Download, Share2, AlertTriangle } from "lucide-react";
import type { Patient, Medication } from "@/types/database";

interface MedicationForm {
  medicine_name: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration_days: number;
  instructions: string;
}

const NewPrescription = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>("");
  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([]);
  const [createdPrescriptionId, setCreatedPrescriptionId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    diagnosis: "",
    notes: "",
    follow_up_date: "",
  });

  const [medications, setMedications] = useState<MedicationForm[]>([{
    medicine_name: "",
    dosage: "",
    frequency: "1-0-1",
    timing: "After Food",
    duration_days: 7,
    instructions: "",
  }]);

  const [pastPrescriptions, setPastPrescriptions] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [patientId, user]);

  const fetchData = async () => {
    if (!user || !patientId) return;

    try {
      setIsFetching(true);

      // Get doctor ID and name
      const { data: doctorData } = await (supabase as any)
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctorData) {
        setDoctorId(doctorData.id);
      }

      // Get doctor name from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setDoctorName(profileData.full_name);
      }

      // Get patient
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      setPatient(patientData as Patient);

      // Get past prescriptions
      const { data: prescriptionsData } = await (supabase as any)
        .from('prescriptions')
        .select(`
          *,
          medications (*)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(5);

      setPastPrescriptions(prescriptionsData || []);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const addMedication = () => {
    setMedications([...medications, {
      medicine_name: "",
      dosage: "",
      frequency: "1-0-1",
      timing: "After Food",
      duration_days: 7,
      instructions: "",
    }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof MedicationForm, value: any) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
    
    // Check for duplicates when medicine name changes
    if (field === 'medicine_name' && value) {
      checkDuplicateMedicines(value, index);
    }
  };

  const checkDuplicateMedicines = async (medicineName: string, currentIndex: number) => {
    if (!patientId || !medicineName.trim()) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get active medications for this patient
      const { data: activeMeds } = await (supabase as any)
        .from('medications')
        .select(`
          medicine_name,
          end_date,
          prescriptions!inner (patient_id)
        `)
        .eq('prescriptions.patient_id', patientId)
        .gte('end_date', today)
        .ilike('medicine_name', `%${medicineName}%`);

      if (activeMeds && activeMeds.length > 0) {
        const warnings = duplicateWarnings.filter(w => !w.includes(medicineName));
        warnings.push(`⚠️ "${medicineName}" is already prescribed and active until ${new Date(activeMeds[0].end_date).toLocaleDateString()}`);
        setDuplicateWarnings(warnings);
      } else {
        // Remove warning if medicine changed
        setDuplicateWarnings(duplicateWarnings.filter(w => !w.includes(medicineName)));
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !patientId) return;

    setIsLoading(true);

    try {
      // Create prescription
      const { data: prescription, error: prescError } = await (supabase as any)
        .from('prescriptions')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          diagnosis: formData.diagnosis,
          notes: formData.notes,
          follow_up_date: formData.follow_up_date || null,
          prescription_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (prescError) throw prescError;

      // Create medications
      const medicationsToInsert = medications.map(med => {
        const start_date = new Date().toISOString().split('T')[0];
        const end_date = new Date(Date.now() + med.duration_days * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];

        return {
          prescription_id: prescription.id,
          medicine_name: med.medicine_name,
          dosage: med.dosage,
          frequency: med.frequency,
          timing: med.timing,
          duration_days: med.duration_days,
          start_date,
          end_date,
          instructions: med.instructions || null,
        };
      });

      const { error: medError } = await (supabase as any)
        .from('medications')
        .insert(medicationsToInsert);

      if (medError) throw medError;

      toast({
        title: "Success",
        description: "Prescription created successfully",
      });

      // Store prescription ID for PDF generation
      setCreatedPrescriptionId(prescription.id);
      setDuplicateWarnings([]);

      // Send prescription email with PDF (non-blocking)
      if (patient.email) {
        // Generate PDF data
        const pdfData = {
          patientName: patient.full_name,
          patientMRN: patient.mrn,
          patientAge: new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear(),
          patientGender: patient.gender,
          patientMobile: patient.mobile,
          doctorName: doctorName,
          diagnosis: formData.diagnosis,
          notes: formData.notes,
          prescriptionDate: new Date().toISOString().split('T')[0],
          followUpDate: formData.follow_up_date,
          medications: medications.map(med => ({
            medicine_name: med.medicine_name,
            dosage: med.dosage,
            frequency: med.frequency,
            timing: med.timing,
            duration_days: med.duration_days,
            instructions: med.instructions,
          })),
        };

        const pdf = generatePrescriptionPDF(pdfData);
        const pdfBase64 = getPDFDataURL(pdf);

        sendPrescriptionEmail(
          {
            full_name: patient.full_name,
            email: patient.email,
            mrn: patient.mrn
          },
          {
            diagnosis: formData.diagnosis,
            medications: medications.map(med => ({
              medicine_name: med.medicine_name,
              dosage: med.dosage,
              frequency: med.frequency,
              timing: med.timing,
              duration_days: med.duration_days
            })),
            prescription_date: new Date().toISOString(),
            notes: formData.notes
          },
          doctorName,
          pdfBase64
        ).then(() => {
          toast({
            title: "Email Sent",
            description: `Prescription emailed to ${patient.email}`,
          });
        }).catch(error => {
          console.error('Failed to send prescription email:', error);
          // Don't block the flow if email fails
        });
      }

      // Don't navigate immediately - allow PDF download
      // navigate('/doctor');
    } catch (error: any) {
      toast({
        title: "Error creating prescription",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!patient || !createdPrescriptionId) return;

    const pdfData = {
      patientName: patient.full_name,
      patientMRN: patient.mrn,
      patientAge: new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear(),
      patientGender: patient.gender,
      patientMobile: patient.mobile,
      doctorName: doctorName,
      diagnosis: formData.diagnosis,
      notes: formData.notes,
      prescriptionDate: new Date().toISOString().split('T')[0],
      followUpDate: formData.follow_up_date,
      medications: medications.map(med => ({
        medicine_name: med.medicine_name,
        dosage: med.dosage,
        frequency: med.frequency,
        timing: med.timing,
        duration_days: med.duration_days,
        instructions: med.instructions,
      })),
    };

    const pdf = generatePrescriptionPDF(pdfData);
    downloadPDF(pdf, `Prescription_${patient.mrn}_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "PDF Downloaded",
      description: "Prescription PDF has been downloaded successfully",
    });
  };

  const handleShareWhatsApp = () => {
    if (!patient) return;

    const message = `Hello ${patient.full_name},

Your prescription has been created by Dr. ${doctorName}.

Diagnosis: ${formData.diagnosis}

Please download your prescription from Sehat Rakshak portal.

Thank you!`;
    const whatsappUrl = `https://wa.me/${patient.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    toast({
      title: "WhatsApp Opened",
      description: "Share prescription details via WhatsApp",
    });
  };

  const handleShareEmail = () => {
    if (!patient) return;

    const subject = `Prescription from Dr. ${doctorName} - ${new Date().toLocaleDateString()}`;
    const medicationsList = medications.map((med, i) => 
      `${i + 1}. ${med.medicine_name} - ${med.dosage} - ${med.frequency} - ${med.timing} (${med.duration_days} days)`
    ).join('\\n');
    
    const bodyText = `Dear ${patient.full_name},

Your prescription has been created.

Diagnosis: ${formData.diagnosis}

Medications:
${medicationsList}

Clinical Notes: ${formData.notes || 'N/A'}

Follow-up Date: ${formData.follow_up_date ? new Date(formData.follow_up_date).toLocaleDateString() : 'Not scheduled'}

Best regards,
Dr. ${doctorName}
Sehat Rakshak`;
    
    const emailUrl = `mailto:${patient.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
    window.location.href = emailUrl;

    toast({
      title: "Email Client Opened",
      description: "Share prescription via email",
    });
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!patient) {
    return <div className="min-h-screen flex items-center justify-center">Patient not found</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/doctor')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">New Prescription</h1>
              <p className="text-sm text-muted-foreground">
                {patient.full_name} - MRN: {patient.mrn}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Prescription Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="diagnosis">Diagnosis *</Label>
                      <Input
                        id="diagnosis"
                        value={formData.diagnosis}
                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                        required
                        placeholder="Enter diagnosis"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Clinical Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        placeholder="Additional notes"
                      />
                    </div>

                    <div>
                      <Label htmlFor="follow_up">Follow-up Date</Label>
                      <Input
                        id="follow_up"
                        type="date"
                        value={formData.follow_up_date}
                        onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Medications */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Medications</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Medicine
                      </Button>
                    </div>

                    {medications.map((med, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium">Medicine #{index + 1}</h4>
                          {medications.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMedication(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>Medicine Name *</Label>
                            <Input
                              value={med.medicine_name}
                              onChange={(e) => updateMedication(index, 'medicine_name', e.target.value)}
                              required
                              placeholder="e.g., Paracetamol"
                            />
                          </div>

                          <div>
                            <Label>Dosage *</Label>
                            <Input
                              value={med.dosage}
                              onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                              required
                              placeholder="e.g., 500mg"
                            />
                          </div>

                          <div>
                            <Label>Frequency *</Label>
                            <Select
                              value={med.frequency}
                              onValueChange={(value) => updateMedication(index, 'frequency', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1-0-0">1-0-0 (Once daily - Morning)</SelectItem>
                                <SelectItem value="0-1-0">0-1-0 (Once daily - Afternoon)</SelectItem>
                                <SelectItem value="0-0-1">0-0-1 (Once daily - Night)</SelectItem>
                                <SelectItem value="1-0-1">1-0-1 (Twice daily)</SelectItem>
                                <SelectItem value="1-1-1">1-1-1 (Thrice daily)</SelectItem>
                                <SelectItem value="1-1-1-1">1-1-1-1 (Four times daily)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Timing *</Label>
                            <Select
                              value={med.timing}
                              onValueChange={(value) => updateMedication(index, 'timing', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Before Food">Before Food</SelectItem>
                                <SelectItem value="After Food">After Food</SelectItem>
                                <SelectItem value="With Food">With Food</SelectItem>
                                <SelectItem value="Empty Stomach">Empty Stomach</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Duration (Days) *</Label>
                            <Input
                              type="number"
                              value={med.duration_days}
                              onChange={(e) => updateMedication(index, 'duration_days', parseInt(e.target.value))}
                              required
                              min="1"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Label>Special Instructions</Label>
                            <Input
                              value={med.instructions}
                              onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                              placeholder="e.g., Take with plenty of water"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Duplicate Medicine Warnings */}
                  {duplicateWarnings.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          {duplicateWarnings.map((warning, i) => (
                            <div key={i}>{warning}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Submit */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/doctor')}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create Prescription
                    </Button>
                  </div>

                  {/* PDF Download and Share (shown after prescription created) */}
                  {createdPrescriptionId && (
                    <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                      <Button type="button" variant="outline" onClick={handleDownloadPDF}>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button type="button" variant="outline" onClick={handleShareWhatsApp}>
                        <Share2 className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                      <Button type="button" variant="outline" onClick={handleShareEmail}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      <Button onClick={() => navigate('/doctor')}>
                        Back to Dashboard
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Patient Info & Past Prescriptions */}
          <div className="space-y-6">
            {/* Patient Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Age:</span>{" "}
                  <span className="font-medium">
                    {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gender:</span>{" "}
                  <span className="font-medium capitalize">{patient.gender}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Blood Group:</span>{" "}
                  <span className="font-medium">{patient.blood_group || 'N/A'}</span>
                </div>
                {patient.allergies && patient.allergies.length > 0 && (
                  <div>
                    <span className="text-destructive font-medium">Allergies:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {patient.allergies.map((allergy, i) => (
                        <span key={i} className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Prescriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Past Prescriptions</CardTitle>
              </CardHeader>
              <CardContent>
                {pastPrescriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No previous prescriptions</p>
                ) : (
                  <div className="space-y-3">
                    {pastPrescriptions.map((presc) => (
                      <div key={presc.id} className="text-sm border-b pb-2">
                        <div className="font-medium">{presc.diagnosis}</div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(presc.prescription_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs mt-1">
                          {presc.medications?.length || 0} medications
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPrescription;
