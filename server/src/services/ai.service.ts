import { UserRole } from "@prisma/client";
import database from "../config/database";
import type { AuthenticatedUser } from "../types/auth.types";
import { AppError } from "../utils/app-error";
import { overview, type AnalyticsRange } from "./analytics.service";
import { getReportById } from "./report.service";
import { getServiceRequest } from "./service-request.service";
import type { AiProvider } from "./ai/ai-provider";
import { OllamaProvider } from "./ai/ollama.provider";
import { RuleBasedProvider } from "./ai/rule-based.provider";

const rules=new RuleBasedProvider();
const provider:AiProvider=process.env.AI_PROVIDER?.toUpperCase()==="OLLAMA"&&process.env.OLLAMA_MODEL?new OllamaProvider(rules,process.env.OLLAMA_BASE_URL??"http://localhost:11434",process.env.OLLAMA_MODEL):rules;
const clip=(value:string)=>value.slice(0,500);
async function log(userId:number,feature:string,targetType:string,targetId:number|undefined,input:string,output:string){await database.aiAssistanceLog.create({data:{userId,feature,provider:provider.name,targetType,targetId,inputSummary:clip(input),outputSummary:clip(output)}}).catch(()=>undefined)}

export async function suggestCategory(user:AuthenticatedUser,title:string,description:string){const categories=await database.reportCategory.findMany({where:{isActive:true},select:{id:true,name:true,description:true}}),result=await provider.suggestCategory({title,description,categories});await log(user.userId,"CATEGORY_SUGGESTION","REPORT_DRAFT",undefined,`${title} ${description}`,JSON.stringify(result));return{...result,provider:provider.name,advisory:true}}
export async function suggestPriority(user:AuthenticatedUser,reportId:number){const report=await getReportById(reportId,user),result=await provider.suggestPriority({title:report.title,description:report.description,upvoteCount:report.upvoteCount,similarCount:0});await log(user.userId,"PRIORITY_SUGGESTION","REPORT",reportId,report.title,JSON.stringify(result));return{...result,provider:provider.name,advisory:true}}
export async function reportSummary(user:AuthenticatedUser,reportId:number){const report=await getReportById(reportId,user);const comments=await database.reportComment.findMany({where:{reportId},orderBy:{createdAt:"asc"},select:{content:true},take:20});const summary=await provider.summarizeReport({title:report.title,description:report.description,status:report.status,category:report.category.name,comments:comments.map(x=>x.content)});await log(user.userId,"REPORT_SUMMARY","REPORT",reportId,report.title,summary);return{summary,provider:provider.name,advisory:true}}
export async function reportResponseDraft(user:AuthenticatedUser,reportId:number){const report=await getReportById(reportId,user);const draft=await provider.draftResponse({kind:"report",title:report.title,status:report.status,details:report.description});await log(user.userId,"REPORT_RESPONSE_DRAFT","REPORT",reportId,report.title,draft);return{draft,provider:provider.name,advisory:true}}
export async function serviceResponseDraft(user:AuthenticatedUser,id:number){const request=await getServiceRequest(id,user),draft=await provider.draftResponse({kind:"service-request",title:request.service.title,status:request.status,details:request.description});await log(user.userId,"SERVICE_RESPONSE_DRAFT","SERVICE_REQUEST",id,request.service.title,draft);return{draft,provider:provider.name,advisory:true}}
export async function analyticsSummary(user:AuthenticatedUser,range:AnalyticsRange){if(user.role!==UserRole.ADMIN&&user.role!==UserRole.DEPARTMENT_HEAD)throw new AppError(403,"Analytics assistance is restricted to administrators and department heads");const data=await overview(user,range),summary=await provider.summarizeAnalytics(data as unknown as Record<string,unknown>);await log(user.userId,"ANALYTICS_SUMMARY","ANALYTICS",undefined,JSON.stringify(data),summary);return{summary,provider:provider.name,advisory:true}}
