import type { AiProvider } from "./ai-provider";

export class OllamaProvider implements AiProvider {
  readonly name="OLLAMA";
  constructor(private readonly fallback:AiProvider,private readonly baseUrl:string,private readonly model:string){}
  suggestCategory(input:Parameters<AiProvider["suggestCategory"]>[0]){return this.fallback.suggestCategory(input)}
  suggestPriority(input:Parameters<AiProvider["suggestPriority"]>[0]){return this.fallback.suggestPriority(input)}
  private async generate(prompt:string,fallback:()=>Promise<string>){
    try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);const response=await fetch(`${this.baseUrl.replace(/\/$/,"")}/api/generate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:this.model,prompt,stream:false}),signal:controller.signal});clearTimeout(timer);if(!response.ok)throw new Error("Ollama unavailable");const data=await response.json() as{response?:string};return data.response?.trim()||await fallback()}catch{return fallback()}
  }
  summarizeReport(input:Parameters<AiProvider["summarizeReport"]>[0]){return this.generate(`Summarize this municipal report factually in at most 100 words. Do not invent facts. ${JSON.stringify(input)}`,()=>this.fallback.summarizeReport(input))}
  draftResponse(input:Parameters<AiProvider["draftResponse"]>[0]){return this.generate(`Draft a concise, professional municipality response. Do not promise actions not in the facts. ${JSON.stringify(input)}`,()=>this.fallback.draftResponse(input))}
  summarizeAnalytics(input:Record<string,unknown>){return this.generate(`Summarize these Cityzen aggregates in at most 100 words. Do not infer causation or invent facts. ${JSON.stringify(input)}`,()=>this.fallback.summarizeAnalytics(input))}
}
