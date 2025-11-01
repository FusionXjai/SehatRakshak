import emailjs from '@emailjs/browser';

// EmailJS configuration from environment variables
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';

// Initialize EmailJS
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

/**
 * Send email when a new patient is added by doctor
 */
export async function sendPatientWelcomeEmail(
  patientData: {
    full_name: string;
    email: string;
    mobile: string;
    mrn: string;
    qr_code_id: string;
  },
  doctorData: {
    name: string;
    specialization?: string;
  }
): Promise<boolean> {
  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
    console.warn('EmailJS not configured. Skipping patient welcome email.');
    return false;
  }

  if (!patientData.email) {
    console.warn('Patient email not provided. Skipping email.');
    return false;
  }

  try {
    const templateParams = {
      to_email: patientData.email,
      to_name: patientData.full_name,
      subject: 'Welcome to Sehat Rakshak - Your Healthcare Journey Begins',
      patient_name: patientData.full_name,
      patient_mrn: patientData.mrn,
      patient_qr: patientData.qr_code_id,
      patient_mobile: patientData.mobile,
      doctor_name: doctorData.name,
      doctor_specialization: doctorData.specialization || 'General Medicine',
      login_url: window.location.origin + '/login',
      message: `Dear ${patientData.full_name},

Welcome to Sehat Rakshak! You have been successfully registered in our hospital management system.

Your Details:
• Medical Record Number (MRN): ${patientData.mrn}
• QR Code ID: ${patientData.qr_code_id}
• Assigned Doctor: Dr. ${doctorData.name} (${doctorData.specialization || 'General Medicine'})
• Mobile: ${patientData.mobile}

You can now:
✓ View your medical records online
✓ Receive medication reminders
✓ Access your prescriptions digitally
✓ Track your health progress
✓ Connect with your doctor

Please keep your MRN safe for future reference.

Best regards,
Sehat Rakshak Team
आपकी सेहत, हमारा वचन`
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Patient welcome email sent successfully to:', patientData.email);
    return true;
  } catch (error) {
    console.error('❌ Failed to send patient welcome email:', error);
    return false;
  }
}

/**
 * Send prescription email with PDF
 */
export async function sendPrescriptionEmail(
  patientData: {
    full_name: string;
    email: string;
    mrn: string;
  },
  prescriptionData: {
    diagnosis: string;
    medications: Array<{
      medicine_name: string;
      dosage: string;
      frequency: string;
      timing: string;
      duration_days: number;
    }>;
    prescription_date: string;
    notes?: string;
  },
  doctorName: string,
  pdfBase64?: string
): Promise<boolean> {
  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
    console.warn('EmailJS not configured. Skipping prescription email.');
    return false;
  }

  if (!patientData.email) {
    console.warn('Patient email not provided. Skipping email.');
    return false;
  }

  try {
    // Create medication list
    const medicationsList = prescriptionData.medications
      .map((med, i) => 
        `${i + 1}. ${med.medicine_name} - ${med.dosage}
   Take: ${med.frequency}, ${med.timing}
   Duration: ${med.duration_days} days`
      )
      .join('\n\n');

    const templateParams = {
      to_email: patientData.email,
      to_name: patientData.full_name,
      subject: `New Prescription from Dr. ${doctorName} - ${new Date(prescriptionData.prescription_date).toLocaleDateString()}`,
      patient_name: patientData.full_name,
      patient_mrn: patientData.mrn,
      doctor_name: doctorName,
      diagnosis: prescriptionData.diagnosis,
      prescription_date: new Date(prescriptionData.prescription_date).toLocaleDateString('en-IN'),
      medications: medicationsList,
      notes: prescriptionData.notes || 'N/A',
      message: `Dear ${patientData.full_name},

Your prescription has been created by Dr. ${doctorName}.

Diagnosis: ${prescriptionData.diagnosis}

Medications Prescribed:
${medicationsList}

${prescriptionData.notes ? `Clinical Notes: ${prescriptionData.notes}` : ''}

Important Instructions:
• Take medicines exactly as prescribed
• Complete the full course even if you feel better
• Contact your doctor if you experience any side effects
• Keep medicines out of reach of children
• Store in a cool, dry place

You can also download your prescription from the Sehat Rakshak portal.

Stay healthy!

Dr. ${doctorName}
Sehat Rakshak
आपकी सेहत, हमारा वचन`,
      // Note: EmailJS free plan doesn't support attachments
      // For PDF attachments, you'll need EmailJS Pro or use a backend service
      pdf_attachment: pdfBase64 || ''
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Prescription email sent successfully to:', patientData.email);
    return true;
  } catch (error) {
    console.error('❌ Failed to send prescription email:', error);
    return false;
  }
}

/**
 * Send welcome email for new user signup
 */
export async function sendWelcomeEmail(
  userData: {
    recipientEmail: string;
    recipientName: string;
    recipientRole: string;
    loginUrl: string;
  }
): Promise<boolean> {
  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
    console.warn('EmailJS not configured. Skipping welcome email.');
    return false;
  }

  if (!userData.recipientEmail) {
    console.warn('Recipient email not provided. Skipping email.');
    return false;
  }

  try {
    const roleDisplayName = userData.recipientRole.charAt(0).toUpperCase() + userData.recipientRole.slice(1);
    
    const templateParams = {
      to_email: userData.recipientEmail,
      to_name: userData.recipientName,
      subject: 'Welcome to Sehat Rakshak - Your Account is Ready!',
      message: `Dear ${userData.recipientName},

Welcome to Sehat Rakshak! Your account has been successfully created.

Account Details:
• Name: ${userData.recipientName}
• Email: ${userData.recipientEmail}
• Role: ${roleDisplayName}

You can now login to your account and start using our healthcare platform:
${userData.loginUrl}

Features available to you:
✓ Secure access to your healthcare information
✓ Easy communication with healthcare providers
✓ Track your health journey
✓ Get timely reminders and updates

If you have any questions or need assistance, please don't hesitate to contact our support team.

Thank you for choosing Sehat Rakshak!

Best regards,
Sehat Rakshak Team
आपकी सेहत, हमारा वचन`
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Welcome email sent successfully to:', userData.recipientEmail);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return false;
  }
}

/**
 * Send medication reminder email
 */
export async function sendMedicationReminderEmail(
  patientData: {
    full_name: string;
    email: string;
  },
  medications: Array<{
    medicine_name: string;
    dosage: string;
    timing: string;
  }>
): Promise<boolean> {
  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
    console.warn('EmailJS not configured. Skipping reminder email.');
    return false;
  }

  if (!patientData.email) {
    return false;
  }

  try {
    const medicationsList = medications
      .map((med, i) => `${i + 1}. ${med.medicine_name} - ${med.dosage} (${med.timing})`)
      .join('\n');

    const templateParams = {
      to_email: patientData.email,
      to_name: patientData.full_name,
      subject: '💊 Medication Reminder - Sehat Rakshak',
      patient_name: patientData.full_name,
      message: `Dear ${patientData.full_name},

This is a friendly reminder to take your medications:

${medicationsList}

Please take your medicines on time for effective treatment.

Stay healthy!
Sehat Rakshak Team`
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Medication reminder email sent to:', patientData.email);
    return true;
  } catch (error) {
    console.error('❌ Failed to send medication reminder:', error);
    return false;
  }
}
