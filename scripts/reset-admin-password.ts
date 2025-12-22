import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

async function resetAdminPassword() {
  console.log('🔐 Resetting admin password...');
  
  const newPassword = 'admin123';
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  console.log('Generated hash:', passwordHash.substring(0, 20) + '...');
  
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('username', 'admin')
    .select();
  
  if (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  }
  
  console.log('✅ Admin password reset successfully!');
  console.log('Username: admin');
  console.log('Password: admin123');
  console.log('Updated user:', data);
}

resetAdminPassword().catch(console.error);
