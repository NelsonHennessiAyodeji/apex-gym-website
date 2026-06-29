const nodemailer = require("nodemailer");

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send contact form email
 * POST /contact
 */
const sendContactEmail = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and message are required.",
      });
    }

    // Subject mapping
    const subjectMap = {
      general: "General Inquiry",
      membership: "Membership Question",
      support: "Technical Support",
      feedback: "Feedback / Suggestion",
    };
    const subjectText = subjectMap[subject] || "General Inquiry";

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to the gym's email (could also be a support address)
      replyTo: email,
      subject: `Contact Form: ${subjectText}`,
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone || "Not provided"}
        Subject: ${subjectText}
        
        Message:
        ${message}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Subject:</strong> ${subjectText}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Your message has been sent. We'll get back to you soon.",
    });
  } catch (error) {
    console.error("Contact email error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send your message. Please try again later.",
    });
  }
};

module.exports = { sendContactEmail };