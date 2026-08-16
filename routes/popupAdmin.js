const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const validator = require("validator");
const csrf = require("csurf");
const fs = require("fs");
const Popup = require("../models/popup");
const auth = require("../middleware/auth");
const upload = require("../config/multerPopup");


// =========================================================
// CSRF PROTECTION
// =========================================================

const csrfProtection = csrf({
    cookie: {
        key: 'gj_popup_csrf',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    }
});


// =========================================================
// HELPER FUNCTIONS
// =========================================================

function cleanText(value, max = 200) {

    return validator.trim(
        String(value || "").slice(0, max)
    );

}


function isValidId(id) {

    return mongoose.Types.ObjectId.isValid(id);

}


function safeNumber(value, defaultValue = 0) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : defaultValue;

}


// =========================================================
// CHECKBOX HELPER
// =========================================================
//
// Popup forms use:
//
// hidden input  -> false
// checkbox      -> true
//
// Express can therefore receive either:
// "true"
// "false"
// or an array like ["false", "true"]
// =========================================================

function checkboxValue(value) {

    if (Array.isArray(value)) {

        return value.some(
            (item) =>
                item === true ||
                item === "true" ||
                item === "on" ||
                item === "1"
        );

    }

    return (
        value === true ||
        value === "true" ||
        value === "on" ||
        value === "1"
    );

}


// =========================================================
// MULTIPART CSRF PROTECTION
// =========================================================
//
// Multer parses multipart/form-data first so that
// req.body._csrf becomes available.
//
// If CSRF fails after an image was uploaded,
// remove that newly uploaded file.
// =========================================================

function multipartCsrf(req, res, next) {

    // multer has already parsed the multipart form, so req.body._csrf
    // is now available to csurf.
    return csrfProtection(
        req,
        res,
        function (err) {

            if (err) {

                if (
                    req.file &&
                    req.file.path
                ) {

                    fs.unlink(
                        req.file.path,
                        function () {}
                    );

                }

                console.error(
                    "❌ Popup CSRF validation failed:",
                    req.method,
                    req.originalUrl,
                    "bodyTokenPresent:",
                    Boolean(
                        req.body &&
                        req.body._csrf
                    ),
                    "csrfCookiePresent:",
                    Boolean(
                        req.cookies &&
                        req.cookies.gj_popup_csrf
                    )
                );

                return next(err);

            }

            return next();

        }
    );

}


// =========================================================
// POPUP LIST
// GET /admin/popup
// =========================================================

router.get(
    "/",
    auth,
    csrfProtection,
    async (req, res) => {

        try {

            const popups =
                await Popup.find()
                    .sort({
                        priority: 1,
                        createdAt: -1
                    })
                    .lean();


            console.log(
                "🔥 TOTAL POPUPS:",
                popups.length
            );


            // Generate CSRF token for the popup manager page.
            // This token is required by the Delete forms.
            const csrfToken =
                req.csrfToken();


            return res.render(
                "admin/popup/index",
                {
                    title: "Popup Manager",
                    popups,
                    csrfToken
                }
            );

        }

        catch (err) {

            console.error(
                "Popup list error:",
                err
            );

            return res.redirect(
                "/admin/dashboard"
            );

        }

    }
);


// =========================================================
// ADD POPUP PAGE
// GET /admin/popup/add
// =========================================================

router.get(
    "/add",
    auth,
    csrfProtection,
    (req, res) => {

        const csrfToken =
            req.csrfToken();


        return res.render(
            "admin/popup/add",
            {
                title: "Add Popup",
                active: "popup",
                csrfToken
            }
        );

    }
);


// =========================================================
// SAVE POPUP
// POST /admin/popup/add
// =========================================================

