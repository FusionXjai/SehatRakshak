import { supabase } from "@/integrations/supabase/client";

export const setupDatabaseTables = async () => {
  try {
    // Check if doctors table exists by trying to query it
    const { error: doctorsCheckError } = await (supabase as any)
      .from('doctors')
      .select('id')
      .limit(1);

    // If table doesn't exist, we need to show instructions
    if (doctorsCheckError && doctorsCheckError.code === '42P01') {
      console.warn('Database tables not found. Please run the SQL migration in Supabase dashboard.');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking database setup:', error);
    return false;
  }
};

// Auto-create doctor profile if user has doctor role but no doctor profile
export const ensureDoctorProfile = async (userId: string) => {
  try {
    // Check if doctor profile exists
    const { data: existing } = await (supabase as any)
      .from('doctors')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) return existing.id;

    // Create doctor profile with default values
    const { data: newDoctor, error } = await (supabase as any)
      .from('doctors')
      .insert({
        user_id: userId,
        specialization: 'General Medicine',
        qualification: 'MBBS',
        license_number: `LIC-${Date.now()}`,
      })
      .select()
      .single();

    if (error) throw error;
    return newDoctor.id;
  } catch (error) {
    console.error('Error creating doctor profile:', error);
    return null;
  }
};
