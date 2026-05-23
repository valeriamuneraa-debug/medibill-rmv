export const runtime = "nodejs";

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EXTRACTION_PROMPT = `Eres un asistente médico especializado en documentos clínicos de Colombia. Extrae la información del paciente de esta imagen de historia clínica u otro documento médico colombiano.

Responde ÚNICAMENTE con un objeto JSON con esta estructura exacta (usa null si el dato no aparece en el documento):
{
  "nombre": "nombre completo del paciente tal como aparece en el documento",
  "id": "número de cédula o documento de identidad (solo dígitos, sin espacios ni puntos ni comas)",
  "edad": "edad del paciente en años (solo el número, sin la palabra 'años')",
  "telefono": "número de teléfono o celular del paciente",
  "direccion": "dirección de residencia completa del paciente",
  "email": "correo electrónico del paciente",
  "confidence": {
    "nombre": 0.95,
    "id": 0.80,
    "edad": 0.90,
    "telefono": 0.70,
    "direccion": 0.85,
    "email": 0.60
  }
}

Escala de confidence (0.0 a 1.0):
- 0.9–1.0: texto claramente legible, sin ambigüedad
- 0.7–0.8: texto mayormente legible con dudas menores
- 0.5–0.6: texto parcialmente ilegible o inferido por contexto
- 0.0–0.4: no encontrado o completamente ilegible

Reglas:
- Extrae exactamente lo que está escrito en el documento, sin corregir ni completar datos
- Para "id": devuelve solo dígitos, sin puntos ni comas ni espacios
- Para "edad": devuelve solo el número (ejemplo: "45", no "45 años")
- Si no es una historia clínica, extrae lo que puedas de los campos disponibles
- No inventes ni supongas datos que no estén visibles en la imagen`

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

  const { image, mediaType } = body
  if (!image) {
    return new Response(JSON.stringify({ message: 'Missing image field' }), { status: 400 })
  }

  // Strip data URL prefix generically — works for images and PDFs
  const base64Data = image.replace(/^data:[^;]+;base64,/, '')
  const effectiveMediaType = mediaType || (image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg')
  const isPdf = effectiveMediaType === 'application/pdf'

  // PDFs use the document block type; images use the image block type
  const mediaBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } }
    : { type: 'image',    source: { type: 'base64', media_type: effectiveMediaType, data: base64Data } }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            mediaBlock,
            { type: 'text', text: EXTRACTION_PROMPT },
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
