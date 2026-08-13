const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const auth = async (req, res, next) => {

    try {

        // =================================================
        // SESSION CHECK
        // =================================================

        if (
            !req.session ||
            !req.session.admin ||
            !req.session.admin.id
        ) {

            return res.redirect('/admin/login');

        }


        const adminId =
            req.session.admin.id;


        // =================================================
        // MONGODB ID VALIDATION
        // =================================================

        if (
            !mongoose.Types.ObjectId.isValid(
                adminId
            )
        ) {

            return req.session.destroy(() => {

                return res.redirect(
                    '/admin/login'
                );

            });

        }


        // =================================================
        // VERIFY ADMIN FROM DATABASE
        // =================================================

        const admin =
            await Admin.findById(
                adminId
            ).select(
                '_id name email role'
            );


        // =================================================
        // ADMIN DOES NOT EXIST
        // =================================================

        if (!admin) {

            return req.session.destroy(() => {

                return res.redirect(
                    '/admin/login'
                );

            });

        }


        // =================================================
        // ROLE VALIDATION
        // =================================================

        if (
            admin.role !== 'admin' &&
            admin.role !== 'superadmin'
        ) {

            return req.session.destroy(() => {

                return res.redirect(
                    '/admin/login'
                );

            });

        }


        // =================================================
        // REFRESH SESSION DATA
        // =================================================

        req.session.admin = {

            id: admin._id.toString(),

            name:
                String(
                    admin.name || 'Admin'
                ),

            email:
                String(
                    admin.email || ''
                ),

            role:
                admin.role

        };


        // =================================================
        // AUTHENTICATED ADMIN
        // =================================================

        return next();

    }

    catch (error) {

        console.error(
            'Authentication error:',
            error
        );

        return res.redirect(
            '/admin/login'
        );

    }

};


module.exports = auth;