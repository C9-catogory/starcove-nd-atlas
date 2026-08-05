import { applyAll, initAccessibility } from './accessibility.js';
import { bindRouter, externalCanonical, getRoute, navigate } from './router.js';
import { exportPersonal, importPersonal, personal, saveNote, saveProfile, toggleFavorite, toggleResource } from './store.js';
import { copyText, downloadJson, escapeHtml, truncate } from './utils.js';
import { createRenderer } from './render.js';

const content=window.STARCOVE_CONTENT,main=document.querySelector('#main'),toast=document.querySelector('#toast'),settings=document.querySelector('#settings-dialog'),mobileNav=document.querySelector('#mobile-nav-dialog');
let renderer,toastTimer,noteTimer;
boot();
function boot(){
 try{
  assertContent();renderer=createRenderer(content);initAccessibility();bindGlobalEvents();bindRouter(render);render();
 }catch(error){console.error(error);main.innerHTML=`<div class="startup-error"><h1>网站启动失败</h1><p>${escapeHtml(error.message)}</p><p>请在GitHub Actions中运行 <code>npm test</code>，或下载完整代码包后重新部署。</p></div>`}
}
function assertContent(){if(!content||!Array.isArray(content.topics)||!Array.isArray(content.research)||!Array.isArray(content.intro))throw new Error('内容数据缺失或构建未完成。')}
function bindGlobalEvents(){
 document.addEventListener('click',e=>{
  const link=e.target.closest('[data-route]');if(link&&isPlainClick(e)){e.preventDefault();navigate(link.dataset.route||'/');if(mobileNav.open)mobileNav.close();return}
  const query=e.target.closest('[data-query]');if(query){navigate(`/search?q=${encodeURIComponent(query.dataset.query)}`);return}
  const fav=e.target.closest('[data-save-topic]');if(fav){const saved=toggleFavorite(fav.dataset.saveTopic);fav.classList.toggle('saved',saved);fav.textContent=saved?'★ 已收藏':'☆ 收藏';showToast(saved?'已收藏主题':'已取消收藏');return}
  const res=e.target.closest('[data-save-resource]');if(res){const saved=toggleResource(res.dataset.saveResource);res.classList.toggle('saved',saved);res.textContent=saved?'★ 已收藏':'☆ 收藏';showToast(saved?'已收藏资源':'已取消收藏');return}
  const copy=e.target.closest('[data-copy-route]');if(copy){copyText(externalCanonical(copy.dataset.copyRoute)).then(()=>showToast('页面链接已复制'));return}
 });
 document.querySelector('#header-search-form').addEventListener('submit',e=>{e.preventDefault();const q=new FormData(e.currentTarget).get('q')?.toString().trim()||'';navigate(`/search?q=${encodeURIComponent(q)}`)});
 document.querySelector('#open-settings').addEventListener('click',()=>openDialog(settings));document.querySelector('#open-mobile-nav').addEventListener('click',()=>openDialog(mobileNav));
 window.addEventListener('online',updateOnline);window.addEventListener('offline',updateOnline);updateOnline();
}
function render(){
 const route=getRoute();main.innerHTML=renderer.renderRoute(route);document.title=titleFor(route);updateCurrentNav(route.path);bindPageEvents();applyAll();try{main.focus({preventScroll:true})}catch{main.focus()};if(!location.hash.includes('#')||route.path!=='/')window.scrollTo({top:0,behavior:reduceMotion()?'auto':'smooth'});
}
function bindPageEvents(){
 document.querySelectorAll('[data-search-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();const q=new FormData(form).get('q')?.toString().trim()||'';navigate(`/search?q=${encodeURIComponent(q)}`)}));
 bindFilter('#topics-filter','/topics',['q','type','layer']);bindFilter('#research-filter','/research',['q','year']);bindFilter('#resource-filter','/resources',['q','section']);
 const searchForm=document.querySelector('#search-page-form');if(searchForm)searchForm.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(searchForm),p=new URLSearchParams(),q=fd.get('q')?.toString().trim();if(q)p.set('q',q);fd.getAll('kind').forEach(k=>p.append('kind',String(k)));navigate(`/search?${p}`)});
 const note=document.querySelector('[data-note-topic]');if(note)note.addEventListener('input',e=>{clearTimeout(noteTimer);const status=document.querySelector('#note-status');if(status)status.textContent='尚未保存…';noteTimer=setTimeout(()=>{saveNote(e.target.dataset.noteTopic,e.target.value);if(status)status.textContent='已保存在当前浏览器。'},350)});
 bindProfile();
}
function bindFilter(selector,path,fields){const form=document.querySelector(selector);if(!form)return;form.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(form),p=new URLSearchParams();for(const field of fields){const value=fd.get(field)?.toString().trim();if(value&&value!=='all')p.set(field,value)}navigate(`${path}${p.size?`?${p}`:''}`)})}
function bindProfile(){const form=document.querySelector('#profile-form');if(!form)return;form.addEventListener('input',e=>{if(e.target.type!=='range')return;const out=document.querySelector(`[data-profile-output="${CSS.escape(e.target.name)}"]`);if(out)out.textContent=e.target.value});document.querySelector('#profile-generate')?.addEventListener('click',()=>{const profile=profileFromForm(form);saveProfile(profile);document.querySelector('#profile-output').innerHTML=profileSummary(profile);showToast('功能画像已保存')});document.querySelector('#profile-reset')?.addEventListener('click',()=>{form.querySelectorAll('input[type=range]').forEach(x=>{x.value=50;x.dispatchEvent(new Event('input',{bubbles:true}))});saveProfile({});document.querySelector('#profile-output').innerHTML='<h2>我的神经系统使用说明</h2><p>画像已重置。</p>'})}
function profileFromForm(form){const data={};for(const input of form.querySelectorAll('input[type=range]')){const[dimension,state]=input.name.split('.');(data[dimension]||={})[state]=Number(input.value)}return data}
function profileSummary(profile){
 const labels={sensory:['感觉输入较可控','更容易接收多种感觉输入，需要过滤支持'],attention:['注意启动较灵活','更依赖外部启动或深度沉浸'],switching:['切换较灵活','切换与变化成本较高'],language:['即时语言较容易','图示、准备和书面表达更容易'],social:['隐含社交信息较容易','直接和异步信息更清楚'],body:['身体信号和能量较稳定','身体信号可能延迟或能量波动明显'],movement:['静止和动作自动化较容易','移动、节律或意识控制更重要'],interest:['兴趣分布较广','细节优先和深度钻研更明显']};
 const high=[];for(const[id,states]of Object.entries(profile)){const avg=(states.usual+states.tired+states.overload)/3;if(avg>=62)high.push({id,avg,label:labels[id][1]});else if(avg<=38)high.push({id,avg,label:labels[id][0]})}high.sort((a,b)=>Math.abs(b.avg-50)-Math.abs(a.avg-50));
 const traits=high.slice(0,4).map(x=>x.label);const strengths=[];const conditions=[];const support=[];
 if((profile.sensory?.usual||0)>60){strengths.push('可能更容易发现细节、异常或材料差异');conditions.push('低噪声、可控制刺激和单任务环境');support.push('降低背景输入并保留退出与恢复空间')}
 if((profile.attention?.usual||0)>60||(profile.interest?.usual||0)>65){strengths.push('可能适合深度研究、系统建模或长期兴趣项目');conditions.push('连续时间块、可见反馈和清楚的任务入口');support.push('使用body double、进度条、模板或外部提醒')}
 if((profile.switching?.usual||0)>60){conditions.push('提前通知变化并提供收尾步骤');support.push('减少突然打断，保留过渡时间')}
 if((profile.language?.usual||0)>60){strengths.push('可能更适合视觉、空间、图示或书面结构');conditions.push('图示先于长文字，允许先写后说');support.push('提供文字版本、模板、示例和检索时间')}
 if((profile.body?.tired||0)>60){conditions.push('弹性能量安排和低能量任务菜单');support.push('记录睡眠、疼痛、过敏、月经和体位症状，并独立医学评估')}
 return `<h2>我的神经系统使用说明</h2><div class="profile-output-grid"><article class="profile-output-card"><h3>我的特质</h3>${toList(traits.length?traits:['目前画像接近中间值，可继续在真实场景中观察。'])}</article><article class="profile-output-card"><h3>我可能擅长什么</h3>${toList(strengths.length?strengths:['能力不能只由滑块推断，需要结合兴趣、训练和环境。'])}</article><article class="profile-output-card"><h3>什么条件下更容易做到</h3>${toList(uniqueText(conditions).length?uniqueText(conditions):['清晰目标、可预测步骤和可恢复节奏。'])}</article><article class="profile-output-card"><h3>我需要什么帮助</h3>${toList(uniqueText(support).length?uniqueText(support):['把困难翻译成具体场景、功能影响和可执行请求。'])}</article></div><p class="field-help">这不是诊断或固定亚型。平常、疲劳和过载状态不同，本身就是重要信息。</p>`
}
function toList(items){return `<ul>${items.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`}function uniqueText(items){return[...new Set(items)]}
function titleFor(route){const path=route.path,parts=path.split('/').filter(Boolean);if(path==='/')return content.site.name;if(path==='/start')return`第0章｜${content.site.name}`;if(path==='/profile')return`功能支持画像｜${content.site.name}`;if(path==='/medical')return`医学地图｜${content.site.name}`;if(path==='/topics')return`百科目录｜${content.site.name}`;if(path==='/research')return`研究速递｜${content.site.name}`;if(path==='/resources')return`资源与工具｜${content.site.name}`;if(path==='/search')return`搜索｜${content.site.name}`;if(parts[0]==='topic'){const t=renderer.topicsById.get(parts[1]);return`${t?.zh||'主题'}｜${content.site.name}`}if(parts[0]==='research'){const r=renderer.researchById.get(parts[1]);return`${r?.zhTitle||r?.title||'研究'}｜${content.site.name}`}return content.site.name}
function updateCurrentNav(path){document.querySelectorAll('.desktop-nav a').forEach(a=>{const p=a.dataset.route||'/';const active=p==='/'?path==='/':path.startsWith(p);active?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current')})}
function openDialog(dialog){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','')}
function isPlainClick(e){return e.button===0&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey}
function reduceMotion(){const m=document.documentElement.dataset.motion;return m==='reduce'||(m==='system'&&matchMedia('(prefers-reduced-motion: reduce)').matches)}
function showToast(message){clearTimeout(toastTimer);toast.textContent=message;toast.hidden=false;toastTimer=setTimeout(()=>toast.hidden=true,2200)}
function updateOnline(){const banner=document.querySelector('#status-banner');if(navigator.onLine){banner.hidden=true;banner.textContent=''}else{banner.hidden=false;banner.textContent='当前离线：已加载内容仍可阅读，外部研究与资源链接可能无法打开。'}}
