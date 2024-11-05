import { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm, Fields, Files } from 'formidable'
import { promises as fs } from 'fs'
import OpenAI from 'openai'

export const config = {
  api: {
    bodyParser: false,
  },
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Parse the form data with proper typing
    const { fields, files } = await new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
      const form = new IncomingForm()
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err)
        resolve({ fields, files })
      })
    })

    // Safely access the image file with optional chaining
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image
    if (!imageFile) {
      return res.status(400).json({ error: 'No image file uploaded' })
    }

    // Safely access the brief with optional chaining
    const brief = Array.isArray(fields.brief) ? fields.brief[0] : fields.brief
    if (!brief) {
      return res.status(400).json({ error: 'No brief provided' })
    }

    const imageBuffer = await fs.readFile(imageFile.filepath)
    const base64Image = imageBuffer.toString('base64')

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze this email campaign image and provide: 1) Design Analysis, 2) Copy Analysis, and 3) Campaign Outline. For the Campaign Outline, use the following structure: Section Name (e.g., Hero Section), Header:, Subheader:, Copy Blurb:, CTA:. The campaign brief is: ${brief}` 
            },
            {
              type: "image_url",
              image_url: `data:image/jpeg;base64,${base64Image}`
            }
          ],
        },
      ],
      max_tokens: 1000,
    })

    const result = response.choices[0].message.content
    if (!result) {
      throw new Error('No result from OpenAI')
    }

    const [designAnalysis, copyAnalysis, campaignOutline] = result.split('\n\n')

    // Clean up the temporary file
    await fs.unlink(imageFile.filepath)

    return res.status(200).json({ designAnalysis, copyAnalysis, campaignOutline })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'An error occurred while processing the request' })
  }
}
