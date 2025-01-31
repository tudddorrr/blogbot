
import OpenAI from 'openai'
import { Link } from '../generate'

async function getRawContent(link: string) {
  console.info('   1. Getting raw content')
  const text = await fetch(link).then((res) => res.text())
  return text
}

async function generateCodeReferencePrompt(subject: string, link: Link) {
  const rawContent = await getRawContent(link.url)
  if (!rawContent) {
    return ''
  }

  const summaryPrompt = [
    'Create a summary of the following code reference.',
    'This summary will be used to help write a blog post on the following subject:',
    `<blog_post_subject>${subject}</blog_post_subject>`,
    'Do not explain the code, only highlight key areas of interests for developers looking to leverage the code.',
    'Include the code itself where relevant and where it would add value as part of the blog post.',
    'Write the summaries in British English.',
    'You should distinguish between example implementations in the code and the actual API developers will interact with in order to be able to provide helpful examples in the blog post.',
    'Here is the code reference:',
    `<code_reference>${rawContent}</code_reference>`,
    'Here is the link to the code reference:',
    `<code_reference_link>${link.url}</code_reference_link>`,
    `<code_reference_description>${link.description || 'No description provided'}</code_reference_description>`,
    'You should only respond with a list of up to 5 key areas of interest and short explanations. Do not include any other text that is not part of the summary.',
    'Include relevant blocks or lines of code where it would add value as part of the blog post.',
  ].join('\n')

  return summaryPrompt
}

export async function generateCodeReferences(subject: string, links: Link[]) {
  console.info('[2] Generating code references')

  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  })

  try {
    const summaries = []
    for (const link of links) {
      console.info(' >', `(${link.description})[${link.url}]`)

      const prompt = await generateCodeReferencePrompt(subject, link)
      if (!prompt) continue

      console.info('   2. Generating code summary')
      
      const response = await openai.chat.completions.create({
        model: 'anthropic/claude-3.5-sonnet',
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
    console.error('Error in generateCodeReferences:', error)
    return []
  }
}
