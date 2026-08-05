import { loadAllContent } from './content-lib.mjs';

const data = await loadAllContent();
const errors = [];
const warnings = [];
const allowedTypes = new Set(['condition','function','model','support','experience','resource']);
const allowedReview = new Set(['reviewed','candidate','draft','archived']);

function unique(items, label) {
  const ids = new Set();
  for (const item of items) {
    if (!item?.id) errors.push(`${label} 缺少 id`);
    else if (ids.has(item.id)) errors.push(`${label} ID 重复：${item.id}`);
    else ids.add(item.id);
  }
  return ids;
}
function isUrl(value) {
  try { const url = new URL(value); return ['http:','https:'].includes(url.protocol); } catch { return false; }
}
function dateLike(value) { return /^\d{4}(?:-\d{2}-\d{2})?$/.test(String(value || '')); }

const layerIds = unique(data.layers, 'layer');
const topicIds = unique(data.topics, 'topic');
const introIds = unique(data.intro, 'intro');
const researchIds = unique(data.research, 'research');
const inboxIds = unique(data.researchInbox, 'research-inbox');
const systemIds = unique(data.medicalSystems, 'medical-system');
const resourceIds = unique(data.resources.flatMap(section => section.items || []), 'resource');

for (const page of data.intro) {
  for (const field of ['title','summary','visual','sections']) if (!page[field]) errors.push(`intro ${page.id} 缺少 ${field}`);
  if (!Array.isArray(page.sections) || !page.sections.length) errors.push(`intro ${page.id} 没有 sections`);
}

for (const topic of data.topics) {
  for (const field of ['zh','title','type','role','mechanism','plainSummary','notEqual','layer','lastReviewed','reviewStatus']) {
    if (!topic[field]) errors.push(`topic ${topic.id} 缺少 ${field}`);
  }
  if (!allowedTypes.has(topic.type)) errors.push(`topic ${topic.id} type 无效：${topic.type}`);
  if (!layerIds.has(topic.layer?.id)) errors.push(`topic ${topic.id} 引用了不存在的 layer：${topic.layer?.id}`);
  if (topic.medicalSystemId && !systemIds.has(topic.medicalSystemId)) errors.push(`topic ${topic.id} 引用了不存在的 medical system：${topic.medicalSystemId}`);
  for (const id of topic.relatedTopicIds || []) if (!topicIds.has(id)) errors.push(`topic ${topic.id} relatedTopicId 无效：${id}`);
  for (const id of topic.researchIds || []) if (!researchIds.has(id)) errors.push(`topic ${topic.id} researchId 无效：${id}`);
  for (const source of topic.sourceRefs || []) {
    if (!source.title || !isUrl(source.url)) errors.push(`topic ${topic.id} sourceRefs 无效`);
  }
  if (topic.type === 'condition' && !(topic.redFlags || []).length) warnings.push(`医学 topic ${topic.id} 没有 redFlags`);
  if (topic.type === 'condition' && !(topic.sourceRefs || []).length) warnings.push(`医学 topic ${topic.id} 仍未录入直接来源`);
}

for (const system of data.medicalSystems) {
  for (const id of system.topicIds || []) if (!topicIds.has(id)) errors.push(`medical system ${system.id} topicId 无效：${id}`);
}

for (const record of [...data.research, ...data.researchInbox]) {
  for (const field of ['title','journal','studyType','summary']) if (!record[field]) errors.push(`research ${record.id} 缺少 ${field}`);
  if (record.publishedDate && !dateLike(record.publishedDate)) errors.push(`research ${record.id} publishedDate 格式无效：${record.publishedDate}`);
  if (record.doi && !isUrl(record.doi)) errors.push(`research ${record.id} DOI URL 无效：${record.doi}`);
  if (record.sourceUrl && !isUrl(record.sourceUrl)) errors.push(`research ${record.id} sourceUrl 无效`);
  if (record.reviewStatus && !allowedReview.has(record.reviewStatus)) errors.push(`research ${record.id} reviewStatus 无效：${record.reviewStatus}`);
  for (const id of record.relatedTopicIds || []) if (!topicIds.has(id)) errors.push(`research ${record.id} relatedTopicId 无效：${id}`);
}
for (const id of inboxIds) if (researchIds.has(id)) errors.push(`research inbox 与正式库 ID 冲突：${id}`);

for (const section of data.resources) {
  if (!section.id || !section.title) errors.push('资源分组缺少 id/title');
  for (const item of section.items || []) {
    if (!item.name || !isUrl(item.url)) errors.push(`resource ${item.id || item.name} 名称或 URL 无效`);
    if (!item.lastChecked) warnings.push(`resource ${item.id} 缺少 lastChecked`);
  }
}
for (const entry of data.problemNav) {
  for (const id of entry.topicIds || []) if (!topicIds.has(id)) errors.push(`problemNav ${entry.label} topicId 无效：${id}`);
}

if (warnings.length) console.warn(`内容警告（${warnings.length}）：\n- ${warnings.join('\n- ')}`);
if (errors.length) {
  console.error(`内容校验失败（${errors.length}）：\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`内容校验通过：${topicIds.size} topics，${introIds.size} intro，${researchIds.size} reviewed research，${resourceIds.size} resources。`);
