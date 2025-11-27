const normalizeAddress = (entry) => {
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  const { email, name } = entry;
  if (email && name) return `${name} <${email}>`;
  if (email) return email;
  if (name) return name;
  return null;
};

const normalizeAddressList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(normalizeAddress).filter(Boolean);
  }
  const normalized = normalizeAddress(value);
  return normalized ? [normalized] : [];
};

const escapeHtml = (value = '') =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const buildHtmlBody = (email) => {
  const subject = email.subject || '(no subject)';
  const from = normalizeAddressList(email.from)[0] || 'unknown sender';
  const toList = normalizeAddressList(email.to);
  const ccList = normalizeAddressList(email.cc);

  const intro = [
    `<p><strong>From:</strong> ${escapeHtml(from)}</p>`,
    `<p><strong>To:</strong> ${escapeHtml(toList.join(', ') || 'unspecified recipient')}</p>`,
    ccList.length ? `<p><strong>CC:</strong> ${escapeHtml(ccList.join(', '))}</p>` : '',
    `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>`,
    '<hr>'
  ].filter(Boolean);

  if (email.html) {
    return intro.concat(email.html).join('\n');
  }

  return intro
    .concat(
      `<pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(email.text || '(no message body)')}</pre>`
    )
    .join('\n');
};

const buildTextBody = (email) => {
  const subject = email.subject || '(no subject)';
  const from = normalizeAddressList(email.from)[0] || 'unknown sender';
  const toList = normalizeAddressList(email.to);
  const ccList = normalizeAddressList(email.cc);

  const textParts = [
    `From: ${from}`,
    `To: ${toList.join(', ') || 'unspecified recipient'}`,
    ccList.length ? `CC: ${ccList.join(', ')}` : '',
    `Subject: ${subject}`,
    '',
    email.text || (email.html ? email.html.replace(/<[^>]+>/g, '') : '')
  ];

  return textParts.filter(Boolean).join('\n');
};

const forwardInboundEmail = async (email, recipients) => {
  if (!process.env.RESEND_API_KEY || recipients.length === 0) {
    return;
  }

  const subject = email.subject || '(no subject)';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'protobuf.ai Inbound <noreply@protobuf.ai>',
      to: recipients,
      subject: `[protobuf.ai] ${subject}`,
      html: buildHtmlBody(email),
      text: buildTextBody(email)
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to forward inbound email:', response.status, errorText);
  }
};

const parsePayload = (body) => {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
};

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = parsePayload(req.body);

    if (!payload.type) {
      return res.status(400).json({ error: 'Invalid Resend payload' });
    }

    if (payload.type !== 'email.received') {
      return res.status(200).json({ ignored: true });
    }

    const inboundEmail = payload.data || {};
    const recipients =
      process.env.RESEND_INBOUND_FORWARD_TO?.split(',')
        .map((email) => email.trim())
        .filter(Boolean) || [];

    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not set; inbound emails will not be forwarded.');
    }

    if (recipients.length === 0) {
      console.warn('RESEND_INBOUND_FORWARD_TO is empty; inbound emails will only be logged.');
    } else {
      await forwardInboundEmail(inboundEmail, recipients);
    }

    console.log('Inbound email via Resend', {
      id: payload.id,
      subject: inboundEmail.subject,
      from: normalizeAddressList(inboundEmail.from)[0],
      to: normalizeAddressList(inboundEmail.to).join(', ')
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend inbound webhook error:', error);
    return res.status(500).json({ error: 'Failed to process inbound email' });
  }
};
