/**
 * Script to create default Hospital Admin account
 * Run this with: node create-hospital-admin.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You need to add this to .env

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Please add:');
  console.log('  VITE_SUPABASE_URL=your_supabase_url');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const HOSPITAL_ADMIN_EMAIL = 'admin@hospital.com';
const HOSPITAL_ADMIN_PASSWORD = 'Hospital@123';
const HOSPITAL_NAME = 'Default Hospital';

async function createHospitalAdmin() {
  console.log('🏥 Creating Hospital Admin Account...\n');

  try {
    // Step 1: Create auth user
    console.log('📝 Step 1: Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: HOSPITAL_ADMIN_EMAIL,
      password: HOSPITAL_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'Hospital Admin',
        role: 'hospitaladmin',
        mobile: '+91-9876543210'
      }
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log('⚠️  User already exists, fetching existing user...');
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === HOSPITAL_ADMIN_EMAIL);
        if (existingUser) {
          console.log('✓ Found existing user:', existingUser.id);
          await createProfile(existingUser.id);
          await createHospital(existingUser.id);
          return;
        }
      }
      throw authError;
    }

    const userId = authData.user.id;
    console.log('✓ Auth user created:', userId);

    // Step 2: Create profile
    await createProfile(userId);

    // Step 3: Create hospital
    await createHospital(userId);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Hospital Admin Account Created Successfully!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📧 Login Credentials:');
    console.log(`   Email:    ${HOSPITAL_ADMIN_EMAIL}`);
    console.log(`   Password: ${HOSPITAL_ADMIN_PASSWORD}`);
    console.log(`\n🔗 Dashboard: http://localhost:8080/hospital-admin`);
    console.log('\n⚠️  Please change the password after first login!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

async function createProfile(userId) {
  console.log('\n📝 Step 2: Creating user profile...');
  
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: 'Hospital Admin',
      email: HOSPITAL_ADMIN_EMAIL,
      role: 'hospitaladmin',
      mobile: '+91-9876543210',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (profileError) {
    console.error('❌ Profile creation error:', profileError);
    throw profileError;
  }

  console.log('✓ Profile created');
}

async function createHospital(adminId) {
  console.log('\n📝 Step 3: Creating hospital...');
  
  const { data: existingHospital } = await supabase
    .from('hospitals')
    .select('*')
    .eq('email', 'hospital@example.com')
    .single();

  if (existingHospital) {
    console.log('⚠️  Hospital already exists, updating admin_id...');
    const { error: updateError } = await supabase
      .from('hospitals')
      .update({ admin_id: adminId })
      .eq('id', existingHospital.id);

    if (updateError) throw updateError;
    console.log('✓ Hospital admin updated');
    return;
  }

  const { error: hospitalError } = await supabase
    .from('hospitals')
    .insert({
      name: HOSPITAL_NAME,
      address: '123 Medical Street, Healthcare City',
      phone: '+91-9876543210',
      email: 'hospital@example.com',
      admin_id: adminId,
      created_at: new Date().toISOString()
    });

  if (hospitalError) {
    console.error('❌ Hospital creation error:', hospitalError);
    throw hospitalError;
  }

  console.log('✓ Hospital created');
}

// Run the script
createHospitalAdmin();
