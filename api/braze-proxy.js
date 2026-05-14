// api/braze-proxy.js

export default async function handler(req, res) {
  // 1. Setup CORS for Figma
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { action, apiKey, endpoint, data } = req.body;
    const cleanEndpoint = endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Handle Image Upload
    if (action === 'upload_image') {
      const url = `https://${cleanEndpoint}/media_library/create`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "asset_file": data.base64, // Field name must be exactly this
          "name": data.name || `figma_${Date.now()}.png`
        })
      });

      const result = await response.json();
      return res.status(response.status).json(result);
    }

    // Handle Template Creation
    if (action === 'create_template') {
      const url = `https://${cleanEndpoint}/templates/email/create`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "template_name": data.name,
          "subject": data.subject,
          "body": data.html,
          "must_gather_subscription_status": true
        })
      });
      const result = await response.json();
      return res.status(response.status).json(result);
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
