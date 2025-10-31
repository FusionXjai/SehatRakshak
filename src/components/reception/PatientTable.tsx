import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eye, Edit, QrCode, User } from "lucide-react";
import type { Patient } from "@/types/database";

interface PatientTableProps {
  patients: Patient[];
  isLoading: boolean;
  onRefresh: () => void;
}

const PatientTable = ({ patients, isLoading, onRefresh }: PatientTableProps) => {
  const navigate = useNavigate();

  const getAgeFromDOB = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  if (patients.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No patients found</h3>
          <p className="text-muted-foreground">Add a new patient to get started</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>MRN</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Age</TableHead>
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
              <TableCell>{getAgeFromDOB(patient.date_of_birth)} years</TableCell>
              <TableCell>{patient.mobile}</TableCell>
              <TableCell>
                {patient.is_discharged ? (
                  <Badge variant="secondary">Discharged</Badge>
                ) : (
                  <Badge className="bg-secondary text-secondary-foreground">Active</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/patients/${patient.id}/edit`)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default PatientTable;
