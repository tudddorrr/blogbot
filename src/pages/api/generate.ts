import type { NextApiRequest, NextApiResponse } from 'next'
import { generateReferenceMaterials } from './functions/generateReferenceMaterials'
import { generateStructurePrompt } from './functions/generateStructurePrompt'
import { generateCodeReferences } from './functions/generateCodeReferences'
import OpenAI from 'openai'
import { generateStyleRules } from './functions/generateStyleRules'

export type Data = {
  output: string
}

export type Link = {
  url: string
  description: string
}

export const config = {
  maxDuration: 60
}

async function formatReferenceMaterials(subject: string, links: Link[]) {
  const summaries = await generateReferenceMaterials(subject, links)
  return summaries.length > 0 
    ? summaries.map((summary, i) => `- ${links[i].description}: ${links[i].url}\n  ${summary}`).join('\n')
    : 'No reference materials provided'
}

async function formatCodeReferences(subject: string, codeLinks: Link[]) {
  const summaries = await generateCodeReferences(subject, codeLinks)
  return summaries.length > 0 
    ? summaries.map((summary, i) => `- ${codeLinks[i].description}: ${codeLinks[i].url}\n  ${summary}`).join('\n')
    : 'No code references provided'
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  const { systemPrompt, prompt, referenceLinks, codeLinks, linksToInclude } = JSON.parse(req.body) as {
    systemPrompt: string
    prompt: string
    referenceLinks: Link[]
    codeLinks: Link[]
    linksToInclude: Link[]
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  })

  const messages = [
    {
      role: 'system' as const,
      content: systemPrompt
    },
    {
      role: 'user' as const,
      content: [
        `<blog_post_subject>${prompt || 'No subject provided'}</blog_post_subject>`,
        `<reference_materials>${await formatReferenceMaterials(prompt, referenceLinks)}</reference_materials>`,
        `<code_references>${await formatCodeReferences(prompt, codeLinks)}</code_references>`,
        `<style_rules>${await generateStyleRules()}</style_rules>`,
        `<formatting_rules>${await generateStructurePrompt(linksToInclude)}</formatting_rules>`
      ].join('\n')
    }
  ]

  console.info('[4] Generating blog post')

  console.info('<!-- START PROMPT -->')
  console.info(messages[1].content)
  console.info('<!-- END PROMPT -->')

  const response = await openai.chat.completions.create({
    model: 'anthropic/claude-3.5-sonnet',
    messages,
    max_tokens: 2500,
  })

  console.info('[5] Blog post generated')

  const output = response.choices[0].message.content || ''

  res.status(200).json({ output })
}
