import FormData from 'form-data';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { action, apiKey, endpoint, data } = req.body;
    const cleanEndpoint = endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');

    if (action === 'upload_image') {
      const url = `https://${cleanEndpoint}/media_library/create`;
      const buffer = Buffer.from(data.base64, 'base64');
      
      const form = new FormData();
      const fileName = data.name.endsWith('.png') ? data.name : `${data.name}.png`;

      // Adheres to Braze syntax: asset_file field with binary data
      form.append('asset_file', buffer, { 
        filename: fileName, 
        contentType: 'image/png' 
      });
      form.append('name', data.name || 'figma_export');

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${apiKey}`, 
          ...form.getHeaders() 
        },
        body: form
      });

      const result = await response.json();
      return res.status(response.status).json(result);
    }

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
