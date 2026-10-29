import {validateField} from './commands.js?v=2';
export const mailSources={google:'https://developers.google.com/workspace/gmail/imap/imap-smtp',microsoft:'https://learn.microsoft.com/en-us/exchange/mail-flow-best-practices/how-to-set-up-a-multifunction-device-or-application-to-send-email-using-microsoft-365-or-office-365',printer:'https://manuals.konicaminolta.eu/bizhub-C268i/EN/contents/WC_05_01.html',dns:'https://developers.google.com/speed/public-dns/docs/doh/json'};
export function normalizeDomain(input){
 let value=String(input??'').trim();if(value.includes('@')){if(value.split('@').length!==2||!value.split('@')[0])throw new Error('Enter one email address or a domain.');value=value.split('@')[1];}
 if(!value||/[\s/:?#\\]/.test(value))throw new Error('Use a domain such as example.com, without a URL or port.');
 value=value.replace(/\.$/,'').toLowerCase();try{value=new URL('https://'+value).hostname;}catch{throw new Error('Check the domain name.');}
 const labels=value.split('.');if(value.length>253||labels.length<2||/^\d+(\.\d+)+$/.test(value)||labels.some(x=>x.length<1||x.length>63||!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(x)))throw new Error('Enter a public domain name, such as example.com.');
 return value;
}
export function dnsQuery(input){const domain=normalizeDomain(input);return 'https://dns.google/resolve?'+new URLSearchParams({name:domain,type:'MX',edns_client_subnet:'0.0.0.0/0'});}
export function parseMx(payload){
 if(!payload||typeof payload.Status!=='number')throw new Error('The DNS service returned an unreadable response.');
 if(payload.Status===3)throw new Error('This domain was not found in public DNS. Check the spelling.');
 if(payload.Status!==0)throw new Error('DNS could not answer this lookup. Try again, or use the MX command below.');
 if(payload.TC)throw new Error('The DNS answer was truncated. Use a local DNS tool for the complete answer.');
 const answers=Array.isArray(payload.Answer)?payload.Answer:[];const records=[];
 for(const answer of answers.slice(0,100)){if(answer.type!==15||typeof answer.data!=='string')continue;const match=answer.data.trim().match(/^(\d{1,5})\s+(\S+)$/);if(!match||Number(match[1])>65535)continue;const priority=Number(match[1]),host=match[2].toLowerCase().replace(/\.$/,'');if(match[2]==='.'&&priority===0){records.push({priority,host:'.'});continue;}try{normalizeDomain(host);}catch{continue;}if(!records.some(x=>x.host===host&&x.priority===priority))records.push({priority,host});}
 records.sort((a,b)=>a.priority-b.priority||a.host.localeCompare(b.host));
 const nullMx=records.length===1&&records[0].host==='.';const mixedNull=records.some(x=>x.host==='.')&&!nullMx;
 return {records:records.slice(0,25),nullMx,mixedNull,provider:nullMx?'No incoming mail service':identifyReceiving(records),dnssec:payload.AD===true};
}
export function identifyReceiving(records){
 const hosts=records.filter(x=>x.host!=='.').map(x=>x.host);
 if(!hosts.length)return 'No explicit MX records';
 const services=new Set(hosts.map(h=>h==='smtp.google.com'||h==='aspmx.l.google.com'||h.endsWith('.aspmx.l.google.com')||h==='gmail-smtp-in.l.google.com'||h.endsWith('.gmail-smtp-in.l.google.com')?'Google':h.endsWith('.mail.protection.outlook.com')?'Microsoft 365':/^mx[12]\.improvmx\.com$/.test(h)?'ImprovMX':h.endsWith('.mx.cloudflare.net')?'Cloudflare Email Routing':'Unidentified / custom route'));
 return [...services].join(' + ');
}
export const sendingProfiles={
 google:{name:'Gmail / Google Workspace submission',host:'smtp.gmail.com',port:'587',encryption:'STARTTLS',note:'Provider reference, not a detected account setting. Authentication must follow Google’s current policy. Printer support for OAuth or an eligible app password depends on the account and device.',source:mailSources.google},
 microsoft:{name:'Microsoft 365 client submission',host:'smtp.office365.com',port:'587',encryption:'STARTTLS',note:'Provider reference, not a detected tenant setting. SMTP AUTH / OAuth and mailbox policy must permit this method. Microsoft 365 relay and Direct Send are different setups; confirm the chosen method with IT.',source:mailSources.microsoft}
};
export function printerConsoleUrl(host,protocol='https'){
 const value=String(host??'').trim(),error=validateField('host',value);if(error)throw new Error(error);if(!['http','https'].includes(protocol))throw new Error('Choose HTTP or HTTPS.');return protocol+'://'+(value.includes(':')?'['+value+']':value)+'/';
}
export function validateSmtp(host,port){return validateField('host',host)||validateField('port',port);}