router.post(
    "/add",
    auth,
    upload.single("image"),
    multipartCsrf,
    async (req, res) => {

        try {

            // =================================================
            // CLEAN INPUT
            // =================================================

            const title =
                cleanText(
                    req.body.title,
                    100
                );


            const subtitle =
                cleanText(
                    req.body.subtitle,
                    300
                );


            const buttonText =
                cleanText(
                    req.body.buttonText,
                    50
                );


            const buttonLink =
                cleanText(
                    req.body.buttonLink,
                    300
                );


            const delay =
                safeNumber(
                    req.body.delay,
                    1500
                );


            const priority =
                safeNumber(
                    req.body.priority,
                    1
                );


            // =================================================
            // TITLE VALIDATION
            // =================================================

            if (!title) {

                return res.redirect(
                    "/admin/popup/add"
                );

            }


            // =================================================
            // BUTTON LINK VALIDATION
            // =================================================

            if (
                buttonLink &&
                !buttonLink.startsWith("/") &&
                !validator.isURL(
                    buttonLink,
                    {
                        protocols: [
                            "http",
                            "https"
                        ],
                        require_protocol: true
                    }
                )
            ) {

                return res.redirect(
                    "/admin/popup/add"
                );

            }


            // =================================================
            // DATE VALUES
            // =================================================

            const startDate =
                req.body.startDate
                    ? new Date(
                        req.body.startDate
                    )
                    : null;


            const endDate =
                req.body.endDate
                    ? new Date(
                        req.body.endDate
                    )
                    : null;


            if (
                startDate &&
                isNaN(
                    startDate.getTime()
                )
            ) {

                return res.redirect(
                    "/admin/popup/add"
                );

            }


            if (
                endDate &&
                isNaN(
                    endDate.getTime()
                )
            ) {

                return res.redirect(
                    "/admin/popup/add"
                );

            }


            if (
                startDate &&
                endDate &&
                endDate < startDate
            ) {

                return res.redirect(
                    "/admin/popup/add"
                );

            }


            // =================================================
            // CREATE POPUP
            // =================================================

            const popup =
                new Popup({

                    title,

                    subtitle,

                    image:
                        req.file
                            ? "/uploads/popups/" +
                              req.file.filename
                            : "",

                    buttonText,

                    buttonLink,


                    // FIX:
                    // Checkbox sends "true", not "on".
                    enabled:
                        checkboxValue(
                            req.body.enabled
                        ),


                    showOnce:
                        checkboxValue(
                            req.body.showOnce
                        ),


                    delay,

                    priority,

                    startDate,

                    endDate

                });


            await popup.save();


            return res.redirect(
                "/admin/popup"
            );

        }

        catch (err) {

            console.error(
                "Add popup error:",
                err
            );

            return res.redirect(
                "/admin/popup/add"
            );

        }

    }
);


// =========================================================
// EDIT POPUP PAGE
// GET /admin/popup/edit/:id
// =========================================================

router.get(
    "/edit/:id",
    auth,
    csrfProtection,
    async (req, res) => {

        try {

            // =================================================
            // VALIDATE ID
            // =================================================

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.status(400).send(
                    "Invalid popup ID"
                );

            }


            // =================================================
            // FIND POPUP
            // =================================================

            const popup =
                await Popup.findById(
                    req.params.id
                ).lean();


            if (!popup) {

                return res.status(404).send(
                    "Popup not found"
                );

            }


            const csrfToken =
                req.csrfToken();


            return res.render(
                "admin/popup/edit",
                {
                    title: "Edit Popup",
                    popup,
                    csrfToken
                }
            );

        }

        catch (err) {

            console.error(
                "Edit popup page error:",
                err
            );

            return res.redirect(
                "/admin/popup"
            );

        }

    }
);


// =========================================================
// UPDATE POPUP
// POST /admin/popup/edit/:id
// =========================================================

