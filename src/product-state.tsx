import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from './api';
import { useAuth } from './auth';

export type CampaignStatus = 'Draft' | 'Scheduled' | 'Active' | 'Completed' | 'Closed' | 'Cancelled';
export type LearningStatus = 'Not Started' | 'In Progress' | 'Content Completed' | 'Quiz Available' | 'Completed' | 'Overdue';
export type AssessmentStatus = 'Locked' | 'Available' | 'In Progress' | 'Completed' | 'Overdue';
export type CertificateStatus = 'Not Eligible' | 'Eligible' | 'Issued' | 'Revoked';
export type SimulationStatus = 'Draft' | 'Scheduled' | 'Active' | 'Completed' | 'Cancelled';

export interface Campaign { id:string; name:string; objective?:string; owner?:string; audience:string; employees:number; status:CampaignStatus; completion:number; score:number|null; baseline:number|null; schedule:string; learning:string[]; assessment:string; simulation?:string; startDate?:string; learningDueDate?:string; endDate?:string; baselineEnabled?:boolean; followUpEnabled?:boolean }
export interface LearningAssignment { id:string; campaignId?:string; courseId:string; courseTitle:string; audience:string; employees:number; dueDate:string; createdAt:string; required:boolean; progress:number; status:LearningStatus; quizScore?:number }
export interface AssessmentAssignment { id:string; campaignId:string; type:'Baseline'|'Follow-up'; title:string; status:AssessmentStatus; dueDate:string; score?:number }
export interface CertificateRecord { id:string; courseId:string; courseTitle:string; employeeName:string; score:number; issuedAt:string; status:CertificateStatus }
export interface SimulationRecord { id:string; campaignId:string; template:string; status:SimulationStatus; delivered:number; opened:number; clicked:number; credentialAttempted:number; reported:number; noAction:number }
export interface QuizAttempt { campaignId?:string; courseId:string; answers:number[]; score:number; completedAt:string; employeeName?:string }
export interface NotificationRecord { id:string; type:string; message:string; status:'Sent'|'Delivered'|'Opened'; date:string }
export interface ProductEvent { id:string; type:string; message:string; date:string; actor?:string }

export interface ProductState {
  employeeScore:number; previousEmployeeScore:number; organizationScore:number; previousOrganizationScore:number;
  quizCompleted:boolean; phishingReports:number; campaigns:Campaign[]; notifications:NotificationRecord[];
  assignments:LearningAssignment[]; assessments:AssessmentAssignment[]; certificates:CertificateRecord[];
  simulations:SimulationRecord[]; quizAttempts:QuizAttempt[]; events:ProductEvent[];
  scoreSignals:{knowledge:number;behavior:number;reporting:number;improvement:number}; assessmentResult:number|null;
}

interface ProductContextValue extends ProductState {
  loading:boolean; ready:boolean; pending:boolean; error:string; clearError:()=>void; refresh:()=>Promise<void>;
  completePhishingQuiz:()=>void; reportPhishing:()=>Promise<void>;
  createCampaign:(campaign:Omit<Campaign,'id'>)=>Promise<string|null>;
  updateCampaignStatus:(id:string,status:CampaignStatus)=>Promise<void>; launchCampaign:(id:string)=>Promise<void>;
  assignLearning:(assignment:Omit<LearningAssignment,'id'|'createdAt'|'status'|'progress'|'required'> & {required?:boolean})=>Promise<void>;
  startLearning:(courseId:string,campaignId?:string)=>Promise<void>; updateLearningProgress:(courseId:string,progress:number,campaignId?:string)=>Promise<void>;
  completeLearningContent:(courseId:string,campaignId?:string)=>Promise<void>;
  completeModuleQuiz:(courseId:string,score:number,answers?:number[],campaignId?:string)=>Promise<void>;
  startAssessment:(id:string)=>Promise<boolean>; completeAssessment:(score:number,id?:string)=>Promise<void>;
  recordSimulationEvent:(campaignId:string,event:'opened'|'clicked'|'credentialAttempted'|'reported'|'noAction')=>Promise<void>;
  resetDemo:()=>Promise<void>;
}

