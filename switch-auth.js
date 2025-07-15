#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 VsdvBillsoft - Switching to Clerk Authentication');
console.log('=====================================');

const fileSwaps = [
  {
    current: 'src/main.jsx',
    backup: 'src/main.supabase.jsx',
    clerk: 'src/main.clerk.jsx'
  },
  {
    current: 'src/App.jsx',
    backup: 'src/App.supabase.jsx',
    clerk: 'src/App.clerk.jsx'
  },
  {
    current: 'src/contexts/AuthContext.jsx',
    backup: 'src/contexts/AuthContext.supabase.jsx',
    clerk: 'src/contexts/AuthContext.clerk.jsx'
  },
  {
    current: 'src/components/Header.jsx',
    backup: 'src/components/Header.supabase.jsx',
    clerk: 'src/components/Header.clerk.jsx'
  },
  {
    current: 'src/components/ProtectedRoute.jsx',
    backup: 'src/components/ProtectedRoute.supabase.jsx',
    clerk: 'src/components/ProtectedRoute.clerk.jsx'
  },
  {
    current: 'src/pages/Login.jsx',
    backup: 'src/pages/Login.supabase.jsx',
    clerk: 'src/pages/Login.clerk.jsx'
  },
  {
    current: 'src/pages/Register.jsx',
    backup: 'src/pages/Register.supabase.jsx',
    clerk: 'src/pages/Register.clerk.jsx'
  }
];

const backupFiles = () => {
  console.log('\n📦 Backing up current files...');
  
  fileSwaps.forEach(({ current, backup }) => {
    if (fs.existsSync(current)) {
      fs.copyFileSync(current, backup);
      console.log(`   ✅ ${current} → ${backup}`);
    }
  });
};

const switchToClerk = () => {
  console.log('\n🔄 Switching to Clerk files...');
  
  fileSwaps.forEach(({ current, clerk }) => {
    if (fs.existsSync(clerk)) {
      fs.copyFileSync(clerk, current);
      console.log(`   ✅ ${clerk} → ${current}`);
    } else {
      console.log(`   ⚠️  ${clerk} not found, skipping...`);
    }
  });
};

const switchToSupabase = () => {
  console.log('\n🔄 Switching back to Supabase files...');
  
  fileSwaps.forEach(({ current, backup }) => {
    if (fs.existsSync(backup)) {
      fs.copyFileSync(backup, current);
      console.log(`   ✅ ${backup} → ${current}`);
    } else {
      console.log(`   ⚠️  ${backup} not found, skipping...`);
    }
  });
};

const showStatus = () => {
  console.log('\n📊 Current Status:');
  console.log('=================');
  
  fileSwaps.forEach(({ current, backup, clerk }) => {
    const currentExists = fs.existsSync(current);
    const backupExists = fs.existsSync(backup);
    const clerkExists = fs.existsSync(clerk);
    
    console.log(`${current}:`);
    console.log(`   Current: ${currentExists ? '✅' : '❌'}`);
    console.log(`   Backup:  ${backupExists ? '✅' : '❌'}`);
    console.log(`   Clerk:   ${clerkExists ? '✅' : '❌'}`);
    console.log('');
  });
};

const command = process.argv[2];

switch (command) {
  case 'backup':
    backupFiles();
    break;
    
  case 'clerk':
    backupFiles();
    switchToClerk();
    console.log('\n🎉 Successfully switched to Clerk authentication!');
    console.log('\n⚠️  Remember to:');
    console.log('   1. Set VITE_CLERK_PUBLISHABLE_KEY in .env.local');
    console.log('   2. Configure redirect URLs in Clerk dashboard');
    console.log('   3. Restart your development server');
    break;
    
  case 'supabase':
    switchToSupabase();
    console.log('\n🎉 Successfully switched back to Supabase authentication!');
    break;
    
  case 'status':
    showStatus();
    break;
    
  default:
    console.log('\n📖 Usage:');
    console.log('   node switch-auth.js backup    - Backup current files');
    console.log('   node switch-auth.js clerk     - Switch to Clerk auth');
    console.log('   node switch-auth.js supabase  - Switch back to Supabase auth');
    console.log('   node switch-auth.js status    - Show current status');
    break;
}

console.log('\n✨ Done!');
