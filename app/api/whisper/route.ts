/**
 * Threadify AI — Whisper Speech-to-Text Route
 * Accepts audio blob, returns transcribed text.
 * Client inserts into input box for user review before sending — no auto-send.
 */

// @ts-ignore
import OpenAI from "openai"

export const runtime = "edge"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const audio = formData.get("audio") as Blob | null

    if (!audio) {
      return Response.json({ error: "No audio provided" }, { status: 400 })
    }

    const MAX_AUDIO_SIZE = 25 * 1024 * 1024 // 25MB (Whisper limit)
    if (audio.size > MAX_AUDIO_SIZE) {
      return Response.json({ error: "Audio file too large (max 25MB)" }, { status: 400 })
    }

    // If no real API key, return mock transcription
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith("sk-your")) {
      return Response.json({
        text: "How do I track my order?",
        mock: true,
      })
    }

    const file = new File([audio], "audio.webm", { type: audio.type || "audio/webm" })

    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file,
      language: "en",
    })

    return Response.json({ text: transcription.text })
  } catch (err) {
    console.error("[/api/whisper]", err)
    return Response.json({ error: "Transcription failed. Please try typing instead." }, { status: 500 })
  }
}
