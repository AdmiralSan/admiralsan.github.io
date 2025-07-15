#!/usr/bin/env node

// Quick setup script for Clerk User Management
// Run with: node setup-clerk-users.js

import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up Clerk User Management...\n');

// Check if required files exist
const requiredFiles = [
  'src/components/ClerkUserManagementSimple.jsx',
  'CLERK-USER-MANAGEMENT-SETUP.md'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error('❌ Missing required files:');
  missingFiles.forEach(file => console.error(`   - ${file}`));
  console.error('\nPlease ensure all files are in place before running setup.');
  process.exit(1);
}

// Backup existing UserManagement.jsx
const userManagementPath = 'src/pages/UserManagement.jsx';
const backupPath = 'src/pages/UserManagement.backup.jsx';

if (fs.existsSync(userManagementPath)) {
  console.log('📋 Backing up existing UserManagement.jsx...');
  fs.copyFileSync(userManagementPath, backupPath);
  console.log(`   ✅ Backup created: ${backupPath}\n`);
}

// Create new UserManagement.jsx
const newUserManagementContent = `import React from 'react';
import ClerkUserManagementSimple from '../components/ClerkUserManagementSimple';

const UserManagement = () => {
  return <ClerkUserManagementSimple />;
};

export default UserManagement;
`;

fs.writeFileSync(userManagementPath, newUserManagementContent);
console.log('✅ Updated UserManagement.jsx with Clerk integration\n');

// Check package.json for required dependencies
const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['@clerk/clerk-react'];
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
  );

  if (missingDeps.length > 0) {
    console.log('📦 Missing required dependencies:');
    missingDeps.forEach(dep => console.log(`   - ${dep}`));
    console.log('\nRun the following command to install:');
    console.log(`npm install ${missingDeps.join(' ')}\n`);
  } else {
    console.log('✅ All required dependencies are installed\n');
  }
}

// Check for environment variables
const envExamplePath = '.env.example';
const envLocalPath = '.env.local';

if (!fs.existsSync(envLocalPath)) {
  console.log('⚠️  Environment file not found');
  console.log('   Create .env.local with your Clerk keys:\n');
  console.log('   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...');
  console.log('   CLERK_SECRET_KEY=sk_test_...\n');
}

// Installation checklist
console.log('📋 Setup Checklist:');
console.log('   ✅ Component files created');
console.log('   ✅ UserManagement.jsx updated');
console.log('   ⏳ Install dependencies: npm install @clerk/clerk-react');
console.log('   ⏳ Set up environment variables (.env.local)');
console.log('   ⏳ Enable Organizations in Clerk dashboard');
console.log('   ⏳ Configure ClerkProvider in your main app');
console.log('   ⏳ Add OrganizationSwitcher component to header');

console.log('\n📖 Next Steps:');
console.log('   1. Read CLERK-USER-MANAGEMENT-SETUP.md for detailed instructions');
console.log('   2. Set up your Clerk application and get your keys');
console.log('   3. Enable Organizations in your Clerk dashboard');
console.log('   4. Configure your app with ClerkProvider');
console.log('   5. Test the user management functionality');

console.log('\n🎉 Setup complete! Check the documentation for next steps.');

// Create a quick start guide
const quickStartContent = `# Quick Start Guide

## 1. Install Dependencies
\`\`\`bash
npm install @clerk/clerk-react
\`\`\`

## 2. Environment Variables
Create \`.env.local\`:
\`\`\`
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here
\`\`\`

## 3. Wrap App with ClerkProvider
In your main App component:
\`\`\`jsx
import { ClerkProvider } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      {/* Your existing app */}
    </ClerkProvider>
  );
}
\`\`\`

## 4. Add Organization Support
Add to your header/navigation:
\`\`\`jsx
import { OrganizationSwitcher } from '@clerk/clerk-react';

function Header() {
  return (
    <div>
      {/* Your existing header */}
      <OrganizationSwitcher />
    </div>
  );
}
\`\`\`

## 5. Test
- Navigate to User Management page
- Create an organization if prompted
- Try inviting a user

For detailed setup, see CLERK-USER-MANAGEMENT-SETUP.md
`;

fs.writeFileSync('CLERK-QUICK-START.md', quickStartContent);
console.log('📝 Created CLERK-QUICK-START.md for reference');
