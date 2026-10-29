import {commands,platforms,categories,fields,validateField,buildCommand,searchCommands,workflow} from './commands.js';
const $=id=>document.getElementById(id);
const icons={grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',network:'<rect x="8" y="3" width="8" height="6" rx="1"/><path d="M12 9v5M5 17v-3h14v3"/><rect x="2" y="17" width="6" height="4" rx="1"/><rect x="16" y="17" width="6" height="4" rx="1"/>',cpu:'<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3"/>',folder:'<path d="M3 6h7l2 3h9v11H3z"/><path d="M3 9V4h7l2 2h8v3"/>',shield:'<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6z"/><path d="m8 12 3 3 5-6"/>',copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>'};
function icon(name){const node=document.createElementNS('http://www.w3.org/2000/svg','svg');node.setAttribute('viewBox','0 0 24 24');node.setAttribute('aria-hidden','true');node.innerHTML=icons[name];return node;}
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;}
function readSetting(name,fallback){try{return JSON.parse(localStorage.getItem('command-desk-'+name))??fallback;}catch{return fallback;}}
function saveSetting(name,value){try{localStorage.setItem('command-desk-'+name,JSON.stringify(value));}catch{}}
let platform=readSetting('platform','cmd');if(!platforms.some(p=>p.id===platform))platform='cmd';
let favorites=readSetting('saved',[]);if(!Array.isArray(favorites))favorites=[];favorites=[...new Set(favorites.filter(id=>commands.some(c=>c.id===id)))];
let category='all',savedOnly=false,selected='tcp',values={},toggle=false,page=0,compare=false,mode='library',toastTimer;
const pageSize=7;
$('copy-icon').append(icon('copy'));
function current(){return commands.find(c=>c.id===selected);}
function results(){return searchCommands($('search').value,category,savedOnly?favorites:null);}
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,2600);}
function setCategory(id){savedOnly=id==='saved';category=savedOnly?'all':id;page=0;setMode('library');render();}
function renderNav(){
 $('categories').replaceChildren();
 if(!$('mobile-category').options.length){for(const cat of categories){const option=el('option');option.value=cat.id;$('mobile-category').append(option);}const option=el('option');option.value='saved';$('mobile-category').append(option);}
 for(const cat of categories){const count=cat.id==='all'?commands.length:commands.filter(x=>x.category===cat.id).length;
  const button=el('button','nav-item'+(!savedOnly&&category===cat.id?' active':''));button.type='button';button.append(icon(cat.icon),el('span','',cat.label),el('span','nav-count',String(count)));button.setAttribute('aria-pressed',String(!savedOnly&&category===cat.id));button.addEventListener('click',()=>setCategory(cat.id));$('categories').append(button);
  [...$('mobile-category').options].find(x=>x.value===cat.id).textContent=`${cat.label} (${count})`;
 }
 [...$('mobile-category').options].find(x=>x.value==='saved').textContent=`Saved commands (${favorites.length})`;$('mobile-category').value=savedOnly?'saved':category;
 $('saved-count').textContent=favorites.length;$('favorites-button').classList.toggle('active',savedOnly);$('favorites-button').setAttribute('aria-pressed',String(savedOnly));$('workflow-button').classList.toggle('active',mode==='guide');
}
function renderPlatforms(){
 const selector=$('detail-platform');if(selector){if(!selector.options.length)for(const p of platforms){const option=el('option','',p.label);option.value=p.id;selector.append(option);}selector.value=platform;}
 $('platforms').replaceChildren();for(const p of platforms){const b=el('button','',p.short);b.id='platform-'+p.id;b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected',String(p.id===platform));b.tabIndex=p.id===platform?0:-1;b.addEventListener('click',()=>setPlatform(p.id));b.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const index=platforms.findIndex(x=>x.id===p.id);const target=event.key==='Home'?0:event.key==='End'?platforms.length-1:(index+(event.key==='ArrowRight'?1:-1)+platforms.length)%platforms.length;setPlatform(platforms[target].id);$('platform-'+platform).focus();});$('platforms').append(b);}
 $('platform-note').textContent=platforms.find(x=>x.id===platform).hint;
}
function setPlatform(id){platform=id;saveSetting('platform',platform);renderPlatforms();renderList();renderParameters();renderCode();}
function toggleFavorite(id){favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];saveSetting('saved',favorites);renderNav();renderList();renderSave();toast(favorites.includes(id)?'Command saved on this device.':'Command removed from saved.');}
function renderSave(){const saved=favorites.includes(selected);$('save-current').textContent=saved?'★':'☆';$('save-current').setAttribute('aria-pressed',String(saved));$('save-current').setAttribute('aria-label',saved?'Remove this saved command':'Save this command');}
function renderList(){
 const found=results();page=Math.max(0,Math.min(page,Math.max(0,Math.ceil(found.length/pageSize)-1)));
 $('library-title').firstChild.textContent=savedOnly?'Saved commands ':categories.find(x=>x.id===category).label+' ';
 $('result-count').textContent=found.length;$('command-list').replaceChildren();$('empty-state').hidden=found.length!==0;$('pagination').hidden=found.length<=pageSize;
 $('empty-state').querySelector('h3').textContent=savedOnly?'No saved commands yet':'No matching commands';$('empty-state').querySelector('p').textContent=savedOnly?'Use the star beside a command to keep it close.':'Try a shorter task such as “DNS”, “port” or “process”.';
 for(const item of found.slice(page*pageSize,(page+1)*pageSize)){
  const card=el('article','command-card'+(selected===item.id?' selected':''));const head=el('div','card-head');const open=el('button','open-command',item.title);open.type='button';open.setAttribute('aria-label',`Open ${item.title}`);open.setAttribute('aria-pressed',String(selected===item.id));open.addEventListener('click',()=>selectCommand(item.id,true));const star=el('button','card-save',favorites.includes(item.id)?'★':'☆');star.type='button';star.setAttribute('aria-label',`Save ${item.title}`);star.setAttribute('aria-pressed',String(favorites.includes(item.id)));star.addEventListener('click',()=>toggleFavorite(item.id));head.append(open,star);
  let code='';try{code=buildCommand(item,platform);}catch{code='Choose a parameter to build this command.';}
  const pre=el('div','card-code',code.replaceAll('\n',' · '));pre.setAttribute('aria-hidden','true');const bottom=el('div','card-bottom');bottom.append(el('span',item.effect?'card-effect':'',item.effect||categories.find(x=>x.id===item.category).label),el('span','',selected===item.id?'IN WORKBENCH':platforms.find(x=>x.id===platform).short));card.append(head,el('p','',item.purpose),pre,bottom);$('command-list').append(card);
 }
 $('previous-page').disabled=page===0;$('next-page').disabled=(page+1)*pageSize>=found.length;$('page-label').textContent=`${page*pageSize+1}–${Math.min((page+1)*pageSize,found.length)} of ${found.length}`;
 $('workbench').hidden=mode==='guide'||found.length===0;
}
function renderParameters(){
 const item=current();$('parameter-fields').replaceChildren();
 const required=[...new Set([...item.params,...item.variants[platform].params])];if(item.id==='ports'&&!required.includes('port'))required.push('port');
 $('parameters').hidden=required.length===0&&!item.toggle;
 for(const key of required){const spec=fields[key];const label=el('label',key==='host'?'host-field':'',spec.label);const input=document.createElement('input');input.id='param-'+key;input.name=key;input.type=spec.type||'text';input.value=values[key]??item.defaults?.[key]??spec.value;input.placeholder=spec.placeholder;input.autocomplete='off';input.spellcheck=false;input.maxLength=key==='host'?253:240;input.setAttribute('aria-describedby','validation-error');if(spec.type==='number'){input.min='1';input.max=key==='port'?'65535':'2147483647';input.step='1';}input.addEventListener('input',()=>{values[key]=input.value;renderCode();});label.append(input);$('parameter-fields').append(label);}
 $('toggle-field').hidden=!item.toggle;$('toggle-label').textContent=item.toggleLabel||'';$('toggle-hint').textContent=item.toggleHint||'';$('command-toggle').checked=toggle;
}
function renderDetail(){
 const item=current();$('command-category').textContent=categories.find(x=>x.id===item.category).label;$('command-title').textContent=item.title;$('command-purpose').textContent=item.purpose;$('command-result').textContent=item.result;
 $('command-badges').replaceChildren(el('span',item.effect?'changes':'',item.effect||'Diagnostic / read only'));
 if(item.admin)$('command-badges').append(el('span','changes','Permission may be required'));
 renderParameters();renderSave();renderCode();
}
function renderCode(){
 const item=current(),variant=item.variants[platform];$('code-shell').textContent=platforms.find(x=>x.id===platform).label;$('code-extension').textContent=platform==='cmd'?'.cmd':platform==='ps'?'.ps1':'.sh';
 let code='',error='';try{code=buildCommand(item,platform,values,toggle);}catch(e){error=e.message;}
 $('generated-code').textContent=error?'Complete the parameter fields to build this command.':code;$('validation-error').textContent=error;$('validation-error').hidden=!error;$('copy-command').disabled=!!error;
 for(const input of $('parameter-fields').querySelectorAll('input'))input.setAttribute('aria-invalid',String(!!validateField(input.name,input.value)));
 $('command-requirement').textContent=variant.note||'Use the terminal shown above. Check the local help for options supported by your installed version.';
 $('manual-command').textContent=variant.manual;$('reference-link').href=variant.source;
 $('comparison').hidden=!compare;$('compare-button').setAttribute('aria-expanded',String(compare));$('compare-button').textContent=compare?'Hide comparison':'Compare commands';$('comparison').replaceChildren();
 if(compare)for(const p of platforms){const panel=el('div','compare-card');let text='';try{text=buildCommand(item,p.id,values,toggle);}catch{text='Complete valid parameters first.';}const button=el('button','',`Copy ${p.short}`);button.type='button';button.disabled=!!error;button.addEventListener('click',()=>copyText(text));panel.append(el('h3','',p.label),el('pre','',text),button);$('comparison').append(panel);}
}
function selectCommand(id,scroll=false,overrides={}){
 selected=id;values={...overrides};toggle=false;setMode('library');renderList();renderDetail();
 if(scroll){$('workbench').classList.add('mobile-active');$('workbench').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});$('command-title').tabIndex=-1;$('command-title').focus({preventScroll:true});}
}
function render(){renderNav();renderPlatforms();const found=results();if(found.length&&!found.some(x=>x.id===selected)){selected=found[0].id;values={};toggle=false;}renderList();renderDetail();$('clear-search').hidden=!$('search').value;}
async function copyText(text){try{await navigator.clipboard.writeText(text);toast('Command copied. Paste it into your terminal.');}catch{const area=el('textarea');area.value=text;area.setAttribute('readonly','');area.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';document.body.append(area);area.select();let copied=false;try{copied=document.execCommand('copy');}catch{}area.remove();if(copied)toast('Command copied.');else toast('Copy was blocked. Select the command text and copy it.');}}
function setMode(next){mode=next;$('field-guide').hidden=next!=='guide';$('library').hidden=next==='guide';$('workbench').hidden=next==='guide';$('workflow-button').classList.toggle('active',next==='guide');}
function openGuide(){setMode('guide');renderNav();$('field-guide').scrollIntoView({behavior:'smooth',block:'start'});}
function renderGuide(){const holder=$('guide-steps');holder.replaceChildren();workflow.forEach((step,index)=>{const article=el('article','guide-step');const content=el('div');const button=el('button','',`Build command · ${commands.find(c=>c.id===step.id).title}`);button.type='button';button.addEventListener('click',()=>{const host=$('guide-host').value.trim(),port=$('guide-port').value;const error=validateField('host',host)||validateField('port',port);$('guide-error').textContent=error;$('guide-error').hidden=!error;if(error){$('guide-host').focus();return;}category='all';savedOnly=false;$('search').value='';page=Math.floor(commands.findIndex(x=>x.id===step.id)/pageSize);selectCommand(step.id,true,{host,port});renderNav();});content.append(el('h3','',step.title),el('p','',step.body),el('p','guide-question',step.question),button);article.append(el('span','step-number',String(index+1).padStart(2,'0')),content);holder.append(article);});}
$('search').addEventListener('input',()=>{page=0;setMode('library');render();});
$('clear-search').addEventListener('click',()=>{$('search').value='';page=0;render();$('search').focus();});
for(const button of document.querySelectorAll('[data-query]'))button.addEventListener('click',()=>{category='all';savedOnly=false;page=0;$('search').value=button.dataset.query;setMode('library');render();});
$('mobile-category').addEventListener('change',e=>setCategory(e.target.value));$('favorites-button').addEventListener('click',()=>setCategory('saved'));
$('detail-platform').addEventListener('change',e=>setPlatform(e.target.value));
$('previous-page').addEventListener('click',()=>{page--;renderList();$('library').scrollIntoView({behavior:'smooth'});});$('next-page').addEventListener('click',()=>{page++;renderList();$('library').scrollIntoView({behavior:'smooth'});});
$('save-current').addEventListener('click',()=>toggleFavorite(selected));$('command-toggle').addEventListener('change',e=>{toggle=e.target.checked;renderCode();});
$('parameters').addEventListener('submit',e=>e.preventDefault());$('reset-parameters').addEventListener('click',()=>{values={};toggle=false;renderParameters();renderCode();});
$('copy-command').addEventListener('click',()=>{try{copyText(buildCommand(current(),platform,values,toggle));}catch{renderCode();}});
$('compare-button').addEventListener('click',()=>{compare=!compare;renderCode();});$('workflow-button').addEventListener('click',openGuide);$('close-guide').addEventListener('click',()=>{setMode('library');render();$('library').scrollIntoView({behavior:'smooth'});});
$('reset-filters').addEventListener('click',()=>{category='all';savedOnly=false;$('search').value='';page=0;render();});
$('back-to-results').addEventListener('click',()=>{$('workbench').classList.remove('mobile-active');$('library').scrollIntoView({behavior:'smooth',block:'start'});const button=$('command-list').querySelector('.selected .open-command');button?.focus({preventScroll:true});});
$('about-button').addEventListener('click',()=>$('about-dialog').showModal());$('about-dialog').addEventListener('click',e=>{if(e.target===$('about-dialog')){const r=$('about-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('about-dialog').close();}});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('about-dialog').open){e.preventDefault();$('search').focus();}});
renderGuide();render();
