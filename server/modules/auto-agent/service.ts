import { MultiServerMCPClient } from "@langchain/mcp-adapters"
import { ChatOpenAI } from "@langchain/openai"
import { createAgent } from "langchain"


export function createAutoAgentService() {
  const client = new MultiServerMCPClient({
    math: {
      transport: "stdio",  // Local subprocess communication
      command: "node",
      // Replace with absolute path to your math_server.js file
      args: ["/path/to/math_server.js"],
    },
    weather: {
      transport: "sse",  // Server-Sent Events for streaming
      // Ensure you start your weather server on port 8000
      url: "http://localhost:8000/mcp",
    },
  })

  return {
    async chat(messages: string[]) {
      const tools = await client.getTools()
      const agent = createAgent({
        model: "anthropic:claude-sonnet-4-5",
        tools,
      })

      agent.stream({ messages: [
        
        { role: "user", content: "what's (3 + 5) x 12?" }
      ]})
    }
  }
}
