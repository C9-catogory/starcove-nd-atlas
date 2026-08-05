import { normalize, tokenize, unique } from './utils.js';
const index=window.STARCOVE_SEARCH_INDEX||[];
const kindBoost={intro:9,'medical-system':8,topic:7,research:6,resource:4};
export function search(query,{kinds=[],limit=180}={}){
 const terms=expandTerms(tokenize(query));if(!terms.length)return[];
 const allowed=new Set(kinds.filter(Boolean));
 const results=[];
 for(const row of index){
  if(allowed.size&&!allowed.has(row.kind))continue;
  const score=scoreRow(row,terms);if(score<=0)continue;
  results.push({...row,score,terms,matchReason:reason(row,terms)});
 }
 return results.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'zh-CN')).slice(0,limit);
}
function scoreRow(row,terms){
 const title=normalize(row.title),sub=normalize(row.subtitle),body=row.normalized||'';let score=kindBoost[row.kind]||0;
 for(const term of terms){
  if(title===term)score+=70;else if(title.includes(term))score+=35;
  if(sub.includes(term))score+=18;
  if((row.tags||[]).some(tag=>normalize(tag).includes(term)))score+=16;
  const occurrences=count(body,term);score+=Math.min(occurrences,5)*5;
  if(!body.includes(term)&&term.length>2)score-=4;
 }
 const all=terms.every(t=>body.includes(t));if(all)score+=20;
 return score;
}
function reason(row,terms){const title=normalize(row.title),sub=normalize(row.subtitle),tags=(row.tags||[]).map(normalize);if(terms.some(t=>title.includes(t)||sub.includes(t)))return'标题或英文标题';if(terms.some(t=>tags.some(tag=>tag.includes(t))))return'标签或分类';return'摘要、别名或正文';}
function count(text,term){if(!term)return 0;let i=0,n=0;while((i=text.indexOf(term,i))>=0){n++;i+=term.length}return n;}
function expandTerms(terms){
 const synonyms={
  '听不清':['听觉处理','噪声中听语','听力'], '关机':['shutdown','失语','冻结'], '眼前发黑':['体位','pots','低血压'],
  '小水泡':['汗疱疹','水疱'], '风团':['荨麻疹'], '声音疼':['听觉过敏','hyperacusis'], '鼻子堵':['鼻塞','鼻炎','鼻窦'],
  '脑雾':['疲劳','工作记忆','自主神经'], '拖延':['启动困难','执行功能'], '读不进去':['阅读困难','认知负荷','工作记忆']
 };
 return unique(terms.flatMap(term=>[term,...(synonyms[term]||[]).flatMap(tokenize)]));
}
export function availableSearchTags(content){return unique(content.research.flatMap(r=>[...(r.manualTags||[]),...(r.autoTags||[])])).sort((a,b)=>a.localeCompare(b,'zh-CN'));}
