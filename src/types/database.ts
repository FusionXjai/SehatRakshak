export type AppRole = 'superadmin' | 'hospitaladmin' | 'doctor' | 'receptionist' | 'caremanager' | 'patient';

export interface Profile {
  id: string;
  full_name: string;
  mobile?: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  contact_number: string;
  email?: string;
  admin_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  mrn: string;
  qr_code_id: string;
  full_name: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  mobile: string;
  email?: string;
  address?: string;
  allergies?: string[];
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_mobile?: string;
  hospital_id?: string;
  assigned_doctor_id?: string;
  photo_url?: string;
  id_proof_url?: string;
  is_discharged: boolean;
  is_active: boolean;
  discharge_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  specialization: string;
  qualification: string;
  license_number: string;
  hospital_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id?: string;
  diagnosis: string;
  notes?: string;
  prescription_date: string;
  follow_up_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  prescription_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  patient_id: string;
  medication_id: string;
  reminder_time: string;
  is_sent: boolean;
  is_acknowledged: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIInteraction {
  id: string;
  patient_id?: string;
  query: string;
  response: string;
  is_red_flag: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}
