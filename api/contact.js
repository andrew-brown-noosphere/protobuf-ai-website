const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_FORWARD_TO = process.env.CONTACT_FORWARD_TO || 'connect@protobuf.ai';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, name, company, role, useCase, message } = req.body || {};

    if (!email || !name || !useCase) {
      return res.status(400).json({ error: 'Name, email, and use case are required' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const companyInfo = company ? `${company}${role ? ` (${role})` : ''}` : (role || 'Not specified');

    const payload = {
      from: 'protobuf.ai <contact@protobuf.ai>',
      to: CONTACT_FORWARD_TO,
      reply_to: email,
      subject: `[protobuf.ai] ${name}${company ? ` from ${company}` : ''}`,
      html: `
        <h2>New Developer Inquiry</h2>
        <table style="border-collapse: collapse; margin: 1rem 0;">
          <tr><td style="padding: 0.5rem 1rem 0.5rem 0; font-weight: bold; vertical-align: top;">Name:</td><td style="padding: 0.5rem 0;">${name}</td></tr>
          <tr><td style="padding: 0.5rem 1rem 0.5rem 0; font-weight: bold; vertical-align: top;">Email:</td><td style="padding: 0.5rem 0;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding: 0.5rem 1rem 0.5rem 0; font-weight: bold; vertical-align: top;">Company/Role:</td><td style="padding: 0.5rem 0;">${companyInfo}</td></tr>
        </table>

        <h3 style="margin-top: 1.5rem;">What they're working on:</h3>
        <p style="background: #f5f5f5; padding: 1rem; border-radius: 4px;">${useCase.replace(/\n/g, '<br>')}</p>

        ${message ? `
        <h3 style="margin-top: 1.5rem;">Additional comments:</h3>
        <p style="background: #f5f5f5; padding: 1rem; border-radius: 4px;">${message.replace(/\n/g, '<br>')}</p>
        ` : ''}

        <hr style="margin-top: 2rem; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 0.875rem;">Submitted: ${new Date().toLocaleString()}</p>
      `,
      text: `New Developer Inquiry

Name: ${name}
Email: ${email}
Company/Role: ${companyInfo}

What they're working on:
${useCase}

${message ? `Additional comments:\n${message}\n` : ''}
---
Submitted: ${new Date().toLocaleString()}`
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
