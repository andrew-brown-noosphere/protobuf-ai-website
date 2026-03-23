const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_FORWARD_TO = process.env.CONTACT_FORWARD_TO || 'andrew@voyant.io';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, name, message } = req.body || {};

    if (!email || !name || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const payload = {
      from: 'protobuf.ai Contact <contact@protobuf.ai>',
      to: CONTACT_FORWARD_TO,
      reply_to: email,
      subject: `protobuf.ai Contact: ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
      `,
      text: `New Contact Form Submission

Name: ${name}
Email: ${email}

Message:
${message}

Submitted at: ${new Date().toLocaleString()}`
    };

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', emailResponse.status, errorText);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Contact handler error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
};
