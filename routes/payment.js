const express = require('express');
const crypto = require('crypto');

const router = express.Router();

const Payment = require('../models/Payment');
const Admission = require('../models/Admission');
const Enquiry = require('../models/Enquiry');


// =========================================================
// RAZORPAY CONFIGURATION
// =========================================================
//
// Later add these to .env:
//
// RAZORPAY_KEY_ID=your_key_id
// RAZORPAY_KEY_SECRET=your_key_secret
//
// Do NOT put the secret inside EJS/frontend code.
//
// =========================================================

const RAZORPAY_KEY_ID =
    process.env.RAZORPAY_KEY_ID || '';

const RAZORPAY_KEY_SECRET =
    process.env.RAZORPAY_KEY_SECRET || '';


// =========================================================
// HELPER
// =========================================================

function isValidObjectId(id) {

    return /^[a-fA-F0-9]{24}$/.test(
        String(id || '')
    );

}


// =========================================================
// GET PAYMENT DETAILS
//
// GET /payment/:paymentId
//
// This route can be used later for payment status checking.
// =========================================================

router.get(
    '/:paymentId',
    async (req, res) => {

        try {

            const paymentId =
                req.params.paymentId;


            if (
                !isValidObjectId(
                    paymentId
                )
            ) {

                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        'Invalid payment ID.'

                });

            }


            const payment =
                await Payment
                    .findById(
                        paymentId
                    )
                    .populate(
                        'admission'
                    )
                    .populate(
                        'enquiry'
                    )
                    .lean();


            if (!payment) {

                return res.status(
                    404
                ).json({

                    success: false,

                    message:
                        'Payment not found.'

                });

            }


            return res.json({

                success: true,

                payment: {

                    id:
                        payment._id,

                    type:
                        payment.type,

                    amount:
                        payment.amount,

                    currency:
                        payment.currency,

                    status:
                        payment.status,

                    method:
                        payment.method,

                    orderId:
                        payment.orderId,

                    transactionId:
                        payment.transactionId

                }

            });


        } catch (err) {

            console.error(
                'Get Payment Error:',
                err.message
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    'Unable to fetch payment.'

            });

        }

    }
);


// =========================================================
// CREATE RAZORPAY ORDER
//
// POST /payment/create-order
//
// Body:
//
// {
//     "paymentId": "Mongo Payment ID"
// }
//
// =========================================================

