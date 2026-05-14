// api/braze-proxy.js
// This is a Vercel serverless function that proxies requests to Braze

export default async function handler(req, res) {
  // Enable CORS so Figma can call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, apiKey, endpoint, data } = req.body;

    if (!apiKey || !endpoint || !action) {
      return res.status(400).json({ 
        error: 'Missing required fields: apiKey, endpoint, action' 
      });
    }

    let url;
    let method = 'POST';
    let body;

    // Route to the correct Braze API endpoint
    switch (action) {
      case 'upload_image':
        url = `https://${endpoint}/content/assets/create`;
        body = {
          name: data.name,
          type: 'image/png',
          data: data.base64
        };
        break;

      case 'create_template':
        url = `https://${endpoint}/templates/email/create`;
        body = {
          template_name: data.name,
          subject: data.subject,
          body: data.html,
          preheader_text: data.preheader || '',
          must_gather_subscription_status: true
        };
        break;

      case 'test_connection':
        url = `https://${endpoint}/templates/email/list`;
        method = 'GET';
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Make the request to Braze
    const brazeResponse = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: method === 'POST' ? JSON.stringify(body) : undefined
    });

    const result = await brazeResponse.json();

    if (!brazeResponse.ok) {
      return res.status(brazeResponse.status).json({
        error: result.message || 'Braze API error',
        details: result
      });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
}
