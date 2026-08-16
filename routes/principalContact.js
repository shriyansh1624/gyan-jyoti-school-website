const express = require('express');
const router = express.Router();
const validator = require('validator');
const nodemailer = require('nodemailer');

const PrincipalContact = require('../models/PrincipalContact');


// ============================================================
// EMAIL CONFIG
// ============================================================

const PRINCIPAL_EMAIL = process.env.PRINCIPAL_EMAIL;

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;


// ============================================================
// EMAIL TRANSPORTER
// ============================================================

let emailTransporter = null;

if (
  EMAIL_USER &&
  EMAIL_PASS &&
  PRINCIPAL_EMAIL
) {
  emailTransporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,

    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
}


// ============================================================
// HELPERS
// ============================================================

function cleanText(value, max = 300) {
  return validator.escape(
    validator.trim(
      String(value || '').slice(0, max)
    )
  );
}


function cleanPhone(value) {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, 10);
}


// ============================================================
// PRINCIPAL EMAIL NOTIFICATION
// ============================================================

async function sendPrincipalEmailNotification(
  principalMessage
) {

  if (!emailTransporter) {
    throw new Error(
      'Email notification is not configured'
    );
  }


  const mailOptions = {

    from: `"School Website" <${EMAIL_USER}>`,

    to: PRINCIPAL_EMAIL,

    replyTo: principalMessage.email,

    subject:
      `🔔 New Principal Contact - ${principalMessage.subject}`,

    text: `
New Principal Contact Received

Visitor Name:
${principalMessage.name}

Phone:
${principalMessage.phone}

Email:
${principalMessage.email}

Subject:
${principalMessage.subject}

Message:
${principalMessage.message}

------------------------------------
Please check the Principal Messages
section in the school admin panel.
------------------------------------
`,

    html: `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>New Principal Contact</title>

</head>

<body style="
margin:0;
padding:0;
background:#f4f7fb;
font-family:Arial,Helvetica,sans-serif;
">

<div style="
max-width:650px;
margin:30px auto;
background:#ffffff;
border-radius:18px;
overflow:hidden;
box-shadow:0 10px 35px rgba(0,0,0,0.08);
">

<!-- HEADER -->

<div style="
background:linear-gradient(135deg,#172554,#2563eb);
padding:30px;
color:white;
">

<h1 style="
margin:0;
font-size:25px;
">

🔔 New Principal Contact

</h1>

<p style="
margin:8px 0 0;
opacity:.9;
font-size:14px;
">

A new message has been submitted through the school website.

</p>

</div>


<!-- CONTENT -->

<div style="
padding:30px;
">

<table style="
width:100%;
border-collapse:collapse;
">

<tr>

<td style="
padding:12px 0;
font-weight:bold;
width:140px;
">

Visitor

</td>

<td style="
padding:12px 0;
">

${principalMessage.name}

</td>

</tr>


<tr>

<td style="
padding:12px 0;
font-weight:bold;
">

Phone

</td>

<td style="
padding:12px 0;
">

<a
href="tel:${principalMessage.phone}"
style="color:#2563eb;text-decoration:none;"
>

${principalMessage.phone}

</a>

</td>

</tr>


<tr>

<td style="
padding:12px 0;
font-weight:bold;
">

Email

</td>

<td style="
padding:12px 0;
">

<a
href="mailto:${principalMessage.email}"
style="color:#2563eb;text-decoration:none;"
>

${principalMessage.email}

</a>

</td>

</tr>


<tr>

<td style="
padding:12px 0;
font-weight:bold;
">

Subject

</td>

<td style="
padding:12px 0;
">

${principalMessage.subject}

</td>

</tr>

</table>


<div style="
margin-top:25px;
padding:20px;
background:#f8fafc;
border-radius:12px;
border-left:4px solid #2563eb;
">

<div style="
font-weight:bold;
margin-bottom:10px;
">

Message

</div>

<div style="
line-height:1.7;
color:#334155;
">

${principalMessage.message}

</div>

</div>


<div style="
margin-top:25px;
text-align:center;
">

<a
href="#"
style="
display:inline-block;
padding:12px 22px;
background:#2563eb;
color:white;
text-decoration:none;
border-radius:10px;
font-weight:bold;
"
>

Check Admin Panel

</a>

</div>

</div>


<!-- FOOTER -->

<div style="
padding:18px 30px;
background:#f8fafc;
font-size:12px;
color:#64748b;
text-align:center;
">

This is an automatic notification from the school website.

</div>

</div>

</body>

</html>
`
  };


  const mailResult =
    await emailTransporter.sendMail(
      mailOptions
    );


  return mailResult;

}


