import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, FileText, AlertCircle } from "lucide-react"

export default function CampaignAnalyzer() {
  const [file, setFile] = useState<File | null>(null)
  const [brief, setBrief] = useState('')
  const [analysis, setAnalysis] = useState<{
    designAnalysis: string;
    copyAnalysis: string;
    campaignOutline: string;
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleBriefChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBrief(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please upload an image before submitting.')
      return
    }
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('image', file)
    formData.append('brief', brief)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to analyze campaign')
      }

      const result = await response.json()
      setAnalysis(result)
    } catch (err) {
      setError('An error occurred while analyzing the campaign. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Email Campaign Analyzer</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Campaign</CardTitle>
            <CardDescription>Upload an image of your email campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center w-full">
              <Label 
                htmlFor="dropzone-file" 
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
                <Input 
                  id="dropzone-file" 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept="image/*" 
                />
              </Label>
            </div>
            {file && <p className="mt-2 text-sm text-gray-500">File selected: {file.name}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Brief</CardTitle>
            <CardDescription>Enter details about the campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Enter campaign brief, including target audience, goals, and key messages..." 
              className="min-h-[100px]"
              value={brief}
              onChange={handleBriefChange}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isLoading}>
          <FileText className="mr-2 h-4 w-4" /> 
          {isLoading ? 'Analyzing...' : 'Analyze Campaign'}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysis && (
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Design Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm">{analysis.designAnalysis}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Copy Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm">{analysis.copyAnalysis}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Outline</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm">{analysis.campaignOutline}</pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
