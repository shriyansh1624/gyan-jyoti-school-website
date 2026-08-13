require('dotenv').config();

const dns = require('dns');

dns.setServers([
    '8.8.8.8',
    '1.1.1.1'
]);

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Admin = require('./models/Admin');


async function resetAdminPassword() {

    try {

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            '✅ MongoDB Connected'
        );


        // ACTUAL ADMIN EMAIL
        const email =
            'lala123@gmail.com';


        // NEW PASSWORD
        const newPassword =
            'lala@16';


        // FIND ADMIN
        const admin =
            await Admin.findOne({
                email
            });


        if (!admin) {

            console.log(
                '❌ Admin not found:',
                email
            );

            return;

        }


        // HASH PASSWORD FIRST
        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                12
            );


        // DIRECT DATABASE UPDATE
        // Isse pre-save hook dobara hash nahi karega.

        await Admin.updateOne(
            {
                _id: admin._id
            },
            {
                $set: {
                    password: hashedPassword
                }
            }
        );


        console.log(
            '✅ Password reset successfully'
        );

        console.log(
            'Email:',
            admin.email
        );

        console.log(
            '🔐 New password has been bcrypt hashed.'
        );

    }

    catch (error) {

        console.error(
            '❌ Password reset error:',
            error
        );

    }

    finally {

        await mongoose.disconnect();

        console.log(
            'MongoDB disconnected'
        );

    }

}


resetAdminPassword();