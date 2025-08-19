#!/usr/bin/env node

// Production Setup Script for Krishisethu Inventory Management
// This script helps set up the application for production use

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import readline from 'readline';

const firebaseConfig = {
  apiKey: "AIzaSyCP7F9rGrvmquvDieiLZ1qahOo2dMXJ-WY",
  authDomain: "krishisetu-88b88.firebaseapp.com",
  projectId: "krishisetu-88b88",
  storageBucket: "krishisetu-88b88.firebasestorage.app",
  messagingSenderId: "1097162834618",
  appId: "1:1097162834618:web:0fbda0a418ef114109b883"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createAdminUser() {
  console.log('🚀 Krishisethu Inventory Management - Production Setup\n');
  
  console.log('📋 This script will help you set up the first admin user for your shop.\n');
  
  // Get admin details
  const name = await askQuestion('👤 Enter admin name (e.g., "Shop Owner"): ');
  const email = await askQuestion('📧 Enter admin email: ');
  const password = await askQuestion('🔑 Enter admin password (min 6 characters): ');
  
  if (password.length < 6) {
    console.log('❌ Password must be at least 6 characters long');
    rl.close();
    return;
  }
  
  console.log('\n⏳ Creating admin user...');
  
  try {
    // Create admin user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Firebase Auth user created:', user.uid);
    
    // Create admin profile in Firestore
    const adminProfile = {
      uid: user.uid,
      email: user.email,
      name: name,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      permissions: {
        canManageUsers: true,
        canManageProducts: true,
        canManageSuppliers: true,
        canManageCustomers: true,
        canViewReports: true,
        canManageSettings: true,
        canManageBackups: true
      }
    };
    
    await setDoc(doc(db, 'users', user.uid), adminProfile);
    console.log('✅ Admin profile created in Firestore');
    
    console.log('\n🎉 Admin user created successfully!\n');
    console.log('📧 Login Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Role: admin\n');
    
    console.log('🚀 Next Steps:');
    console.log('1. Start your application: npm start');
    console.log('2. Login with the above credentials');
    console.log('3. Go to User Management to add shop staff');
    console.log('4. Change your password after first login');
    console.log('5. Add your shop\'s products and suppliers\n');
    
    console.log('📚 Important Notes:');
    console.log('- Keep your login credentials secure');
    console.log('- Only create accounts for trusted staff');
    console.log('- Regular backups are recommended');
    console.log('- Monitor user activity regularly\n');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️ This email is already registered!');
      console.log('If this is your email, you can login directly.');
      console.log('If you forgot your password, contact Firebase support.');
    } else if (error.code === 'auth/weak-password') {
      console.log('❌ Password is too weak. Please use a stronger password.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('❌ Invalid email format. Please enter a valid email.');
    } else {
      console.error('❌ Error creating admin user:', error.message);
    }
  }
  
  rl.close();
}

// Run the setup
createAdminUser().catch(console.error);
