import Anthropic from '@anthropic-ai/sdk'

export const config = { runtime: 'edge' }

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ message: 'Invalid JSON' }), { status: 400 })
  }

  const { image } = body
  if (!image) {
    return new Response(JSON.stringify({ message: 'Missing image field' }), { status: 400 })
  }

  const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
  const mediaType = image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Data },
            },
            {
              type: 'text',
              text: `Extrae la información del paciente de esta imagen médica.
Responde SOLO con un objeto JSON con estos campos (usa null si no encuentras el valor):
{
  "name": "nombre completo del paciente",
  "procedure": "procedimiento o diagnóstico",
  "value": "valor o costo en pesos colombianos (número sin puntos ni comas)",
  "eps": "EPS o aseguradora",
  "notes": "otras notas relevantes"
}`,
            },
          ],
        },
      ],
    })

    const text = message.content[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return new Response(JSON.stringify({ message: 'No se pudo extraer datos de la imagen' }), { status: 422 })
    }

    const patient = JSON.parse(jsonMatch[0])
    return new Response(JSON.stringify(patient), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Claude API error:', err)
    return new Response(JSON.stringify({ message: 'Error al procesar la imagen' }), { status: 500 })
  }
}
