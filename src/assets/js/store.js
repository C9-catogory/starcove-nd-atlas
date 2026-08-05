import { clamp, downloadJson } from './utils.js';
const KEY='starcove_nd_atlas_personal_v3';
const defaults={
 version:3,favorites:[],resourceFavorites:[],notes:{},profile:{},
 settings:{preset:'default',theme:'calm',cnFont:'system-sans',enFont:'arial',fontSize:18,lineHeight:1.75,letterSpacing:.01,paragraphGap:1,columnWidth:76,anchor:'off',englishAnchor:'off',motion:'system',emoji:true,shadow:true,focusMode:'off',focusColor:'#ffe58f',focusHeight:88,maskOpacity:45}
};
export const presetValues={
 default:{theme:'calm',fontSize:18,lineHeight:1.75,letterSpacing:.01,paragraphGap:1,columnWidth:76,motion:'system',emoji:true,shadow:true},
 spacious:{theme:'calm',fontSize:21,lineHeight:2,letterSpacing:.02,paragraphGap:1.35,columnWidth:62,motion:'reduce',emoji:true,shadow:false},
 paper:{theme:'paper',fontSize:19,lineHeight:1.9,letterSpacing:.012,paragraphGap:1.2,columnWidth:70,motion:'reduce',emoji:true,shadow:false},
 'low-stim':{theme:'paper',fontSize:19,lineHeight:1.95,letterSpacing:.015,paragraphGap:1.25,columnWidth:64,motion:'reduce',emoji:false,shadow:false},
 night:{theme:'dark',fontSize:19,lineHeight:1.9,letterSpacing:.012,paragraphGap:1.15,columnWidth:70,motion:'reduce',emoji:true,shadow:false},
 contrast:{theme:'contrast',fontSize:20,lineHeight:1.9,letterSpacing:.02,paragraphGap:1.2,columnWidth:68,motion:'reduce',emoji:false,shadow:false}
};
export let personal=load();
function storageGet(){try{return localStorage.getItem(KEY)}catch{return null}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(personal))}catch{} }
function merge(raw){
 const p=structuredClone(defaults);if(!raw||typeof raw!=='object')return p;
 return {...p,...raw,favorites:Array.isArray(raw.favorites)?[...new Set(raw.favorites)]:[],resourceFavorites:Array.isArray(raw.resourceFavorites)?[...new Set(raw.resourceFavorites)]:[],notes:raw.notes&&typeof raw.notes==='object'?raw.notes:{},profile:raw.profile&&typeof raw.profile==='object'?raw.profile:{},settings:{...p.settings,...(raw.settings||{})}};
}
function load(){try{return merge(JSON.parse(storageGet()||'null'))}catch{return structuredClone(defaults)}}
export function updateSettings(patch){personal.settings={...personal.settings,...patch};save();}
export function applyPreset(name){const values=presetValues[name]||presetValues.default;personal.settings={...personal.settings,...values,preset:name};save();}
export function resetSettings(){personal.settings=structuredClone(defaults.settings);save();}
export function toggleFavorite(id){const set=new Set(personal.favorites);set.has(id)?set.delete(id):set.add(id);personal.favorites=[...set];save();return set.has(id)}
export function toggleResource(id){const set=new Set(personal.resourceFavorites);set.has(id)?set.delete(id):set.add(id);personal.resourceFavorites=[...set];save();return set.has(id)}
export function saveNote(id,value){personal.notes[id]=value;save();}
export function saveProfile(value){personal.profile=value;save();}
export function exportPersonal(){downloadJson(`starcove-personal-${new Date().toISOString().slice(0,10)}.json`,personal)}
export async function importPersonal(file){const raw=JSON.parse(await file.text());personal=merge(raw);save();return personal}
export function validatedSettings(){const s=personal.settings;return {...s,fontSize:clamp(s.fontSize,14,30),lineHeight:clamp(s.lineHeight,1.25,2.4),letterSpacing:clamp(s.letterSpacing,0,.1),paragraphGap:clamp(s.paragraphGap,.5,2.5),columnWidth:clamp(s.columnWidth,42,100),focusHeight:clamp(s.focusHeight,36,220),maskOpacity:clamp(s.maskOpacity,0,80)};}
