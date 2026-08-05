import { applyPreset, exportPersonal, importPersonal, personal, resetSettings, updateSettings, validatedSettings } from './store.js';
import { clamp, escapeHtml } from './utils.js';
let overlay=null,lastPointerY=innerHeight*.45;
const fontMap={
 'system-sans':'-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif',
 'source-sans':'"Source Han Sans CN","Noto Sans CJK SC","Microsoft YaHei",sans-serif','simhei':'SimHei,"Microsoft YaHei",sans-serif','kaiti':'KaiTi,STKaiti,serif'
};
const enMap={arial:'Arial,Verdana,sans-serif',trebuchet:'"Trebuchet MS",Arial,sans-serif',georgia:'Georgia,"Times New Roman",serif',atkinson:'"Atkinson Hyperlegible",Arial,sans-serif',lexend:'Lexend,Arial,sans-serif',opendyslexic:'OpenDyslexic,Arial,sans-serif'};
export function initAccessibility(){overlay=document.querySelector('#reading-overlay');bindSettings();applyAll();document.addEventListener('pointermove',e=>{lastPointerY=e.clientY;positionOverlay()},{passive:true});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&validatedSettings().focusMode!=='off'){updateSettings({focusMode:'off'});applyAll();syncForm();}});}
export function applyAll(){
 const s=validatedSettings(),root=document.documentElement;
 root.dataset.theme=s.theme;root.dataset.preset=s.preset;root.dataset.motion=s.motion;root.dataset.anchor=s.anchor;root.dataset.shadow=String(s.shadow);root.dataset.emoji=String(s.emoji);
 root.style.setProperty('--font-cn',fontMap[s.cnFont]||fontMap['system-sans']);root.style.setProperty('--font-en',enMap[s.enFont]||enMap.arial);
 root.style.setProperty('--font-size',`${s.fontSize}px`);root.style.setProperty('--line-height',s.lineHeight);root.style.setProperty('--letter-spacing',`${s.letterSpacing}em`);root.style.setProperty('--paragraph-gap',`${s.paragraphGap}em`);root.style.setProperty('--column-width',`${s.columnWidth}ch`);
 root.style.setProperty('--focus-color',s.focusColor);root.style.setProperty('--focus-height',`${s.focusHeight}px`);root.style.setProperty('--mask-opacity',String(s.maskOpacity/100));
 applyReadingOverlay(s);applyAnchors(s);syncForm();
}
export function applyAnchors(settings=validatedSettings()){
 document.querySelectorAll('.reading-text').forEach(el=>{
  const original=el.dataset.originalText??el.textContent;el.dataset.originalText=original;
  if(settings.anchor==='off'&&settings.englishAnchor==='off'){el.textContent=original;return}
  el.innerHTML=decorate(original,settings.anchor,settings.englishAnchor);
 });
}
function decorate(text,mode,english){
 let html=escapeHtml(text);
 if(mode!=='off'){
  if(mode==='paragraph'||mode==='mixed')html=html.replace(/^([\u3400-\u9fff]{1,2})/u,'<span class="anchor-lead">$1</span>');
  if(mode==='sentence'||mode==='mixed')html=html.replace(/(^|[。！？!?；;]\s*)([\u3400-\u9fff]{1,2})/gu,'$1<span class="anchor-lead">$2</span>');
  if(mode==='logic'||mode==='mixed')html=html.replace(/(但是|因此|所以|如果|例如|同时|需要|可以|不能|并不|首先|其次|最后)/gu,'<span class="anchor-logic">$1</span>');
 }
 if(english==='initial')html=html.replace(/\b([A-Za-z])([A-Za-z]{2,})\b/g,'<span class="anchor-lead">$1</span>$2');
 if(english==='bionic')html=html.replace(/\b([A-Za-z]{3,})\b/g,w=>`<span class="anchor-lead">${w.slice(0,Math.ceil(w.length/2))}</span>${w.slice(Math.ceil(w.length/2))}`);
 return html;
}
function applyReadingOverlay(s){if(!overlay)return;const active=s.focusMode!=='off';overlay.hidden=!active;overlay.dataset.mode=s.focusMode;positionOverlay();}
function positionOverlay(){if(!overlay||overlay.hidden)return;overlay.style.setProperty('--focus-y',`${clamp(lastPointerY,20,innerHeight-20)}px`);}
function bindSettings(){
 document.querySelectorAll('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>{applyPreset(btn.dataset.preset);applyAll()}));
 const map={
  'setting-cn-font':['cnFont','change'],'setting-en-font':['enFont','change'],'setting-font-size':['fontSize','input'],'setting-line-height':['lineHeight','input'],'setting-letter-spacing':['letterSpacing','input'],'setting-paragraph-gap':['paragraphGap','input'],'setting-column-width':['columnWidth','input'],'setting-theme':['theme','change'],'setting-anchor':['anchor','change'],'setting-english-anchor':['englishAnchor','change'],'setting-motion':['motion','change'],'setting-emoji':['emoji','change'],'setting-shadow':['shadow','change'],'setting-focus-mode':['focusMode','change'],'setting-focus-color':['focusColor','input'],'setting-focus-height':['focusHeight','input'],'setting-mask-opacity':['maskOpacity','input']
 };
 for(const [id,[key,eventName]] of Object.entries(map))document.querySelector(`#${id}`)?.addEventListener(eventName,e=>{const el=e.currentTarget;const value=el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value;updateSettings({[key]:value,preset:key==='theme'?personal.settings.preset:'custom'});applyAll()});
 document.querySelector('#reset-settings')?.addEventListener('click',()=>{resetSettings();applyAll()});document.querySelector('#export-data')?.addEventListener('click',exportPersonal);document.querySelector('#export-data-footer')?.addEventListener('click',exportPersonal);
 document.querySelector('#import-data')?.addEventListener('change',async e=>{if(e.target.files[0]){await importPersonal(e.target.files[0]);applyAll();location.reload()}});
}
function syncForm(){const s=validatedSettings();
 const values={'setting-cn-font':s.cnFont,'setting-en-font':s.enFont,'setting-font-size':s.fontSize,'setting-line-height':s.lineHeight,'setting-letter-spacing':s.letterSpacing,'setting-paragraph-gap':s.paragraphGap,'setting-column-width':s.columnWidth,'setting-theme':s.theme,'setting-anchor':s.anchor,'setting-english-anchor':s.englishAnchor,'setting-motion':s.motion,'setting-focus-mode':s.focusMode,'setting-focus-color':s.focusColor,'setting-focus-height':s.focusHeight,'setting-mask-opacity':s.maskOpacity};
 for(const [id,value]of Object.entries(values)){const el=document.querySelector(`#${id}`);if(el)el.value=value}const e=document.querySelector('#setting-emoji');if(e)e.checked=!!s.emoji;const sh=document.querySelector('#setting-shadow');if(sh)sh.checked=!!s.shadow;
 const outs={'font-size-output':`${s.fontSize}px`,'line-height-output':s.lineHeight.toFixed(2),'letter-spacing-output':`${s.letterSpacing.toFixed(3)}em`,'paragraph-gap-output':`${s.paragraphGap.toFixed(1)}em`,'column-width-output':`${s.columnWidth}ch`,'focus-height-output':`${s.focusHeight}px`,'mask-opacity-output':`${s.maskOpacity}%`};for(const[id,value]of Object.entries(outs)){const el=document.querySelector(`#${id}`);if(el)el.textContent=value}
 document.querySelectorAll('[data-preset]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.preset===s.preset)));
}