router.post(
    '/create-order',
    async (req, res) => {

        try {

            // -------------------------------------------------
            // CHECK RAZORPAY CONFIG
            // -------------------------------------------------

            if (
                !RAZORPAY_KEY_ID ||
                !RAZORPAY_KEY_SECRET
            ) {

                return res.status(
                    503
                ).json({

                    success: false,

                    configured: false,

                    message:
                        'Online payment gateway is not configured yet.'

                });

            }


            // -------------------------------------------------
            // PAYMENT ID
            // -------------------------------------------------

            const paymentId =
                String(
                    req.body.paymentId || ''
                );


            if (
                !isValidObjectId(
                    paymentId
                )
            ) {

                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        'Invalid payment ID.'

                });

            }


            // -------------------------------------------------
            // FIND PAYMENT
            // -------------------------------------------------

            const payment =
                await Payment.findById(
                    paymentId
                );


            if (!payment) {

                return res.status(
                    404
                ).json({

                    success: false,

                    message:
                        'Payment record not found.'

                });

            }


            // -------------------------------------------------
            // PAYMENT MUST BE PENDING
            // -------------------------------------------------

            if (
                payment.status !==
                'pending'
            ) {

                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        `Payment is already ${payment.status}.`

                });

            }


            // -------------------------------------------------
            // PREVENT DUPLICATE ORDER
            // -------------------------------------------------

            if (
                payment.orderId
            ) {

                return res.json({

                    success: true,

                    alreadyCreated: true,

                    keyId:
                        RAZORPAY_KEY_ID,

                    orderId:
                        payment.orderId,

                    amount:
                        Math.round(
                            payment.amount * 100
                        ),

                    currency:
                        payment.currency

                });

            }


            // -------------------------------------------------
            // AMOUNT
            //
            // Razorpay expects amount in paise.
            //
            // Example:
            // ₹500 = 50000 paise
            // -------------------------------------------------

            const amountInPaise =
                Math.round(
                    Number(
                        payment.amount
                    ) * 100
                );


            if (
                !Number.isFinite(
                    amountInPaise
                ) ||
                amountInPaise <= 0
            ) {

                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        'Invalid payment amount.'

                });

            }


            // -------------------------------------------------
            // CREATE RAZORPAY ORDER
            // -------------------------------------------------

            const auth =
                Buffer
                    .from(
                        `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
                    )
                    .toString(
                        'base64'
                    );


            const razorpayResponse =
                await fetch(
                    'https://api.razorpay.com/v1/orders',
                    {

                        method:
                            'POST',

                        headers: {

                            'Authorization':
                                `Basic ${auth}`,

                            'Content-Type':
                                'application/json'

                        },

                        body:
                            JSON.stringify({

                                amount:
                                    amountInPaise,

                                currency:
                                    payment.currency ||
                                    'INR',

                                receipt:
                                    `GJ-${payment._id}`,

                                notes: {

                                    paymentId:
                                        String(
                                            payment._id
                                        ),

                                    type:
                                        payment.type

                                }

                            })

                    }
                );


            const razorpayData =
                await razorpayResponse.json();


            // -------------------------------------------------
            // RAZORPAY ORDER ERROR
            // -------------------------------------------------

            if (
                !razorpayResponse.ok
            ) {

                console.error(
                    'Razorpay Order Error:',
                    razorpayData
                );


                return res.status(
                    502
                ).json({

                    success: false,

                    message:
                        'Unable to create payment order.'

                });

            }


            // -------------------------------------------------
            // SAVE ORDER ID
            // -------------------------------------------------

            payment.orderId =
                razorpayData.id;

            payment.gateway =
                'razorpay';

            payment.method =
                'online';


            await payment.save();


            // -------------------------------------------------
            // RESPONSE TO FRONTEND
            // -------------------------------------------------

            return res.json({

                success: true,

                configured: true,

                keyId:
                    RAZORPAY_KEY_ID,

                orderId:
                    razorpayData.id,

                amount:
                    razorpayData.amount,

                currency:
                    razorpayData.currency,

                paymentId:
                    payment._id

            });


        } catch (err) {

            console.error(
                'Create Razorpay Order Error:',
                err.message
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    'Unable to create payment order.'

            });

        }

    }
);


// =========================================================
// VERIFY RAZORPAY PAYMENT
//
// POST /payment/verify
//
// Body:
//
// {
//     paymentId,
//     razorpay_order_id,
//     razorpay_payment_id,
//     razorpay_signature
// }
//
// =========================================================

router.post(
    '/verify',
    async (req, res) => {

        try {

            // -------------------------------------------------
            // CHECK SECRET
            // -------------------------------------------------

            if (
                !RAZORPAY_KEY_SECRET
            ) {

                return res.status(
                    503
                ).json({

                    success: false,

                    message:
                        'Payment gateway is not configured.'

                });

            }


            // -------------------------------------------------
            // INPUT
            // -------------------------------------------------

            const paymentId =
                String(
                    req.body.paymentId || ''
                );


            const razorpayOrderId =
                String(
                    req.body.razorpay_order_id || ''
                );


            const razorpayPaymentId =
                String(
                    req.body.razorpay_payment_id || ''
                );


            const razorpaySignature =
                String(
                    req.body.razorpay_signature || ''
                );


            // -------------------------------------------------
            // BASIC VALIDATION
            // -------------------------------------------------

            if (
                !isValidObjectId(
                    paymentId
                ) ||

                !razorpayOrderId ||

                !razorpayPaymentId ||

                !razorpaySignature
            ) {

                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        'Incomplete payment verification data.'

                });

            }


            // -------------------------------------------------
            // FIND PAYMENT
            // -------------------------------------------------

            const payment =
                await Payment.findById(
                    paymentId
                );


            if (!payment) {

                return res.status(
                    404
                ).json({

                    success: false,

                    message:
                        'Payment record not found.'

                });

            }


            // -------------------------------------------------
            // VERIFY ORDER ID
            // -------------------------------------------------

            if (
                payment.orderId !==
                razorpayOrderId
            ) {

                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        'Payment order mismatch.'

                });

            }


            // -------------------------------------------------
            // GENERATE EXPECTED SIGNATURE
            // -------------------------------------------------

            const generatedSignature =
                crypto
                    .createHmac(
                        'sha256',
                        RAZORPAY_KEY_SECRET
                    )
                    .update(
                        `${razorpayOrderId}|${razorpayPaymentId}`
                    )
                    .digest(
                        'hex'
                    );


            // -------------------------------------------------
            // TIMING SAFE COMPARISON
            // -------------------------------------------------

            const signatureValid =
                generatedSignature.length ===
                    razorpaySignature.length
                    &&

                crypto.timingSafeEqual(

                    Buffer.from(
                        generatedSignature
                    ),

                    Buffer.from(
                        razorpaySignature
                    )

                );


            if (!signatureValid) {

                payment.status =
                    'failed';

                payment.transactionId =
                    razorpayPaymentId;

                payment.gateway =
                    'razorpay';

                payment.notes =
                    'Payment signature verification failed.';


                await payment.save();


                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        'Payment verification failed.'

                });

            }


            // -------------------------------------------------
            // PAYMENT VERIFIED
            // -------------------------------------------------

            payment.status =
                'paid';

            payment.transactionId =
                razorpayPaymentId;

            payment.gateway =
                'razorpay';

            payment.paidAt =
                new Date();


            await payment.save();


            // -------------------------------------------------
            // UPDATE ADMISSION
            // -------------------------------------------------

            if (
                payment.type ===
                'admission'
                &&
                payment.admission
            ) {

                await Admission.findByIdAndUpdate(

                    payment.admission,

                    {

                        paymentStatus:
                            'paid',

                        paymentMethod:
                            'online',

                        paymentAmount:
                            payment.amount,

                        payment:
                            payment._id

                    }

                );

            }


            // -------------------------------------------------
            // UPDATE ENQUIRY
            // -------------------------------------------------

            if (
                payment.type ===
                'enquiry'
                &&
                payment.enquiry
            ) {

                await Enquiry.findByIdAndUpdate(

                    payment.enquiry,

                    {

                        paymentStatus:
                            'paid',

                        paymentMethod:
                            'online',

                        paymentAmount:
                            payment.amount,

                        payment:
                            payment._id

                    }

                );

            }


            // -------------------------------------------------
            // SUCCESS RESPONSE
            // -------------------------------------------------

            return res.json({

                success: true,

                message:
                    'Payment verified successfully.',

                paymentId:
                    payment._id,

                transactionId:
                    payment.transactionId

            });


        } catch (err) {

            console.error(
                'Payment Verification Error:',
                err.message
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    'Payment verification failed.'

            });

        }

    }
);


// =========================================================
// PAYMENT FAILED
//
// POST /payment/failed
//
// This is called from frontend if checkout reports failure.
// =========================================================

router.post(
    '/failed',
    async (req, res) => {

        try {

            const paymentId =
                String(
                    req.body.paymentId || ''
                );


            if (
                !isValidObjectId(
                    paymentId
                )
            ) {

                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        'Invalid payment ID.'

                });

            }


            const payment =
                await Payment.findById(
                    paymentId
                );


            if (!payment) {

                return res.status(
                    404
                ).json({

                    success: false,

                    message:
                        'Payment not found.'

                });

            }


            // -------------------------------------------------
            // NEVER CHANGE PAID TO FAILED
            // -------------------------------------------------

            if (
                payment.status ===
                'paid'
            ) {

                return res.json({

                    success: true,

                    message:
                        'Payment is already successful.'

                });

            }


            payment.status =
                'failed';


            payment.gateway =
                'razorpay';


            payment.notes =
                'Payment failed during checkout.';


            await payment.save();


            return res.json({

                success: true,

                message:
                    'Payment marked as failed.'

            });


        } catch (err) {

            console.error(
                'Payment Failed Route Error:',
                err.message
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    'Unable to update payment status.'

            });

        }

    }
);


// =========================================================
// PAYMENT CANCEL
//
// POST /payment/cancel
// =========================================================

router.post(
    '/cancel',
    async (req, res) => {

        try {

            const paymentId =
                String(
                    req.body.paymentId || ''
                );


            if (
                !isValidObjectId(
                    paymentId
                )
            ) {

                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        'Invalid payment ID.'

                });

            }


            const payment =
                await Payment.findById(
                    paymentId
                );


            if (!payment) {

                return res.status(
                    404
                ).json({

                    success: false,

                    message:
                        'Payment not found.'

                });

            }


            // -------------------------------------------------
            // PAID PAYMENT CANNOT BE CANCELLED
            // -------------------------------------------------

            if (
                payment.status ===
                'paid'
            ) {

                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        'A successful payment cannot be cancelled.'

                });

            }


            payment.status =
                'cancelled';


            payment.notes =
                'Payment cancelled by applicant.';


            await payment.save();


            // -------------------------------------------------
            // UPDATE RELATED APPLICATION
            // -------------------------------------------------

            if (
                payment.type ===
                'admission'
                &&
                payment.admission
            ) {

                await Admission.findByIdAndUpdate(

                    payment.admission,

                    {

                        paymentStatus:
                            'cancelled'

                    }

                );

            }


            if (
                payment.type ===
                'enquiry'
                &&
                payment.enquiry
            ) {

                await Enquiry.findByIdAndUpdate(

                    payment.enquiry,

                    {

                        paymentStatus:
                            'cancelled'

                    }

                );

            }


            return res.json({

                success: true,

                message:
                    'Payment cancelled successfully.'

            });


        } catch (err) {

            console.error(
                'Payment Cancel Error:',
                err.message
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    'Unable to cancel payment.'

            });

        }

    }
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;