const emptyState:ProductState = {
  employeeScore:0, previousEmployeeScore:0, organizationScore:0, previousOrganizationScore:0,
  quizCompleted:false, phishingReports:0, campaigns:[], notifications:[], assignments:[], assessments:[],
  certificates:[], simulations:[], quizAttempts:[], events:[],
  scoreSignals:{knowledge:0,behavior:0,reporting:0,improvement:0}, assessmentResult:null,
};

const ProductContext=createContext<ProductContextValue|null>(null);

export function ProductProvider({children}:{children:React.ReactNode}) {
  const {user}=useAuth();
  const [state,setState]=useState<ProductState>(emptyState);
  const [loading,setLoading]=useState(false);
  const [loadedFor,setLoadedFor]=useState<string|null>(null);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState('');

  const refresh=useCallback(async()=>{
    if(!user){setState(emptyState);setLoadedFor(null);setLoading(false);return;}
    setLoading(true);setError('');
    try{const response=await apiRequest<{state:ProductState}>('/api/product-state');setState(response.state);setLoadedFor(user.id);}
    catch(requestError){setError(requestError instanceof Error?requestError.message:'Data tidak dapat dimuat.');}
    finally{setLoading(false);}
  },[user]);

  useEffect(()=>{void refresh()},[refresh]);

  const mutate=useCallback(async<T,>(action:string,payload:unknown):Promise<T|null>=>{
    setPending(true);setError('');
    try{
      const response=await apiRequest<{state:ProductState;result:T|null}>(`/api/product-actions/${action}`,{method:'POST',body:JSON.stringify(payload)});
      setState(response.state);return response.result;
    }catch(requestError){setError(requestError instanceof Error?requestError.message:'Perubahan tidak dapat disimpan.');return null;}
    finally{setPending(false);}
  },[]);

  const value=useMemo<ProductContextValue>(()=>({
    ...state,loading,ready:!user||loadedFor===user.id,pending,error,clearError:()=>setError(''),refresh,
    createCampaign:async(campaign)=>{const response=await mutate<{id:string}>('createCampaign',{campaign});return response?.id??null},
    updateCampaignStatus:async(id,status)=>{await mutate('updateCampaignStatus',{id,status})},
    launchCampaign:async(id)=>{await mutate('launchCampaign',{id})},
    assignLearning:async(assignment)=>{await mutate('assignLearning',{assignment})},
    startLearning:async(courseId,campaignId)=>{await mutate('startLearning',{courseId,...(campaignId?{campaignId}:{})})},
    updateLearningProgress:async(courseId,progress,campaignId)=>{await mutate('updateLearningProgress',{courseId,progress,...(campaignId?{campaignId}:{})})},
    completeLearningContent:async(courseId,campaignId)=>{await mutate('completeLearningContent',{courseId,...(campaignId?{campaignId}:{})})},
    completeModuleQuiz:async(courseId,score,answers=[],campaignId)=>{await mutate('completeModuleQuiz',{courseId,score,answers,...(campaignId?{campaignId}:{})})},
    completePhishingQuiz:()=>{void mutate('completePhishingQuiz',{})},
    startAssessment:async(id)=>Boolean(await mutate<{started:boolean}>('startAssessment',{id})),
    completeAssessment:async(score,id)=>{await mutate('completeAssessment',{score,...(id?{id}:{})})},
    recordSimulationEvent:async(campaignId,event)=>{await mutate('recordSimulationEvent',{campaignId,event})},
    reportPhishing:async()=>{await mutate('reportPhishing',{})},resetDemo:async()=>{await mutate('resetDemo',{})},
  }),[error,loadedFor,loading,mutate,pending,refresh,state,user]);

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProduct(){const context=useContext(ProductContext);if(!context)throw new Error('useProduct must be used inside ProductProvider');return context}
