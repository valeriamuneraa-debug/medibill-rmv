export const runtime = 'nodejs';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, mediaType } = req.body;
    console.log('REQUEST received, image length:', image?.length, 'mediaType:', mediaType);

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const isPDF = mediaType === 'application/pdf';

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const contentBlock = isPDF
      ? {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: image,
          },
        }
      : {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: image,
          },
        };

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            {
              type: 'text',
              text: `Extrae los datos de identificación del paciente de este formulario médico colombiano.
Devuelve ÚNICAMENTE un objeto JSON con exactamente estos campos:
{
  "nombre": "nombre completo del paciente",
  "id": "número de cédula o documento",
  "edad": "edad en años como número",
  "telefono": "número de teléfono",
  "direccion": "dirección completa",
  "email": "correo electrónico (puede estar escrito a mano en la parte superior)",
  "confidence": {
    "nombre": 0.95,
    "id": 0.95,
    "edad": 0.95,
    "telefono": 0.95,
    "direccion": 0.95,
    "email": 0.7
  }
}
Usa valores de confianza entre 0 y 1. Confianza baja (menos de 0.8) para campos manuscritos o poco claros.
Usa null para campos no encontrados. Devuelve SOLO el JSON, sin texto adicional.`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(clean);
    return res.status(200).json(data);
  } catch (err) {
    console.error('Anthropic error full:', JSON.stringify(err, null, 2));
    return res.status(500).json({
      error: 'Extraction failed',
      detail: err.message
    });
  }
}
