const express = require('express');
const router = express.Router();

const FeeStructure = require('../../models/FeeStructure');
const auth = require('../../middleware/auth');

// =========================================================
// ADMIN FEES MANAGER
// Base URL:
// /admin/fees
// =========================================================


// =========================================================
// GET ALL FEE STRUCTURES
// GET /admin/fees
// =========================================================

router.get('/', auth, async (req, res) => {

    try {

        const feeStructures =
            await FeeStructure.find({})
                .sort({
                    session: -1,
                    priority: 1,
                    section: 1
                })
                .lean();


        return res.render(
            'admin/fees/index',
            {
                title: 'Fees Structure Manager',

                active: 'fees',

                feeStructures
            }
        );


    } catch (error) {

        console.error(
            '❌ Error loading fee structures:',
            error
        );


        return res.status(500).send(
            'Error loading Fees Structure Manager'
        );

    }

});


// =========================================================
// ADD FEE STRUCTURE PAGE
// GET /admin/fees/add
// =========================================================

router.get('/add', auth, (req, res) => {

    return res.render(
        'admin/fees/add',
        {
            title: 'Add Fee Structure',

            active: 'fees',

            error: null,

            formData: {
                session: '2026-27',
                section: 'primary',
                title: '',
                classRange: '',
                icon: 'fas fa-child',
                annualApprox: 0,
                priority: 0,
                notes: '',
                published: true,

                fees: [
                    {
                        name: 'Admission Fee',
                        amount: 0
                    },
                    {
                        name: 'Monthly Tuition Fee',
                        amount: 0
                    },
                    {
                        name: 'Exam Fee',
                        amount: 0
                    },
                    {
                        name: 'Activity Fee',
                        amount: 0
                    }
                ]
            }
        }
    );

});


// =========================================================
// CREATE FEE STRUCTURE
// POST /admin/fees/add
// =========================================================

router.post('/add', auth, async (req, res) => {

    try {

        const {
            session,
            section,
            title,
            classRange,
            icon,
            annualApprox,
            priority,
            notes,
            published
        } = req.body;


        // =====================================================
        // NORMALIZE FEES
        // =====================================================

        let fees = req.body.fees || [];


        if (!Array.isArray(fees)) {

            fees = [fees];

        }


        fees = fees
            .map((fee) => {

                return {
                    name:
                        typeof fee.name === 'string'
                            ? fee.name.trim()
                            : '',

                    amount:
                        Number(fee.amount) || 0
                };

            })
            .filter(
                (fee) => fee.name !== ''
            );


        // =====================================================
        // VALIDATION
        // =====================================================

        if (!session || !session.trim()) {

            return res.status(400).render(
                'admin/fees/add',
                {
                    title: 'Add Fee Structure',

                    active: 'fees',

                    error:
                        'Academic session is required.',

                    formData: req.body
                }
            );

        }


        if (!section) {

            return res.status(400).render(
                'admin/fees/add',
                {
                    title: 'Add Fee Structure',

                    active: 'fees',

                    error:
                        'Please select a section.',

                    formData: req.body
                }
            );

        }


        if (!title || !title.trim()) {

            return res.status(400).render(
                'admin/fees/add',
                {
                    title: 'Add Fee Structure',

                    active: 'fees',

                    error:
                        'Fee structure title is required.',

                    formData: req.body
                }
            );

        }


        if (
            !classRange ||
            !classRange.trim()
        ) {

            return res.status(400).render(
                'admin/fees/add',
                {
                    title: 'Add Fee Structure',

                    active: 'fees',

                    error:
                        'Class range is required.',

                    formData: req.body
                }
            );

        }


        // =====================================================
        // CREATE
        // =====================================================

        const feeStructure =
            new FeeStructure({

                session:
                    session.trim(),

                section,

                title:
                    title.trim(),

                classRange:
                    classRange.trim(),

                icon:
                    icon && icon.trim()
                        ? icon.trim()
                        : 'fas fa-graduation-cap',

                fees,

                annualApprox:
                    Number(annualApprox) || 0,

                published:
                    published === 'on' ||
                    published === 'true' ||
                    published === true,

                priority:
                    Number(priority) || 0,

                notes:
                    notes
                        ? notes.trim()
                        : ''

            });


        await feeStructure.save();


        return res.redirect(
            '/admin/fees'
        );


    } catch (error) {

        console.error(
            '❌ Error creating fee structure:',
            error
        );


        return res.status(500).render(
            'admin/fees/add',
            {
                title: 'Add Fee Structure',

                active: 'fees',

                error:
                    'Unable to create fee structure. Please try again.',

                formData: req.body
            }
        );

    }

});


// =========================================================
// EDIT FEE STRUCTURE PAGE
// GET /admin/fees/edit/:id
// =========================================================

router.get(
    '/edit/:id',
    auth,
    async (req, res) => {

        try {

            const feeStructure =
                await FeeStructure.findById(
                    req.params.id
                ).lean();


            if (!feeStructure) {

                return res.status(404).send(
                    'Fee structure not found'
                );

            }


            return res.render(
                'admin/fees/edit',
                {
                    title:
                        'Edit Fee Structure',

                    active:
                        'fees',

                    error:
                        null,

                    feeStructure
                }
            );


        } catch (error) {

            console.error(
                '❌ Error loading fee edit page:',
                error
            );


            return res.status(500).send(
                'Error loading fee structure'
            );

        }

    }
);


