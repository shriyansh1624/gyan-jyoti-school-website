const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Send confirmation email to user
const sendContactConfirmation = async (email, name) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'We Received Your Message - Gyan Jyoti School',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #001f3f; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f5f5f5; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Thank You, ${name}!</h2>
          </div>
          <div class="content">
            <p>We have received your message and will get back to you soon.</p>
            <p><strong>School Contact:</strong></p>
            <p>Email: ${process.env.SCHOOL_EMAIL}</p>
            <p>Phone: ${process.env.SCHOOL_PHONE}</p>
            <p>Address: ${process.env.SCHOOL_ADDRESS}</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Gyan Jyoti School. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent to:', email);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
};

// Send notification email to admin
const sendAdminNotification = async (contactData) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `New Contact Form Submission - ${contactData.subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #001f3f; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f5f5f5; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #001f3f; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Submission</h2>
          </div>
          <div class="content">
            <div class="field">
              <span class="label">Name:</span> ${contactData.name}
            </div>
            <div class="field">
              <span class="label">Email:</span> ${contactData.email}
            </div>
            <div class="field">
              <span class="label">Phone:</span> ${contactData.phone}
            </div>
            <div class="field">
              <span class="label">Category:</span> ${contactData.category}
            </div>
            <div class="field">
              <span class="label">Subject:</span> ${contactData.subject}
            </div>
            <div class="field">
              <span class="label">Message:</span><br/>
              ${contactData.message}
            </div>
            <div class="field">
              <span class="label">Submitted:</span> ${new Date(contactData.createdAt).toLocaleString()}
            </div>
          </div>
          <div class="footer">
            <p><a href="http://localhost:3000/admin/dashboard">View in Dashboard</a></p>
            <p>&copy; 2026 Gyan Jyoti School. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('Admin notification email sent');
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};

module.exports = { sendContactConfirmation, sendAdminNotification };