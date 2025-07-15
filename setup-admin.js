#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 VsdvBillsoft Admin Setup Tool');
console.log('=================================\n');

console.log('To create an admin account, you have several options:\n');

console.log('📋 METHOD 1: Automatic (Recommended)');
console.log('   1. Start your application: npm run dev');
console.log('   2. Sign up for the first account');
console.log('   3. The system automatically makes the first user an admin\n');

console.log('📋 METHOD 2: Admin Setup Page');
console.log('   1. Sign in to your application');
console.log('   2. Visit: http://localhost:5173/admin-setup');
console.log('   3. Use the UI to promote users to admin\n');

console.log('📋 METHOD 3: SQL Command');
console.log('   1. Open your Supabase dashboard');
console.log('   2. Go to SQL Editor');
console.log('   3. Run one of these commands:\n');

rl.question('Enter your email address to generate the SQL command: ', (email) => {
  if (email && email.includes('@')) {
    console.log('\n🔍 Copy and paste this SQL command in Supabase:\n');
    console.log(`UPDATE public.users SET role = 'admin', updated_at = NOW() WHERE email = '${email}';`);
    console.log('\n✅ Alternative commands:\n');
    console.log('-- Promote first user to admin:');
    console.log('SELECT promote_first_user_to_admin();\n');
    console.log('-- View all users:');
    console.log('SELECT id, email, full_name, role FROM public.users ORDER BY created_at;');
  } else {
    console.log('\n📝 Generic SQL commands:\n');
    console.log('-- Promote specific user by email:');
    console.log("UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';\n");
    console.log('-- Promote first user:');
    console.log('SELECT promote_first_user_to_admin();\n');
    console.log('-- View all users:');
    console.log('SELECT id, email, full_name, role FROM public.users ORDER BY created_at;');
  }
  
  console.log('\n📋 METHOD 4: Manual Database Update');
  console.log('   1. Go to Supabase → Database → Tables');
  console.log('   2. Find the "users" table');
  console.log('   3. Locate your user record');
  console.log('   4. Change the "role" field to "admin"');
  console.log('   5. Save the changes\n');
  
  console.log('🎯 VERIFICATION:');
  console.log('   After setting up an admin:');
  console.log('   1. Sign in to your application');
  console.log('   2. Navigate to User Management');
  console.log('   3. You should see the admin interface\n');
  
  console.log('⚠️  TROUBLESHOOTING:');
  console.log('   - Make sure you have signed up in the app first');
  console.log('   - Check that the user exists in the Supabase users table');
  console.log('   - Verify the email address is correct');
  console.log('   - Try refreshing the app after making changes\n');
  
  console.log('✨ Done! Your admin account should now be ready.');
  
  rl.close();
});

rl.on('close', () => {
  process.exit(0);
});
