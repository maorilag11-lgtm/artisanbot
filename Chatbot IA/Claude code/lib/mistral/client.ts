const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions'

interface MistralMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: MistralToolCall[]
}

interface MistralToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

interface MistralTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

interface MistralResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string | null
      tool_calls?: MistralToolCall[]
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function callMistral(
  messages: MistralMessage[],
  tools?: MistralTool[],
  toolChoice?: 'auto' | 'none'
): Promise<MistralResponse> {
  const body: Record<string, unknown> = {
    model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
    messages,
  }

  if (tools && tools.length > 0) {
    body.tools = tools
    body.tool_choice = toolChoice || 'auto'
  }

  const response = await fetch(MISTRAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Mistral API error: ${response.status} - ${error}`)
  }

  return response.json()
}

export type { MistralMessage, MistralTool, MistralToolCall, MistralResponse }
