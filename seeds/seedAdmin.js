const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Admin = require('../models/Admin');

async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@gyanjyoti.com' });
    
    if (existingAdmin) {
      console.log('⚠️ Admin already exists!');
      console.log('Email: admin@gyanjyoti.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin
    const admin = new Admin({
      email: 'admin@gyanjyoti.com',
      password: hashedPassword,
      name: 'Administrator',
      role: 'superadmin'
    });

    await admin.save();

    console.log('✅ Admin created successfully!');
    console.log('📧 Email: admin@gyanjyoti.com');
    console.log('🔐 Password: admin123');
    console.log('⚠️ Please change password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedAdmin();