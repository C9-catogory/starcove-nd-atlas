export function escapeHtml(value='') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function escapeAttr(value='') { return escapeHtml(value); }
export function normalize(value='') { return String(value).normalize('NFKC').toLocaleLowerCase('zh-CN').replace(/[\u200b-\u200d\ufeff]/g,'').replace(/[\s\-_/|，、；：:;,.!?！？（）()\[\]【】]+/g,' ').trim(); }
export function tokenize(value='') { return [...new Set(normalize(value).split(' ').filter(Boolean))]; }
export function regexEscape(value='') { return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
export function highlight(value='', terms=[]) {
  const clean = escapeHtml(value);
  const sorted = [...new Set(terms.filter(Boolean))].sort((a,b)=>b.length-a.length);
  if (!sorted.length) return clean;
  const pattern = sorted.map(regexEscape).join('|');
  if (!pattern) return clean;
  try { return clean.replace(new RegExp(`(${pattern})`,'giu'),'<mark>$1</mark>'); } catch { return clean; }
}
export function safeColor(value, fallback='#316bb3') { return /^#[0-9a-f]{6}$/i.test(String(value)) ? value : fallback; }
export function clamp(value,min,max){ return Math.min(max,Math.max(min,Number(value))); }
export function list(items=[], className='reading-text') { return `<ul>${items.map(item=>`<li class="${className}">${escapeHtml(item)}</li>`).join('')}</ul>`; }
export function unique(items=[]) { return [...new Set(items.filter(Boolean))]; }
export function groupBy(items,keyFn){ return items.reduce((acc,item)=>{const key=keyFn(item);(acc[key] ||= []).push(item);return acc;},{}); }
export function sortChinese(a,b){ return String(a).localeCompare(String(b),'zh-CN'); }
export function dateParts(value='') { const s=String(value); return {year:s.slice(0,4)||'未知',month:s.length>=7?s.slice(5,7):''}; }
export function dateLabel(record) { const value=String(record.publishedDate||record.year||''); if(/^\d{4}-\d{2}-\d{2}$/.test(value)) return value; if(/^\d{4}-\d{2}$/.test(value)) return value.replace('-', '年')+'月'; return value ? `${value}年` : '日期未录入'; }
export function truncate(value='', length=180){ const text=String(value).trim(); return text.length>length?`${text.slice(0,length).trim()}…`:text; }
export function downloadJson(filename,data){ const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
export function copyText(text){ return navigator.clipboard?.writeText(text).catch(()=>fallbackCopy(text)) || fallbackCopy(text); }
function fallbackCopy(text){ const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();return Promise.resolve(); }