// =========================================================
// UPDATE FEE STRUCTURE
// POST /admin/fees/edit/:id
// =========================================================

router.post(
    '/edit/:id',
    auth,
    async (req, res) => {

        try {

            const {
                session,
                section,
                title,
                classRange,
                icon,
                annualApprox,
                priority,
                notes,
                published
            } = req.body;


            // =================================================
            // NORMALIZE FEES
            // =================================================

            let fees =
                req.body.fees || [];


            if (!Array.isArray(fees)) {

                fees = [fees];

            }


            fees = fees
                .map((fee) => {

                    return {

                        name:
                            typeof fee.name === 'string'
                                ? fee.name.trim()
                                : '',

                        amount:
                            Number(fee.amount) || 0

                    };

                })
                .filter(
                    (fee) => fee.name !== ''
                );


            // =================================================
            // FIND EXISTING
            // =================================================

            const feeStructure =
                await FeeStructure.findById(
                    req.params.id
                );


            if (!feeStructure) {

                return res.status(404).send(
                    'Fee structure not found'
                );

            }


            // =================================================
            // VALIDATION
            // =================================================

            if (
                !session ||
                !session.trim()
            ) {

                return res.status(400).render(
                    'admin/fees/edit',
                    {
                        title:
                            'Edit Fee Structure',

                        active:
                            'fees',

                        error:
                            'Academic session is required.',

                        feeStructure:
                            req.body
                    }
                );

            }


            if (!section) {

                return res.status(400).render(
                    'admin/fees/edit',
                    {
                        title:
                            'Edit Fee Structure',

                        active:
                            'fees',

                        error:
                            'Please select a section.',

                        feeStructure:
                            req.body
                    }
                );

            }


            if (
                !title ||
                !title.trim()
            ) {

                return res.status(400).render(
                    'admin/fees/edit',
                    {
                        title:
                            'Edit Fee Structure',

                        active:
                            'fees',

                        error:
                            'Fee structure title is required.',

                        feeStructure:
                            req.body
                    }
                );

            }


            if (
                !classRange ||
                !classRange.trim()
            ) {

                return res.status(400).render(
                    'admin/fees/edit',
                    {
                        title:
                            'Edit Fee Structure',

                        active:
                            'fees',

                        error:
                            'Class range is required.',

                        feeStructure:
                            req.body
                    }
                );

            }


            // =================================================
            // UPDATE
            // =================================================

            feeStructure.session =
                session.trim();


            feeStructure.section =
                section;


            feeStructure.title =
                title.trim();


            feeStructure.classRange =
                classRange.trim();


            feeStructure.icon =
                icon && icon.trim()
                    ? icon.trim()
                    : 'fas fa-graduation-cap';


            feeStructure.fees =
                fees;


            feeStructure.annualApprox =
                Number(annualApprox) || 0;


            feeStructure.priority =
                Number(priority) || 0;


            feeStructure.notes =
                notes
                    ? notes.trim()
                    : '';


            feeStructure.published =
                published === 'on' ||
                published === 'true' ||
                published === true;


            await feeStructure.save();


            return res.redirect(
                '/admin/fees'
            );


        } catch (error) {

            console.error(
                '❌ Error updating fee structure:',
                error
            );


            return res.status(500).render(
                'admin/fees/edit',
                {
                    title:
                        'Edit Fee Structure',

                    active:
                        'fees',

                    error:
                        'Unable to update fee structure. Please try again.',

                    feeStructure:
                        req.body
                }
            );

        }

    }
);


// =========================================================
// DELETE FEE STRUCTURE
// POST /admin/fees/delete/:id
// =========================================================

router.post(
    '/delete/:id',
    auth,
    async (req, res) => {

        try {

            const feeStructure =
                await FeeStructure.findById(
                    req.params.id
                );


            if (!feeStructure) {

                return res.status(404).send(
                    'Fee structure not found'
                );

            }


            await FeeStructure.findByIdAndDelete(
                req.params.id
            );


            return res.redirect(
                '/admin/fees'
            );


        } catch (error) {

            console.error(
                '❌ Error deleting fee structure:',
                error
            );


            return res.status(500).send(
                'Unable to delete fee structure'
            );

        }

    }
);


// =========================================================
// TOGGLE PUBLISHED STATUS
// POST /admin/fees/toggle/:id
// =========================================================

router.post(
    '/toggle/:id',
    auth,
    async (req, res) => {

        try {

            const feeStructure =
                await FeeStructure.findById(
                    req.params.id
                );


            if (!feeStructure) {

                return res.status(404).send(
                    'Fee structure not found'
                );

            }


            feeStructure.published =
                !feeStructure.published;


            await feeStructure.save();


            return res.redirect(
                '/admin/fees'
            );


        } catch (error) {

            console.error(
                '❌ Error toggling fee status:',
                error
            );


            return res.status(500).send(
                'Unable to change fee status'
            );

        }

    }
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;