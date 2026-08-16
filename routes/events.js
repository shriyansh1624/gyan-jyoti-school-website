const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const Event = require('../models/Event');
const SchoolInfo = require('../models/SchoolInfo');


// =========================================================
// HELPERS
// =========================================================

async function getSchoolInfo() {
    return await SchoolInfo.findOne().lean();
}


function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}


// =========================================================
// RENDER EVENT DETAILS
// =========================================================

async function renderEventDetails(req, res, eventId) {

    try {

        // -------------------------------------------------
        // VALIDATE ID
        // -------------------------------------------------

        if (!isValidObjectId(eventId)) {

            return res.status(404).send(
                'Event not found'
            );

        }


        // -------------------------------------------------
        // FIND PUBLISHED EVENT
        // -------------------------------------------------

        const event = await Event.findOne({

            _id: eventId,

            published: true

        }).lean();


        if (!event) {

            return res.status(404).send(
                'Event not found'
            );

        }


        // -------------------------------------------------
        // SCHOOL INFO
        // -------------------------------------------------

        const schoolInfo =
            await getSchoolInfo();


        // -------------------------------------------------
        // DETAILS PAGE
        // -------------------------------------------------

        return res.render(
            'events/details',
            {

                event,

                schoolInfo,

                title:
                    event.title,

                active:
                    'events'

            }
        );

    } catch (error) {

        console.error(
            '❌ Error loading event details:',
            error
        );

        return res.status(500).send(
            'Error loading event'
        );

    }

}


// =========================================================
// DEFAULT EVENTS
// GET /events
// =========================================================

router.get('/', (req, res) => {

    return res.redirect(
        '/events/fun-fiesta'
    );

});


// =========================================================
// FUN & FIESTA
// GET /events/fun-fiesta
// =========================================================

router.get(
    '/fun-fiesta',
    async (req, res) => {

        try {

            const events =
                await Event.find({

                    category:
                        'fun-fiesta',

                    published:
                        true

                })
                .sort({

                    priority: 1,

                    date: -1

                })
                .lean();


            const schoolInfo =
                await getSchoolInfo();


            return res.render(
                'events/fun-fiesta',
                {

                    events,

                    schoolInfo,

                    title:
                        'Fun & Fiesta',

                    active:
                        'events'

                }
            );

        } catch (error) {

            console.error(
                '❌ Error loading Fun & Fiesta:',
                error
            );

            return res.status(500).send(
                'Error loading Fun & Fiesta'
            );

        }

    }
);


// =========================================================
// SPORTS
// GET /events/sports
// =========================================================

router.get(
    '/sports',
    async (req, res) => {

        try {

            const events =
                await Event.find({

                    category:
                        'sports',

                    published:
                        true

                })
                .sort({

                    priority: 1,

                    date: -1

                })
                .lean();


            const schoolInfo =
                await getSchoolInfo();


            return res.render(
                'events/sports',
                {

                    events,

                    schoolInfo,

                    title:
                        'Sports',

                    active:
                        'events'

                }
            );

        } catch (error) {

            console.error(
                '❌ Error loading Sports:',
                error
            );

            return res.status(500).send(
                'Error loading Sports'
            );

        }

    }
);


// =========================================================
// NATIONAL CELEBRATIONS
// GET /events/national-days
// =========================================================

router.get(
    '/national-days',
    async (req, res) => {

        try {

            const events =
                await Event.find({

                    category: {

                        $in: [

                            'republic-day',

                            'independence-day',

                            'national-celebration'

                        ]

                    },

                    published:
                        true

                })
                .sort({

                    priority: 1,

                    date: -1

                })
                .lean();


            const schoolInfo =
                await getSchoolInfo();


            return res.render(
                'events/national-days',
                {

                    events,

                    schoolInfo,

                    title:
                        'National Celebrations',

                    active:
                        'events'

                }
            );

        } catch (error) {

            console.error(
                '❌ Error loading National Celebrations:',
                error
            );

            return res.status(500).send(
                'Error loading National Celebrations'
            );

        }

    }
);


// =========================================================
// OLD MEMORIES
// GET /events/old-memories
// =========================================================

router.get(
    '/old-memories',
    async (req, res) => {

        try {

            const events =
                await Event.find({

                    category:
                        'old-memory',

                    published:
                        true

                })
                .sort({

                    priority: 1,

                    date: -1

                })
                .lean();


            const schoolInfo =
                await getSchoolInfo();


            return res.render(
                'events/old-memories',
                {

                    events,

                    schoolInfo,

                    title:
                        'Old Memories',

                    active:
                        'events'

                }
            );

        } catch (error) {

            console.error(
                '❌ Error loading Old Memories:',
                error
            );

            return res.status(500).send(
                'Error loading Old Memories'
            );

        }

    }
);


// =========================================================
// GALLERY
// GET /gallery
// =========================================================
//
// Opens the latest published event.
//
// /gallery
//      ↓
// latest published event
//      ↓
// events/details.ejs
//
// =========================================================

router.get(
    '/gallery',
    async (req, res) => {

        try {

            const event =
                await Event.findOne({

                    published:
                        true

                })
                .sort({

                    priority: 1,

                    date: -1,

                    createdAt: -1

                })
                .lean();


            if (!event) {

                return res.status(404).send(
                    'No published events found'
                );

            }


            const schoolInfo =
                await getSchoolInfo();


            return res.render(
                'events/details',
                {

                    event,

                    schoolInfo,

                    title:
                        event.title,

                    active:
                        'events'

                }
            );

        } catch (error) {

            console.error(
                '❌ Error loading Gallery:',
                error
            );

            return res.status(500).send(
                'Error loading Gallery'
            );

        }

    }
);


// =========================================================
// SPECIFIC EVENT GALLERY
// GET /gallery/:id
// =========================================================
//
// Example:
//
// /gallery/665f123456789
//
//      ↓
//
// events/details.ejs
//
// =========================================================

router.get(
    '/gallery/:id',
    async (req, res) => {

        return renderEventDetails(
            req,
            res,
            req.params.id
        );

    }
);


// =========================================================
// SINGLE EVENT DETAILS
// GET /events/event/:id
// =========================================================
//
// Existing URL preserved.
//
// /events/event/:id
//      ↓
// events/details.ejs
//
// =========================================================

router.get(
    '/event/:id',
    async (req, res) => {

        return renderEventDetails(
            req,
            res,
            req.params.id
        );

    }
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;