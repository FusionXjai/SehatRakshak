import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PrescriptionData {
  patientName: string;
  patientMRN: string;
  patientAge: number;
  patientGender: string;
  patientMobile: string;
  doctorName: string;
  diagnosis: string;
  notes?: string;
  prescriptionDate: string;
  followUpDate?: string;
  medications: {
    medicine_name: string;
    dosage: string;
    frequency: string;
    timing: string;
    duration_days: number;
    instructions?: string;
  }[];
}

export const generatePrescriptionPDF = (data: PrescriptionData): jsPDF => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('SEHAT RAKSHAK', 105, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Digital Prescription', 105, 25, { align: 'center' });
  doc.text('आपकी सेहत, हमारा वचन', 105, 32, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Patient Information
  let yPos = 50;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 14, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.patientName}`, 14, yPos);
  doc.text(`MRN: ${data.patientMRN}`, 120, yPos);
  
  yPos += 6;
  doc.text(`Age: ${data.patientAge} years`, 14, yPos);
  doc.text(`Gender: ${data.patientGender}`, 70, yPos);
  doc.text(`Mobile: ${data.patientMobile}`, 120, yPos);
  
  yPos += 6;
  doc.text(`Date: ${new Date(data.prescriptionDate).toLocaleDateString('en-IN')}`, 14, yPos);
  if (data.followUpDate) {
    doc.text(`Follow-up: ${new Date(data.followUpDate).toLocaleDateString('en-IN')}`, 120, yPos);
  }

  // Diagnosis
  yPos += 12;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Diagnosis', 14, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const diagnosisLines = doc.splitTextToSize(data.diagnosis, 180);
  doc.text(diagnosisLines, 14, yPos);
  yPos += diagnosisLines.length * 6;

  // Clinical Notes
  if (data.notes) {
    yPos += 6;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Clinical Notes', 14, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(data.notes, 180);
    doc.text(notesLines, 14, yPos);
    yPos += notesLines.length * 6;
  }

  // Medications Table
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Prescribed Medications', 14, yPos);
  
  yPos += 8;

  const tableData = data.medications.map((med, index) => [
    (index + 1).toString(),
    med.medicine_name,
    med.dosage,
    med.frequency,
    med.timing,
    `${med.duration_days} days`,
    med.instructions || '-'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Medicine', 'Dosage', 'Frequency', 'Timing', 'Duration', 'Instructions']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 20 },
      6: { cellWidth: 40 }
    }
  });

  // Doctor signature
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('________________________________', 120, finalY);
  doc.text(`Dr. ${data.doctorName}`, 120, finalY + 6);
  doc.text('Digital Signature', 120, finalY + 12);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('This is a digitally generated prescription. No physical signature required.', 105, 285, { align: 'center' });
  doc.text('For queries, contact: support@sehatrakshak.com | +91-XXXXXXXXXX', 105, 290, { align: 'center' });

  return doc;
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};

export const getPDFBlob = (doc: jsPDF): Blob => {
  return doc.output('blob');
};

export const getPDFDataURL = (doc: jsPDF): string => {
  return doc.output('dataurlstring');
};