// ============================================================
// GET PRINCIPAL CONTACT PAGE
// ============================================================

router.get('/', async (req, res) => {

  try {

    return res.render(
      'about/principal',
      {
        title: 'Contact Principal',

        success:
          req.query.success === 'true',

        error:
          req.query.error === 'true'
      }
    );

  } catch (err) {

    console.log(
      'Principal Contact Page Error:',
      err.message
    );

    return res
      .status(500)
      .send(
        'Unable to load principal contact page.'
      );
  }

});


// ============================================================
// SUBMIT PRINCIPAL CONTACT FORM
// ============================================================

router.post('/', async (req, res) => {

  try {

    // --------------------------------------------------------
    // CLEAN INPUT
    // --------------------------------------------------------

    const name =
      cleanText(
        req.body.name,
        60
      );


    const email =
      validator.normalizeEmail(
        String(
          req.body.email || ''
        )
      ) || '';


    const phone =
      cleanPhone(
        req.body.phone
      );


    const subject =
      cleanText(
        req.body.subject,
        120
      );


    const message =
      cleanText(
        req.body.message,
        1000
      );


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (
      !/^[A-Za-z\s.]{3,60}$/.test(name)
    ) {

      return res.redirect(
        '/principal-contact?error=true'
      );

    }


    if (
      !validator.isEmail(email)
    ) {

      return res.redirect(
        '/principal-contact?error=true'
      );

    }


    if (
      !/^[0-9]{10}$/.test(phone)
    ) {

      return res.redirect(
        '/principal-contact?error=true'
      );

    }


    if (
      !subject ||
      message.length < 5
    ) {

      return res.redirect(
        '/principal-contact?error=true'
      );

    }


    // --------------------------------------------------------
    // SAVE TO MONGODB FIRST
    // --------------------------------------------------------

    const principalMessage =
      await PrincipalContact.create({

        name,

        email,

        phone,

        subject,

        message,

        status: 'new',

        notificationStatus: 'pending'

      });


    console.log(
      '✅ PRINCIPAL CONTACT SAVED:',
      principalMessage._id
    );


    // --------------------------------------------------------
    // SEND EMAIL NOTIFICATION
    // --------------------------------------------------------

    try {

      const emailResult =
        await sendPrincipalEmailNotification(
          principalMessage
        );


      // ------------------------------------------------------
      // UPDATE NOTIFICATION STATUS
      // ------------------------------------------------------

      await PrincipalContact.findByIdAndUpdate(

        principalMessage._id,

        {

          notificationStatus: 'sent',

          notificationMessageId:
            emailResult.messageId,

          notificationSentAt:
            new Date(),

          updatedAt:
            new Date()

        }

      );


      console.log(
        '✅ PRINCIPAL EMAIL SENT:',
        emailResult.messageId
      );


    } catch (notificationError) {

      // ------------------------------------------------------
      // EMAIL FAILED
      // ------------------------------------------------------

      console.error(
        '❌ PRINCIPAL EMAIL FAILED:',
        notificationError.message
      );


      await PrincipalContact.findByIdAndUpdate(

        principalMessage._id,

        {

          notificationStatus: 'failed',

          notificationError:
            String(
              notificationError.message
            ).slice(0, 500),

          updatedAt:
            new Date()

        }

      );

    }


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return res.redirect(
      '/principal-contact?success=true'
    );


  } catch (err) {

    console.error(
      '❌ Principal Contact Error:',
      err.message
    );


    return res.redirect(
      '/principal-contact?error=true'
    );

  }

});


module.exports = router;