// api/braze-proxy.js

export default async function handler(req, res) {
  // 1. Enable CORS for Figma
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, apiKey, endpoint, data } = req.body;

    // Validation: Ensure all primary fields exist
    if (!apiKey || !endpoint || !action || !data) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { action: !!action, apiKey: !!apiKey, endpoint: !!endpoint, data: !!data }
      });
    }

    // Clean the endpoint to prevent "Invalid URL" errors
    const cleanEndpoint = endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    let url;
    let body;

    // 2. Route to the correct Braze API endpoint
    switch (action) {
      case 'upload_image':
        // Official Braze Media Library Endpoint
        url = `https://${cleanEndpoint}/media_library/create`;
        body = {
          "name": data.name || `figma_export_${Date.now()}.png`,
          "file": data.base64 // Braze expects the base64 string here
        };
        break;

      case 'create_template':
        // Official Braze Email Template Endpoint
        url = `https://${cleanEndpoint}/templates/email/create`;
        body = {
          "template_name": data.name,
          "subject": data.subject,
          "body": data.html,
          "preheader_text": data.preheader || '',
          "must_gather_subscription_status": true
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid action: ' + action });
    }

    // 3. Make the request to Braze
    const brazeResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const result = await brazeResponse.json();

    if (!brazeResponse.ok) {
      console.error('Braze API Error:', result);
      return res.status(brazeResponse.status).json({
        error: result.message || 'Braze API error',
        details: result
      });
    }

    // 4. Return success to Figma
    return res.status(200).json(result);

  } catch (error) {
    console.error('Server error detail:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
}
