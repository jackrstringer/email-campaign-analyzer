import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import OpenAI from 'openai'

export const config = {
  api: {
    bodyParser: false,
  },
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface FormidableFile extends formidable.File {
  filepath: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = new formidable.IncomingForm()
    form.parse(req, async (err, fields, files: formidable.Files) => {
      if (err) {
        return res.status(500).json({ error: 'Error parsing form data' })
      }

      const uploadedFile = files.image
      if (!uploadedFile || Array.isArray(uploadedFile)) {
        return res.status(400).json({ error: 'Invalid file upload' })
      }

      const imageFile = uploadedFile as FormidableFile
      const brief = fields.brief

      if (typeof brief !== 'string') {
        return res.status(400).json({ error: 'Invalid brief' })
      }

      const imageBuffer = fs.readFileSync(imageFile.filepath)
      const base64Image = imageBuffer.toString('base64')

      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `Analyze this email campaign image and provide: 1) Design Analysis, 2) Copy Analysis, and 3) Campaign Outline. For the Campaign Outline, use the following structure: Section Name (e.g., Hero Section), Header:, Subheader:, Copy Blurb:, CTA:. The campaign brief is: ${brief}` },
              { type: "image_url", image_url: `data:image/jpeg;base64,${base64Image}` }
            ],
          },
        ],
        max_tokens: 1000,
      })

      const result = response.choices[0].message.content
      const [designAnalysis, copyAnalysis, campaignOutline] = result.split('\n\n')

      res.status(200).json({ designAnalysis, copyAnalysis, campaignOutline })
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'An error occurred while processing the request' })
  }
}
