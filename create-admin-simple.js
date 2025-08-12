// Simple Admin User Creation Script
// Run with: node create-admin-simple.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

async function createAdminUser() {
  console.log('👤 Creating admin user...\n');

  try {
    // Create admin user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'admin@krishisethu.com', 
      'admin123'
    );
    
    const user = userCredential.user;
    console.log('✅ Firebase Auth user created:', user.uid);
    
    // Create admin profile in Firestore
    const adminProfile = {
      uid: user.uid,
      email: user.email,
      name: 'System Administrator',
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
    
    console.log('\n🎉 Admin user created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('Email: admin@krishisethu.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Run: npm start');
    console.log('2. Login with the above credentials');
    console.log('3. Go to Setup tab and initialize database');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('✅ Admin user already exists!');
      console.log('📧 Email: admin@krishisethu.com');
      console.log('🔑 Password: admin123');
    } else {
      console.error('❌ Error creating admin user:', error.message);
    }
  }
  
  process.exit(0);
}

createAdminUser();
