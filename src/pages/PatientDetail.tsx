import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Trash2, User, Phone, Mail, MapPin, Calendar, Droplet, AlertCircle, FileText, Image } from "lucide-react";
import type { Patient } from "@/types/database";

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [idProofUrl, setIdProofUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPatient(data as Patient);

      // Get signed URLs for documents
      if (data.photo_url) {
        const { data: photoData } = await supabase.storage
          .from('patient-documents')
          .createSignedUrl(data.photo_url, 3600);
        setPhotoUrl(photoData?.signedUrl || null);
      }

      if (data.id_proof_url) {
        const { data: idProofData } = await supabase.storage
          .from('patient-documents')
          .createSignedUrl(data.id_proof_url, 3600);
        setIdProofUrl(idProofData?.signedUrl || null);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching patient",
        description: error.message,
        variant: "destructive",
      });
      navigate('/reception');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDischarge = async () => {
    if (!patient) return;
    
    try {
      const { error } = await supabase
        .from('patients')
        .update({ 
          is_discharged: true, 
          discharge_date: new Date().toISOString() 
        })
        .eq('id', patient.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient discharged successfully",
      });

      fetchPatient();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async () => {
    if (!patient || !confirm('Are you sure you want to deactivate this patient?')) return;
    
    try {
      const { error } = await supabase
        .from('patients')
        .update({ is_active: false })
        .eq('id', patient.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient deactivated successfully",
      });

      navigate('/reception');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  const getAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/reception')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{patient.full_name}</h1>
                <p className="text-sm text-muted-foreground">MRN: {patient.mrn}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/patients/${patient.id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {!patient.is_discharged && (
                <Button variant="outline" onClick={handleDischarge}>
                  Discharge
                </Button>
              )}
              <Button variant="destructive" onClick={handleDeactivate}>
                <Trash2 className="w-4 h-4 mr-2" />
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Photo & Status */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Patient Photo</CardTitle>
              </CardHeader>
              <CardContent>
                {photoUrl ? (
                  <img src={photoUrl} alt="Patient" className="w-full rounded-lg" />
                ) : (
                  <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <User className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <Badge variant={patient.is_active ? "default" : "secondary"}>
                    {patient.is_active ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Discharged</span>
                  <Badge variant={patient.is_discharged ? "secondary" : "default"}>
                    {patient.is_discharged ? "Yes" : "No"}
                  </Badge>
                </div>
                {patient.discharge_date && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Discharge Date:</span>
                    <p className="font-medium">{new Date(patient.discharge_date).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{patient.gender}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{new Date(patient.date_of_birth).toLocaleDateString()} ({getAge(patient.date_of_birth)} years)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Mobile</p>
                    <p className="font-medium">{patient.mobile}</p>
                  </div>
                </div>

                {patient.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{patient.email}</p>
                    </div>
                  </div>
                )}

                {patient.blood_group && (
                  <div className="flex items-start gap-3">
                    <Droplet className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Blood Group</p>
                      <p className="font-medium">{patient.blood_group}</p>
                    </div>
                  </div>
                )}

                {patient.address && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{patient.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.allergies && patient.allergies.length > 0 && (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Allergies</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {patient.allergies.map((allergy, index) => (
                          <Badge key={index} variant="destructive">{allergy}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {(patient.emergency_contact_name || patient.emergency_contact_mobile) && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Emergency Contact</p>
                      {patient.emergency_contact_name && (
                        <p className="font-medium">{patient.emergency_contact_name}</p>
                      )}
                      {patient.emergency_contact_mobile && (
                        <p className="text-sm">{patient.emergency_contact_mobile}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            {idProofUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>ID Proof</CardTitle>
                </CardHeader>
                <CardContent>
                  <a href={idProofUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      View Document
                    </Button>
                  </a>
                </CardContent>
              </Card>
            )}

            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle>QR Code ID</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm">{patient.qr_code_id}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
