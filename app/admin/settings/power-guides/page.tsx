import PowerGuidesWorkspace from './PowerGuidesWorkspace';
export default async function Page({searchParams}:{searchParams:Promise<{tab?:string|string[]}>}){
 const {tab}=await searchParams;
 return <PowerGuidesWorkspace initialTab={typeof tab==='string'?tab:''}/>;
}
