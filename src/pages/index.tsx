import { useEffect, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLocalStorage } from 'usehooks-ts'
import { Link } from './api/generate'
import Head from 'next/head'

const initialSystemPrompt = [
  'You are a marketing expert with technical expertise in game development. You are working as part of a team that is building an open source game backend named Talo.',
  'Your task is to write an informative blog post about a given subject.',
  'You should reference the documentation and code examples where relevant to explain technical concepts clearly.',
  'Your tone should be friendly and engaging, but still informative and technical.',
  'Your blog post should be no more than 1000 words and should be readable in 5 minutes or less.',
  'When generating code examples, never reference functions or classes that do not exist or that have not been provided to you within the reference materials. You can however use functions and classes that are provided by the standard library of the language you are using.',
  'Ensure code examples are long enough to be useful and informative but not too long to be overwhelming.',
  'Ensure that the blog post is focused on the subject and does not meander off into unrelated topics.',
  'The blog post content should be SEO optimised and include relevant keywords without sacrificing readability or any of the style rules.'
].join('\n')

interface BlogConfig {
  systemPrompt: string
  prompt: string
  referenceLinks: Link[]
  codeLinks: Link[]
  linksToInclude: Link[]
}

export default function Home() {
  const [systemPrompt, setSystemPrompt] = useLocalStorage('systemPrompt', initialSystemPrompt)
  const [prompt, setPrompt] = useLocalStorage('prompt', '')
  const [referenceLinks, setReferenceLinks] = useLocalStorage<Link[]>('links', [])
  const [codeLinks, setCodeLinks] = useLocalStorage<Link[]>('codeLinks', [])
  const [linksToInclude, setLinksToInclude] = useLocalStorage<Link[]>('linksToInclude', [])
  const [output, setOutput] = useLocalStorage('output', '')

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ systemPrompt, prompt, referenceLinks, codeLinks, linksToInclude }),
      })
      const data = await response.json()
      setOutput(data.output)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
      window.scrollTo(0, document.body.scrollHeight)
    }
  }

  const handleExport = () => {
    const config: BlogConfig = {
      systemPrompt,
      prompt,
      referenceLinks,
      codeLinks,
      linksToInclude
    }
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'blogbot-config.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config: BlogConfig = JSON.parse(e.target?.result as string)
        setSystemPrompt(config.systemPrompt)
        setPrompt(config.prompt)
        setReferenceLinks(config.referenceLinks)
        setCodeLinks(config.codeLinks)
        setLinksToInclude(config.linksToInclude)
      } catch (error) {
        setError(`Failed to parse configuration file: ${error}`)
      }
    }
    reader.readAsText(file)
  }

  const handleClear = () => {
    setSystemPrompt(initialSystemPrompt)
    setPrompt('')
    setReferenceLinks([])
    setCodeLinks([])
    setLinksToInclude([])
    setOutput('')
  }

  return (
    <div className="space-y-8">
      <Head>
        <title>Blogbot</title>
      </Head>

      <h1 className="text-2xl font-bold">Blogbot</h1>

      {isClient && (
        <>
          <div className="grid gap-2">
            <Label className="font-semibold" htmlFor="system-prompt">
              System prompt
            </Label>
            <p className="text-sm">
              This is used to set the tone and style of the blog post
            </p>
            <Textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter a prompt"
            />
          </div>

          <div className="grid gap-2">
            <Label className="font-semibold" htmlFor="prompt">
              Prompt
            </Label>
            <p className="text-sm">
              This is used as the subject of the blog post
            </p>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt"
            />
          </div>

          <div className="grid gap-2">
            <Label className="font-semibold">Reference links</Label>
            <p className="text-sm">
              These can be docs, landing pages or articles
            </p>
            <div className="space-y-2">
              {referenceLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...referenceLinks]
                      newLinks[index] = { ...newLinks[index], url: e.target.value }
                      setReferenceLinks(newLinks)
                    }}
                    placeholder="Enter a link"
                    className="flex-1"
                  />
                  <Input
                    value={link.description}
                    onChange={(e) => {
                      const newLinks = [...referenceLinks]
                      newLinks[index] = { ...newLinks[index], description: e.target.value }
                      setReferenceLinks(newLinks)
                    }}
                    placeholder="Enter a description"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newLinks = referenceLinks.filter((_, i) => i !== index)
                      setReferenceLinks(newLinks)
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setReferenceLinks([...referenceLinks, { url: '', description: '' }])}
              >
                Add link
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="font-semibold">Code links</Label>
            <p className="text-sm">
              These should be links to raw files inside repositories
            </p>
            <div className="space-y-2">
              {codeLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={link.url}
                    onChange={(e) => {
                      const newCodeLinks = [...codeLinks]
                      newCodeLinks[index] = { ...newCodeLinks[index], url: e.target.value }
                      setCodeLinks(newCodeLinks)
                    }}
                    placeholder="Enter a link"
                    className="flex-1"
                  />
                  <Input
                    value={link.description}
                    onChange={(e) => {
                      const newCodeLinks = [...codeLinks]
                      newCodeLinks[index] = { ...newCodeLinks[index], description: e.target.value }
                      setCodeLinks(newCodeLinks)
                    }}
                    placeholder="Enter a description"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newCodeLinks = codeLinks.filter((_, i) => i !== index)
                      setCodeLinks(newCodeLinks)
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setCodeLinks([...codeLinks, { url: '', description: '' }])}
              >
                Add code link
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="font-semibold">Links to include</Label>
            <p className="text-sm">
              These links will be included directly in the blog post
            </p>
            <div className="space-y-2">
              {linksToInclude.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={link.url}
                    onChange={(e) => {
                      const newLinksToInclude = [...linksToInclude]
                      newLinksToInclude[index] = { ...newLinksToInclude[index], url: e.target.value }
                      setLinksToInclude(newLinksToInclude)
                    }}
                    placeholder="Enter a link"
                    className="flex-1"
                  />
                  <Input
                    value={link.description}
                    onChange={(e) => {
                      const newLinksToInclude = [...linksToInclude]
                      newLinksToInclude[index] = { ...newLinksToInclude[index], description: e.target.value }
                      setLinksToInclude(newLinksToInclude)
                    }}
                    placeholder="Enter a description"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newLinksToInclude = linksToInclude.filter((_, i) => i !== index)
                      setLinksToInclude(newLinksToInclude)
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setLinksToInclude([...linksToInclude, { url: '', description: '' }])}
              >
                Add link to include
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate'}
            </Button>
            
            <Button variant="outline" onClick={handleExport}>
              Export config
            </Button>
            
            <Button variant="outline" asChild>
              <label>
                Import config
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </Button>

            <Button variant="outline" onClick={handleClear}>
              Clear form
            </Button>
          </div>

          {error && (
            <div className="text-red-500">
              {error}
            </div>
          )}

          {output && (
            <div className="grid gap-2">
              <Label className="font-semibold">Output</Label>
              <Textarea
                className="h-screen"
                value={output}
                readOnly
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
