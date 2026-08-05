import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadAllContent, normalizeText, rootDir } from './content-lib.mjs';

const target = process.env.SITE_TARGET || 'local';
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'starcove-nd-atlas';
const owner = process.env.GITHUB_REPOSITORY?.split('/')[0] || '';
const inferredGithubBase = repository === `${owner}.github.io` ? '/' : `/${repository}/`;
const basePath = normalizeBase(process.env.SITE_BASE_PATH || (target === 'github' ? inferredGithubBase : '/'));
const routerMode = process.env.SITE_ROUTER_MODE || (target === 'netlify' ? 'history' : 'hash');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(srcDir, distDir, { recursive: true });

const content = await loadAllContent();
content.site.build = { target, basePath, routerMode, generatedAt: new Date().toISOString() };
const searchIndex = buildSearchIndex(content);

let index = await readFile(path.join(distDir, 'index.html'), 'utf8');
index = index
  .replaceAll('__BASE_PATH__', basePath)
  .replaceAll('__SITE_VERSION__', content.site.version)
  .replaceAll('__SITE_TAGLINE__', escapeAttr(content.site.tagline));
await writeFile(path.join(distDir, 'index.html'), index, 'utf8');

await mkdir(path.join(distDir, 'assets'), { recursive: true });
await writeFile(path.join(distDir, 'assets', 'config.js'), `window.STARCOVE_CONFIG=${safeJson({ basePath, routerMode, target, version: content.site.version })};\n`, 'utf8');
await writeFile(path.join(distDir, 'assets', 'content-data.js'), `window.STARCOVE_CONTENT=${safeJson(content)};\n`, 'utf8');
await writeFile(path.join(distDir, 'assets', 'search-data.js'), `window.STARCOVE_SEARCH_INDEX=${safeJson(searchIndex)};\n`, 'utf8');
await writeFile(path.join(distDir, 'content-audit.json'), `${JSON.stringify(makeAudit(content), null, 2)}\n`, 'utf8');
await writeFile(path.join(distDir, '.nojekyll'), '', 'utf8');

if (target === 'netlify') {
  await writeFile(path.join(distDir, '_redirects'), '/* /index.html 200\n', 'utf8');
}
console.log(`构建完成：target=${target} base=${basePath} router=${routerMode}，${content.topics.length} topics，${content.research.length} research。`);

function normalizeBase(value) {
  let v = String(value || '/').trim();
  if (!v.startsWith('/')) v = `/${v}`;
  if (!v.endsWith('/')) v += '/';
  return v.replace(/\/{2,}/g, '/');
}
function safeJson(value) {
  return JSON.stringify(value).replace(/<\/script/gi, '<\\/script').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
}
function escapeAttr(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function buildSearchIndex(data) {
  const rows = [];
  for (const page of data.intro) rows.push(indexRow('intro', page.id, page.title, '', [page.summary,page.visual,...page.sections.flatMap(s=>[s.heading,s.body])], ['第0章','入门导览']));
  for (const topic of data.topics) rows.push(indexRow('topic', topic.id, topic.zh, topic.title, [topic.plainSummary,topic.role,topic.mechanism,...(topic.aliases||[]),...(topic.tags||[]),...(topic.signals||[]),...(topic.supports||[])], [topic.typeLabel,topic.layer.title,topic.medicalSystemId]));
  for (const record of data.research) rows.push(indexRow('research', record.id, record.zhTitle || record.title, record.title, [record.summary,record.population,record.studyType,...(record.findings||[]),...(record.limitations||[]),...(record.manualTags||[]),...(record.autoTags||[])], ['研究',record.journal,String(record.publishedDate||record.year)]));
  for (const section of data.resources) for (const item of section.items || []) rows.push(indexRow('resource', item.id, item.name, '', [item.desc,...(item.tags||[])], ['资源',section.title,item.language]));
  for (const system of data.medicalSystems) rows.push(indexRow('medical-system', system.id, system.title, '', [system.summary,...(system.planned||[])], ['医学地图']));
  return rows;
}
function indexRow(kind,id,title,subtitle,parts,tags) {
  const joined = [title,subtitle,...parts,...tags].filter(Boolean).join(' ');
  return { kind,id,title,subtitle,summary:String(parts.find(Boolean)||''),tags:tags.filter(Boolean),normalized:normalizeText(joined) };
}
function makeAudit(data) {
  const sourceReviewedMedical = data.topics.filter(t=>t.type==='condition' && (t.sourceRefs||[]).length).length;
  return {
    generatedAt:new Date().toISOString(), version:data.site.version,
    counts:{intro:data.intro.length,topics:data.topics.length,medicalTopics:data.topics.filter(t=>t.type==='condition').length,sourceReviewedMedical,research:data.research.length,resources:data.resources.flatMap(s=>s.items||[]).length},
    notes:[
      '结构、ID、路由引用、日期和URL已通过自动校验。',
      '旧版迁移条目并不等于完成逐条医学同行评审；页面会显示来源与审阅状态。',
      '研究候选收件箱不会自动进入公开研究库。'
    ]
  };
}
