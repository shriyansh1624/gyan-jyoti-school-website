const express = require('express');
const router = express.Router();

const Faculty = require('../../models/Faculty');
const auth = require('../../middleware/auth');


// =========================================================
// WHATSAPP ANNOUNCEMENT PAGE
// GET /admin/whatsapp
// =========================================================

router.get('/', auth, async (req, res) => {

    try {

        // =====================================================
        // LOAD ALL FACULTY
        // =====================================================

        const faculties = await Faculty.find({})
            .select(
                'name role category section whatsappNumber image priority'
            )
            .sort({
                category: 1,
                priority: 1,
                name: 1
            })
            .lean();


        // =====================================================
        // DEBUG
        // =====================================================

        console.log(
            '✅ WhatsApp Faculty Loaded:',
            faculties.length
        );


        console.log(
            faculties.map(faculty => ({

                name:
                    faculty.name,

                role:
                    faculty.role,

                category:
                    faculty.category,

                section:
                    faculty.section,

                whatsappNumber:
                    faculty.whatsappNumber || 'NOT ADDED'

            }))
        );


        // =====================================================
        // RENDER WHATSAPP ANNOUNCEMENT PAGE
        // =====================================================

        return res.render(
            'admin/whatsapp/index',
            {

                title:
                    'WhatsApp Announcements',

                active:
                    'whatsapp',

                faculties

            }
        );


    } catch (error) {

        // =====================================================
        // ERROR
        // =====================================================

        console.error(
            '❌ WhatsApp announcement error:',
            error
        );


        return res.status(
            500
        ).send(
            'Error loading WhatsApp announcements'
        );

    }

});


// =========================================================
// WHATSAPP FACULTY API
// GET /admin/whatsapp/api/faculty
// =========================================================

router.get(
    '/api/faculty',
    auth,
    async (req, res) => {

        try {

            const faculties =
                await Faculty.find({})
                    .select(
                        'name role category section whatsappNumber image priority'
                    )
                    .sort({
                        category: 1,
                        priority: 1,
                        name: 1
                    })
                    .lean();


            return res.json({

                success: true,

                count:
                    faculties.length,

                faculties

            });


        } catch (error) {

            console.error(
                '❌ WhatsApp faculty API error:',
                error
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    'Unable to load faculty contacts.'

            });

        }

    }
);


// =========================================================
// WHATSAPP CONTACTS ONLY
// GET /admin/whatsapp/api/contacts
// =========================================================

router.get(
    '/api/contacts',
    auth,
    async (req, res) => {

        try {

            const faculties =
                await Faculty.find({

                    whatsappNumber: {
                        $exists: true,
                        $ne: ''
                    }

                })
                    .select(
                        'name role category section whatsappNumber image priority'
                    )
                    .sort({
                        category: 1,
                        priority: 1,
                        name: 1
                    })
                    .lean();


            return res.json({

                success: true,

                count:
                    faculties.length,

                faculties

            });


        } catch (error) {

            console.error(
                '❌ WhatsApp contacts error:',
                error
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    'Unable to load WhatsApp contacts.'

            });

        }

    }
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;