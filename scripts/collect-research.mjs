import { readJson, writeJson, inferTags, normalizeText } from './content-lib.mjs';

const config = await readJson('research-sources.json');
const rules = await readJson('tag-rules.json');
const published = await readJson('research.json');
const inbox = await readJson('research-inbox.json');
const known = new Set([...published, ...inbox].flatMap(item => [item.pmid, normalizeDoi(item.doi)].filter(Boolean)));
const email = process.env.NCBI_EMAIL || '';
const tool = process.env.NCBI_TOOL || 'starcove-nd-atlas';
const apiKey = process.env.NCBI_API_KEY || '';
const minDate = new Date(Date.now() - (Number(config.lookbackDays) || 14) * 86400000);
const dateRange = `${fmtDate(minDate)}:${fmtDate(new Date())}[dp]`;
let added = 0;

for (const source of config.queries || []) {
  const query = `(${source.query}) AND ${dateRange}`;
  const ids = await esearch(query, Number(config.maxPerQuery) || 80);
  if (!ids.length) continue;
  for (const batch of chunks(ids, 50)) {
    const articles = parsePubmedXml(await efetch(batch));
    for (const article of articles) {
      const doiKey = normalizeDoi(article.doi);
      if (known.has(article.pmid) || (doiKey && known.has(doiKey))) continue;
      const record = {
        id: `pubmed-${article.pmid}`,
        pmid: article.pmid,
        doi: article.doi ? `https://doi.org/${article.doi}` : null,
        sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
        publicationStatus: article.publicationStatus || 'published',
        reviewStatus: 'candidate',
        publishedDate: article.publishedDate || String(new Date().getFullYear()),
        datePrecision: article.publishedDate?.length === 10 ? 'day' : article.publishedDate?.length === 7 ? 'month' : 'year',
        year: Number((article.publishedDate || '').slice(0,4)) || new Date().getFullYear(),
        type: '研究候选',
        studyType: inferStudyType(article),
        title: article.title,
        zhTitle: '',
        authors: article.authors.join(', '),
        journal: article.journal,
        population: '',
        abstract: article.abstract,
        summary: article.abstract ? truncate(article.abstract, 420) : '候选记录尚未生成中文摘要，请人工阅读原文后填写。',
        findings: [],
        limitations: [],
        clinicalApplicability: '',
        manualTags: [],
        autoTags: [],
        relatedTopicIds: [],
        collectedBy: source.id,
        collectedAt: new Date().toISOString(),
        abstractImage: null
      };
      record.autoTags = inferTags(record, rules);
      inbox.push(record);
      known.add(article.pmid); if (doiKey) known.add(doiKey);
      added += 1;
    }
  }
}

inbox.sort((a,b) => String(b.publishedDate).localeCompare(String(a.publishedDate)) || a.title.localeCompare(b.title));
await writeJson('research-inbox.json', inbox);
console.log(`研究收集完成：新增 ${added} 条，候选箱共 ${inbox.length} 条。候选不会自动公开。`);

async function esearch(term, retmax) {
  const url = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');
  url.searchParams.set('db','pubmed'); url.searchParams.set('retmode','json'); url.searchParams.set('sort','pub date');
  url.searchParams.set('retmax',String(retmax)); url.searchParams.set('term',term); addCommon(url);
  const response = await fetch(url, { headers:{'User-Agent':`${tool}/0.5 (${email || 'no-email'})`} });
  if (!response.ok) throw new Error(`PubMed ESearch ${response.status}`);
  return (await response.json()).esearchresult?.idlist || [];
}
async function efetch(ids) {
  const url = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi');
  url.searchParams.set('db','pubmed'); url.searchParams.set('retmode','xml'); url.searchParams.set('id',ids.join(',')); addCommon(url);
  const response = await fetch(url, { headers:{'User-Agent':`${tool}/0.5 (${email || 'no-email'})`} });
  if (!response.ok) throw new Error(`PubMed EFetch ${response.status}`);
  return await response.text();
}
function addCommon(url) { url.searchParams.set('tool',tool); if (email) url.searchParams.set('email',email); if (apiKey) url.searchParams.set('api_key',apiKey); }
function parsePubmedXml(xml) {
  return [...xml.matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g)].map(match => {
    const block=match[1]; const article=tag(block,'Article') || block;
    const title=cleanXml(tag(article,'ArticleTitle'));
    const abstract=[...article.matchAll(/<AbstractText(?:\s[^>]*)?>([\s\S]*?)<\/AbstractText>/g)].map(m=>cleanXml(m[1])).join(' ');
    const journal=cleanXml(tag(article,'Title') || tag(article,'ISOAbbreviation'));
    const pmid=cleanXml(tag(block,'PMID'));
    const doi=cleanXml((block.match(/<ArticleId IdType="doi">([\s\S]*?)<\/ArticleId>/)||[])[1]||'');
    const authors=[...article.matchAll(/<Author(?:\s[^>]*)?>([\s\S]*?)<\/Author>/g)].map(m=>{
      const a=m[1]; return cleanXml([tag(a,'ForeName'),tag(a,'LastName')].filter(Boolean).join(' ') || tag(a,'CollectiveName'));
    }).filter(Boolean);
    const pubDate=parseDate(block);
    return {pmid,title,abstract,journal,doi,authors,publishedDate:pubDate,publicationStatus:'published'};
  }).filter(a=>a.pmid&&a.title);
}
function tag(block,name){return (block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`))||[])[1]||'';}
function cleanXml(value=''){return decodeEntities(String(value).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());}
function decodeEntities(value){return value.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));}
function parseDate(block){
  const history=(block.match(/<PubMedPubDate PubStatus="pubmed">([\s\S]*?)<\/PubMedPubDate>/)||[])[1]||tag(block,'PubDate');
  const y=cleanXml(tag(history,'Year'))||String(new Date().getFullYear()); const m=monthNumber(cleanXml(tag(history,'Month'))); const d=cleanXml(tag(history,'Day'));
  return d&&m?`${y}-${m}-${String(d).padStart(2,'0')}`:m?`${y}-${m}`:y;
}
function monthNumber(value){if(!value)return'';if(/^\d+$/.test(value))return String(value).padStart(2,'0');const m={jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};return m[value.slice(0,3).toLowerCase()]||'';}
function inferStudyType(a){const t=normalizeText(`${a.title} ${a.abstract}`);if(t.includes('systematic review')||t.includes('meta analysis'))return'系统综述/荟萃分析候选';if(t.includes('randomized')||t.includes('randomised'))return'随机对照研究候选';if(t.includes('review'))return'综述候选';if(t.includes('fmri')||t.includes('magnetic resonance'))return'脑影像研究候选';if(t.includes('eeg')||t.includes('erp'))return'EEG/ERP研究候选';return'研究文章候选';}
function normalizeDoi(value=''){return String(value).replace(/^https?:\/\/(dx\.)?doi\.org\//i,'').trim().toLowerCase();}
function fmtDate(d){return `${d.getUTCFullYear()}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${String(d.getUTCDate()).padStart(2,'0')}`;}
function chunks(arr,n){const out=[];for(let i=0;i<arr.length;i+=n)out.push(arr.slice(i,i+n));return out;}
function truncate(s,n){const x=String(s).trim();return x.length>n?`${x.slice(0,n).trim()}…`:x;}
