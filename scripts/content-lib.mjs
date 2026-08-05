import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const contentDir = path.join(rootDir, 'content');

export async function readJson(file) {
  return JSON.parse(await readFile(path.join(contentDir, file), 'utf8'));
}

export async function writeJson(file, value) {
  await writeFile(path.join(contentDir, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function normalizeText(value = '') {
  return String(value)
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/[\s\-_/|，、；：:;,.!?！？（）()\[\]【】]+/g, ' ')
    .trim();
}

export function inferTags(record, tagRules) {
  const blob = normalizeText([
    record.title,
    record.zhTitle,
    record.journal,
    record.studyType,
    record.population,
    record.summary,
    ...(record.findings || []),
    record.abstract
  ].filter(Boolean).join(' '));
  const tags = [];
  for (const rule of tagRules.rules || []) {
    if ((rule.keywords || []).some(keyword => blob.includes(normalizeText(keyword)))) tags.push(rule.tag);
  }
  return [...new Set(tags)].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

export async function loadAllContent({ includeInbox = true } = {}) {
  const [site, layers, intro, topics, medicalSystems, research, resources, problemNav, aliases, tagRules, researchSources] = await Promise.all([
    readJson('site.json'), readJson('layers.json'), readJson('intro.json'), readJson('topics.json'),
    readJson('medical-systems.json'), readJson('research.json'), readJson('resources.json'),
    readJson('problem-nav.json'), readJson('aliases.json'), readJson('tag-rules.json'), readJson('research-sources.json')
  ]);
  const researchInbox = includeInbox ? await readJson('research-inbox.json') : [];
  for (const topic of topics) {
    topic.aliases = [...new Set([
      topic.zh,
      topic.title,
      ...(topic.aliases || []),
      ...(aliases[topic.id] || [])
    ].filter(Boolean).map(value => String(value).trim()))];
  }
  for (const record of research) record.autoTags = inferTags(record, tagRules);
  for (const record of researchInbox) record.autoTags = inferTags(record, tagRules);
  return { site, layers, intro, topics, medicalSystems, research, researchInbox, resources, problemNav, aliases, tagRules, researchSources };
}
