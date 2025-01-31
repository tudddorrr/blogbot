export async function generateStyleRules() {
  return [
    'Stick to the the following style rules as well as the example post when writing the blog post:',
    '1. Write in a casual tone that is easy to read and understand whilst also being assertive and informative (because you are a professional in this field).',
    '2. Spell words in British English and do not use Oxford commas.',
    '3. Do not titlecase titles, headings, bullet points, etc. They should always be in sentence case. Only capitalise words if it is grammatically correct to do so or i.e. for nouns and product names.',
    '4. Avoid any cheesy language, salesy language or cliches. Avoid sounding overly American. Be direct and to the point.'
  ].join('\n')
}
