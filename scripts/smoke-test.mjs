import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { readJson, rootDir } from './content-lib.mjs';

const dist = path.join(rootDir, 'dist');
const requiredDist = [
  'index.html','assets/config.js','assets/content-data.js','assets/search-data.js',
  'assets/js/app.js','assets/js/render.js','assets/js/search.js','assets/js/utils.js','assets/css/site.css'
];
for (const file of requiredDist) await access(path.join(dist,file));
for (const file of ['.github/workflows/pages.yml','.github/workflows/validate.yml','.github/workflows/research-collect.yml']) await access(path.join(rootDir,file));

const index = await readFile(path.join(dist,'index.html'),'utf8');
if (index.includes('__BASE_PATH__') || index.includes('__SITE_TAGLINE__')) throw new Error('index.html 仍有未替换占位符');
if (!index.includes('帮助神经多样性人群理解自己并找到可行帮助')) throw new Error('首页定位句没有进入构建结果');

const app = await readFile(path.join(dist,'assets/js/app.js'),'utf8');
if (!app.includes('bindPageEvents')) throw new Error('app.js 缺少页面事件实现');
const utils = await readFile(path.join(dist,'assets/js/utils.js'),'utf8');
if (!utils.includes('<mark>')) throw new Error('关键词高亮实现缺失');
const render = await readFile(path.join(dist,'assets/js/render.js'),'utf8');
if (!render.includes('timeline-year') || !render.includes('autoTags')) throw new Error('研究时间线或自动标签渲染缺失');

const topics = await readJson('topics.json');
const conditions = topics.filter(t => t.type === 'condition');
if (conditions.some(t => !(t.sourceRefs || []).length)) throw new Error('仍有医学 condition 缺少直接来源');
const research = await readJson('research.json');
if (research.some(r => r.reviewStatus !== 'reviewed')) throw new Error('公开研究库包含未审阅记录');
if (research.some(r => !Array.isArray(r.autoTags))) throw new Error('研究缺少自动标签字段');

console.log('静态烟雾测试通过：定位句、搜索高亮、研究时间线、自动标签、医学来源与部署工作流均存在。');
