// api/braze-proxy.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { action, apiKey, endpoint, data } = req.body;
    const cleanEndpoint = endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    let url;
    let body;

    if (action === 'upload_image') {
      url = `https://${cleanEndpoint}/media_library/create`;
      body = {
        "asset_file": data.base64,
        "name": data.name || `figma_${Date.now()}.png`
      };
    } else if (action === 'create_template') {
      url = `https://${cleanEndpoint}/templates/email/create`;
      body = {
        "template_name": data.name,
        "subject": data.subject,
        "body": data.html,
        "must_gather_subscription_status": true
      };
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
    return res.status(brazeResponse.status).json(result);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
