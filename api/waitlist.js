const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WAITLIST_FORWARD_TO = process.env.WAITLIST_FORWARD_TO || 'andrew@voyant.io';

const fallbackResponse = (name, useCase, message) => {
  const useCaseMap = {
    'rapid-prototyping': 'shipping proto schemas faster than product requirements change',
    'team-development': 'keeping large schema changes coordinated across teams',
    'api-design': 'front-loading schema design before writing services',
    migration: 'modernizing legacy protobufs safely',
    learning: 'leveling up your proto expertise'
  };

  const focus =
    useCaseMap[useCase] ||
    (message && message.toLowerCase().includes('ai')
      ? 'building AI-driven schema workflows'
      : 'designing reliable protobuf workflows');

  return `Thanks for joining the protobuf.ai waitlist, ${name}! We noted your focus on ${focus}. We'll reach out with roadmap details soon.`;
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, name, company = 'Not specified', useCase, message = 'No additional message' } = req.body || {};

    if (!email || !name || !useCase) {
      return res.status(400).json({ error: 'Name, email, and use case are required' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const payload = {
      from: 'protobuf.ai Waitlist <waitlist@protobuf.ai>',
      to: WAITLIST_FORWARD_TO,
      reply_to: email,
      subject: `New Waitlist Submission: ${name}`,
      html: `
        <h2>New Waitlist Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Use Case:</strong> ${useCase}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
      `,
      text: `New Waitlist Submission

Name: ${name}
Email: ${email}
Company: ${company}
Use Case: ${useCase}

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
      let parsed = errorText;
      try {
        const json = JSON.parse(errorText);
        parsed = json.message || json.error || errorText;
      } catch {
        // leave parsed as text
      }
      console.error('Resend API error:', emailResponse.status, parsed);
      return res.status(500).json({ error: `Email failed: ${parsed}` });
    }

    let aiResponse = '';
    if (process.env.OPENAI_API_KEY) {
      try {
        const ai = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.7,
            max_tokens: 150,
            messages: [
              {
                role: 'system',
                content:
                  'You are an AI assistant for protobuf.ai. Write concise, context-aware confirmations for developers joining the waitlist. Reference their use case and highlight how protobuf.ai accelerates schema workflows.'
              },
              {
                role: 'user',
                content: `Create a personalized thank-you note for this waitlist submission:
Name: ${name}
Email: ${email}
Company: ${company}
Use Case: ${useCase}
Message: ${message}`
              }
            ]
          })
        });

        if (ai.ok) {
          const data = await ai.json();
          aiResponse = data.choices?.[0]?.message?.content?.trim() || '';
        } else {
          const err = await ai.text();
          console.error('OpenAI API error:', ai.status, err);
        }
      } catch (aiError) {
        console.error('AI response generation failed:', aiError);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Submission received',
      aiResponse: aiResponse || fallbackResponse(name, useCase, message)
    });
  } catch (error) {
    console.error('Waitlist handler error:', error);
    return res.status(500).json({ error: 'Failed to submit waitlist form' });
  }
};
