import OpenAI from 'openai'
import { JSDOM } from 'jsdom'
import { Link } from '../generate'

async function getHTMLMainContent(link: string) {
  console.info('   1. Getting HTML content')

  const html = await fetch(link).then((res) => res.text())
  const dom = new JSDOM(html)
  const doc = dom.window.document
  const mainContent = doc.querySelector('main')
  return mainContent?.innerHTML
}

async function generateReferenceMaterialPrompt(subject: string, link: Link) {
  const mainContent = await getHTMLMainContent(link.url)
  if (!mainContent) {
    return ''
  }

  const summaryPrompt = [
    'Create a summary of the text inside the following HTML.',
    'This summary will be used to help write a blog post on the following subject:',
    `<blog_post_subject>${subject}</blog_post_subject>`,
    'Highlight key areas of interest and explain them but do not attempt to provide suggestions.',
    'Here is the HTML:',
    `<html>${mainContent}</html>`,
    'Here is the link to the reference material:',
    `<reference_material_link>${link.url}</reference_material_link>`,
    `<reference_material_description>${link.description || 'No description provided'}</reference_material_description>`,
    'You should only respond with a list of up to 5 key areas of interest and explanations. Do not include any other text that is not part of the summary.',
    'Write the summaries in British English.'
  ].join('\n')

  return summaryPrompt
}

export async function generateReferenceMaterials(subject: string, links: Link[]) {
  console.info('[1] Generating reference materials')

  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  })

  const summaries = []

  try {
    for (const link of links) {
      console.info(' >', `(${link.description})[${link.url}]`)

      const prompt = await generateReferenceMaterialPrompt(subject, link)
      if (!prompt) continue

      console.info('   2. Generating reference summary')
      
      const response = await openai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
      })
      summaries.push(response.choices[0].message.content || '')
    }
    return summaries
  } catch (error) {
    console.error('Error in generateReferenceMaterials:', error)
    return []
  }
}
