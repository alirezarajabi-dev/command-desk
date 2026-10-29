import {messages} from './translations.js?v=2';
import './translations-extra.js?v=2';
let language='en';
const lower=new Map([...messages].map(([k,v])=>[k.toLowerCase(),v]));
export const initialLanguage=()=> 'en';
export const currentLanguage=()=>language;
const digits=(value,lang)=>lang==='fa'?String(value).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):String(value);
export function translate(text,lang=language){
 if(lang==='en'||!['fa','fr'].includes(lang))return text;
 const raw=String(text),key=raw.trim().replace(/\s+/g,' '),found=messages.get(key)||lower.get(key.toLowerCase());
 let value=found?.[lang];
 const walk=s=>translate(s,lang);
 if(value===undefined){let m;
  if(/^\d+$/.test(key))value=digits(key,lang);
  else if((m=key.match(/^(.*) \((\d+)\)$/)))value=`${walk(m[1])} (${digits(m[2],lang)})`;
  else if((m=key.match(/^(\d+)–(\d+) of (\d+)$/)))value=lang==='fa'?`${digits(m[1],lang)} تا ${digits(m[2],lang)} از ${digits(m[3],lang)}`:`${m[1]}–${m[2]} sur ${m[3]}`;
  else if((m=key.match(/^Build command · (.+)$/)))value=(lang==='fa'?'آماده کردن دستور · ':'Préparer · ')+walk(m[1]);
  else if((m=key.match(/^Open (.+) console$/)))value=lang==='fa'?`باز کردن پنل ⁨${m[1]}⁩`:`Ouvrir la console ${m[1]}`;
  else if((m=key.match(/^Open (.+)$/)))value=(lang==='fa'?'باز کردن ':'Ouvrir : ')+walk(m[1]);
  else if((m=key.match(/^Save (.+)$/)))value=(lang==='fa'?'ذخیرهٔ ':'Enregistrer : ')+walk(m[1]);
  else if((m=key.match(/^Copy (CMD|PowerShell|macOS|Linux)$/)))value=(lang==='fa'?'کپی دستور ':'Copier : ')+m[1];
  else if((m=key.match(/^Looking up MX records for (.+)…$/)))value=lang==='fa'?`در حال بررسی MX دامنهٔ ⁨${m[1]}⁩…`:`Recherche des MX de ${m[1]}…`;
  else if((m=key.match(/^Public MX records for (.+)$/)))value=lang==='fa'?`رکوردهای عمومی MX برای ⁨${m[1]}⁩`:`Enregistrements MX publics de ${m[1]}`;
  else if((m=key.match(/^([^:]+): (.+)$/))&&(messages.has(m[1])||lower.has(m[1].toLowerCase())))value=walk(m[1])+': '+walk(m[2]);
  else if(key.includes(' + '))value=key.split(' + ').map(walk).join(' + ');
  else value=key;
 }
 return (raw.match(/^\s*/)?.[0]||'')+value+(raw.match(/\s*$/)?.[0]||'');
}
const queryWords={
 'شبکه':'network','پرینتر':'printer','چاپگر':'printer','آفلاین':'offline','پورت':'port','پورت‌های':'ports','باز':'open','دیسک':'disk','پر':'full','پردازش':'process','پردازش‌ها':'process','رمز':'password','وای‌فای':'wifi','وایفای':'wifi','فایروال':'firewall','فایل':'file','پوشه':'folder','مسیریابی':'routing','کاربر':'user','نام':'name','آدرس':'address','کش':'cache','حافظه':'memory','مسیر':'route','پینگ':'ping',
 'réseau':'network','reseau':'network','imprimante':'printer','hors ligne':'offline','ports':'ports','ouverts':'open','disque':'disk','plein':'full','processus':'process','mot de passe':'password','pare-feu':'firewall','fichier':'file','dossier':'folder','routage':'routing','utilisateur':'user','adresse':'address','nom':'name','écoute':'listening','ecoute':'listening','mémoire':'memory'
};
export function searchInEnglish(query){let text=String(query).trim().toLowerCase().replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));for(const [en,copies] of messages)for(const lang of ['fa','fr'])if(copies[lang].toLowerCase()===text)return en;for(const [word,en] of Object.entries(queryWords).sort((a,b)=>b[0].length-a[0].length))text=text.replaceAll(word,en);return text;}
// Translate presentation text only. Never rewrite an input's value, command,
// hostname, address, source link or technical record. Original English is held
// on the node so switching languages is reversible without rebuilding forms.
export function installLanguages(){
 const sourceText=new WeakMap(),sourceAttrs=new WeakMap();let observer,scheduled=false;
 const selector=document.getElementById('language');
 const skip='script,style,code,pre,kbd,input,textarea,.brand,.card-code,.smtp-facts dd,.mx-table td,.window-dots,.step-number';
 function refresh(){
  observer?.disconnect();document.documentElement.lang=language;document.documentElement.dir=language==='fa'?'rtl':'ltr';
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
  while((n=walker.nextNode())){if(!n.data.trim()||n.parentElement?.closest(skip)||n.parentElement?.closest('#language'))continue;const old=sourceText.get(n);const source=old&&n.data===old.last?old.source:n.data;const last=translate(source);if(n.data!==last)n.data=last;sourceText.set(n,{source,last});}
  for(const element of document.body.querySelectorAll('[aria-label],[placeholder],[title]')){let saved=sourceAttrs.get(element)||{};for(const attribute of ['aria-label','placeholder','title']){if(!element.hasAttribute(attribute))continue;const now=element.getAttribute(attribute),old=saved[attribute];const source=old&&now===old.last?old.source:now;const last=translate(source);if(now!==last)element.setAttribute(attribute,last);saved[attribute]={source,last};}sourceAttrs.set(element,saved);}
  document.title=language==='fa'?'Bizkonic Command Desk — علیرضا رجبی':language==='fr'?'Bizkonic Command Desk — Alireza Rajabi':'Bizkonic Command Desk — by Alireza Rajabi';
  selector.value=language;
  observer?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title']});
 }
 function select(value){language=['en','fr','fa'].includes(value)?value:'en';refresh();}
 observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;refresh();});});
 selector.addEventListener('change',()=>select(selector.value));
 // Every new load and every return after leaving starts in English. No locale
 // is read from cookies, URLs, browser preferences or persistent storage.
 window.addEventListener('pagehide',()=>select('en'));
 window.addEventListener('pageshow',e=>{if(e.persisted)select('en');});
 select(initialLanguage());
 return {select,refresh};
}
