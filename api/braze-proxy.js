// api/braze-proxy.js

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { action, apiKey, endpoint, data } = req.body;

    if (!apiKey || !endpoint || !action || !data) {
      return res.status(400).json({ error: 'Missing required fields in request body' });
    }

    const cleanEndpoint = endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
    let url;
    let body;

    switch (action) {
      case 'upload_image':
        url = `https://${cleanEndpoint}/media_library/create`;
        body = {
          "asset_file": data.base64, // Based on Braze API Docs
          "name": data.name || `figma_${Date.now()}.png`
        };
        break;

      case 'create_template':
        url = `https://${cleanEndpoint}/templates/email/create`;
        body = {
          "template_name": data.name,
          "subject": data.subject,
          "body": data.html,
          "must_gather_subscription_status": true
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid action: ' + action });
    }

    const brazeResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const result = await brazeResponse.json();
    
    // Pass through the Braze response status and data
    return res.status(brazeResponse.status).json(result);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
}