router.post(
    "/edit/:id",
    auth,
    upload.single("image"),
    multipartCsrf,
    async (req, res) => {

        try {

            // =================================================
            // VALIDATE ID
            // =================================================

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.redirect(
                    "/admin/popup"
                );

            }


            // =================================================
            // CLEAN INPUT
            // =================================================

            const title =
                cleanText(
                    req.body.title,
                    100
                );


            const subtitle =
                cleanText(
                    req.body.subtitle,
                    300
                );


            const buttonText =
                cleanText(
                    req.body.buttonText,
                    50
                );


            const buttonLink =
                cleanText(
                    req.body.buttonLink,
                    300
                );


            const delay =
                safeNumber(
                    req.body.delay,
                    1500
                );


            const priority =
                safeNumber(
                    req.body.priority,
                    1
                );


            // =================================================
            // TITLE VALIDATION
            // =================================================

            if (!title) {

                return res.redirect(
                    "/admin/popup"
                );

            }


            // =================================================
            // BUTTON LINK VALIDATION
            // =================================================

            if (
                buttonLink &&
                !buttonLink.startsWith("/") &&
                !validator.isURL(
                    buttonLink,
                    {
                        protocols: [
                            "http",
                            "https"
                        ],
                        require_protocol: true
                    }
                )
            ) {

                return res.redirect(
                    "/admin/popup"
                );

            }


            // =================================================
            // DATES
            // =================================================

            const startDate =
                req.body.startDate
                    ? new Date(
                        req.body.startDate
                    )
                    : null;


            const endDate =
                req.body.endDate
                    ? new Date(
                        req.body.endDate
                    )
                    : null;


            if (
                startDate &&
                isNaN(
                    startDate.getTime()
                )
            ) {

                return res.redirect(
                    "/admin/popup"
                );

            }


            if (
                endDate &&
                isNaN(
                    endDate.getTime()
                )
            ) {

                return res.redirect(
                    "/admin/popup"
                );

            }


            if (
                startDate &&
                endDate &&
                endDate < startDate
            ) {

                return res.redirect(
                    "/admin/popup"
                );

            }


            // =================================================
            // UPDATE DATA
            // =================================================

            const data = {

                title,

                subtitle,

                buttonText,

                buttonLink,


                // FIX:
                // Checkbox sends "true", not "on".
                enabled:
                    checkboxValue(
                        req.body.enabled
                    ),


                showOnce:
                    checkboxValue(
                        req.body.showOnce
                    ),


                delay,

                priority,

                startDate,

                endDate

            };


            // =================================================
            // NEW IMAGE
            // =================================================

            if (req.file) {

                data.image =
                    "/uploads/popups/" +
                    req.file.filename;

            }


            // =================================================
            // UPDATE
            // =================================================

            const updated =
                await Popup.findByIdAndUpdate(
                    req.params.id,
                    data,
                    {
                        new: true,
                        runValidators: true
                    }
                );


            if (!updated) {

                return res.status(404).send(
                    "Popup not found"
                );

            }


            return res.redirect(
                "/admin/popup"
            );

        }

        catch (err) {

            console.error(
                "Update popup error:",
                err
            );

            return res.redirect(
                "/admin/popup"
            );

        }

    }
);


// =========================================================
// DELETE POPUP
// POST /admin/popup/delete/:id
// =========================================================

router.post(
    "/delete/:id",
    auth,
    csrfProtection,
    async (req, res) => {

        try {

            // =================================================
            // VALIDATE ID
            // =================================================

            if (
                !isValidId(
                    req.params.id
                )
            ) {

                return res.redirect(
                    "/admin/popup"
                );

            }


            // =================================================
            // DELETE
            // =================================================

            const deleted =
                await Popup.findByIdAndDelete(
                    req.params.id
                );


            if (!deleted) {

                return res.status(404).send(
                    "Popup not found"
                );

            }


            return res.redirect(
                "/admin/popup"
            );

        }

        catch (err) {

            console.error(
                "Delete popup error:",
                err
            );

            return res.redirect(
                "/admin/popup"
            );

        }

    }
);


module.exports = router;