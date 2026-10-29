export const platforms = [
 {id:'cmd',label:'Windows CMD',short:'CMD',hint:'Windows 10 / 11 · Command Prompt'},
 {id:'ps',label:'PowerShell',short:'PowerShell',hint:'Windows · PowerShell with Windows modules'},
 {id:'mac',label:'macOS',short:'macOS',hint:'macOS · Terminal (zsh / bash)'},
 {id:'linux',label:'Linux',short:'Linux',hint:'Linux · bash / sh; packages may vary'}
];
export const categories = [
 {id:'all',label:'All commands',icon:'grid'},
 {id:'network',label:'Network setup',icon:'network'},
 {id:'system',label:'System & processes',icon:'cpu'},
 {id:'files',label:'Disk & files',icon:'folder'},
 {id:'security',label:'User & security',icon:'shield'}
];
export const fields = {
 host:{label:'Host or IP address',value:'192.168.1.50',placeholder:'printer.local or 192.168.1.50'},
 port:{label:'TCP port',value:'9100',placeholder:'1–65535',type:'number'},
 pid:{label:'Process ID',value:'1234',placeholder:'Find the PID first',type:'number'},
 path:{label:'File or folder path',value:'./',placeholder:'A local file or folder'},
 ssid:{label:'Wi-Fi profile / SSID',value:'Office WiFi',placeholder:'Exact saved network name'},
 iface:{label:'Wi-Fi interface',value:'en0',placeholder:'Confirm with networksetup -listallhardwareports'},
 user:{label:'User name',value:'alex',placeholder:'Account name'}
};
export function validateField(key,value){
 const text=String(value??'').trim();
 if(!text)return 'Enter a value.';
 if(key==='port')return /^\d+$/.test(text)&&Number(text)>=1&&Number(text)<=65535?'':'Use a whole port number from 1 to 65535.';
 if(key==='pid')return /^\d+$/.test(text)&&Number(text)>0&&Number(text)<=2147483647?'':'Use a positive process ID.';
 if(key==='iface')return /^[a-z][a-z0-9._-]{0,24}$/i.test(text)?'':'Use an interface name such as en0, without spaces or shell symbols.';
 if(key==='host'){
  if(text.length>253||!/[a-z0-9]/i.test(text)||!/^[a-z0-9.:]+(?:[a-z0-9.:-]*[a-z0-9])?$/i.test(text))return 'Use a hostname or IP address, without a URL, spaces or shell symbols.';
  if(/^[\d.]+$/.test(text)&&(!/^\d+\.\d+\.\d+\.\d+$/.test(text)||text.split('.').some(x=>Number(x)>255)))return 'Check the four parts of this IPv4 address (0–255).';
  if(text.includes(':')){try{new URL(`http://[${text}]/`);}catch{return 'Enter a valid IPv6 address.';}}
  return '';
 }
 return text.length<=240&&/^[\p{L}\p{N} _./:\\@+\-]+$/u.test(text)&&!text.startsWith('-')?'':'Use letters, numbers, spaces and normal path characters; no shell operators.';
}
const win=name=>`https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/${name}`;
const ps=name=>`https://learn.microsoft.com/en-us/powershell/module/${name}`;
const apple='https://support.apple.com/guide/terminal/welcome/mac';
const linux=(name,section='1')=>`https://man7.org/linux/man-pages/man${section}/${name}.${section}.html`;
const q=(s,p)=>p==='ps'?`'${s.replaceAll("'","''")}'`:p==='cmd'?`"${s}"`:`'${s.replaceAll("'",`'"'"'`)}'`;
const v=(template,manual,source,note='',params=[])=>({template,manual,source,note,params});
const c=(id,title,purpose,category,tags,params,result,variants,extra={})=>({id,title,purpose,category,tags,params,result,variants,...extra});
export const commands=[
 c('ping','Check device reachability','See whether a host answers an ICMP echo request.','network','ping ip offline unreachable connectivity printer offline', ['host'], 'Look for replies and packet loss. A timeout alone does not prove the device is offline: a firewall may block ICMP.',{
  cmd:v('ping -n 4 {host}','ping /?',win('ping')),
  ps:v('Test-Connection -ComputerName {host} -Count 4','Get-Help Test-Connection -Full',ps('microsoft.powershell.management/test-connection')),
  mac:v('ping -c 4 {host}','man ping','https://github.com/apple-oss-distributions/network_cmds/tree/main/ping.tproj'),
  linux:v('ping -c 4 {host}','man ping','https://github.com/iputils/iputils/blob/master/doc/ping.xml')
 },{toggle:'continuous',toggleLabel:'Continuous ping',toggleHint:'Stop with Ctrl+C. Windows PowerShell uses native ping.exe for this option.'}),
 c('tcp','Test a TCP port','Check whether a service accepts a connection on one port.','network','port socket scan tcp printer offline 9100 ipp smb 631 445 connection refused',['host','port'],'Look for TcpTestSucceeded: True or a succeeded connection. This tests the TCP listener, not print quality or the full application protocol.',{
  cmd:v('powershell.exe -NoProfile -Command "Test-NetConnection -ComputerName {host} -Port {port}"','powershell.exe -NoProfile -Command "Get-Help Test-NetConnection"',ps('nettcpip/test-netconnection'),'Starts Windows PowerShell from CMD; this is a single-port connection test.'),
  ps:v('Test-NetConnection -ComputerName {host} -Port {port}','Get-Help Test-NetConnection -Full',ps('nettcpip/test-netconnection')),
  mac:v('nc -zv -G 3 {host} {port}','man nc','https://github.com/apple-oss-distributions/netcat','macOS netcat; -G sets the TCP connection timeout.'),
  linux:v('nc -zv -w 3 {host} {port}','man nc','https://man.openbsd.org/nc','Requires OpenBSD netcat (often netcat-openbsd). Other nc implementations have different flags.')
 }),
 c('ip','Show IP configuration','Find addresses, adapters, subnet details and the gateway.','network','ipconfig ifconfig adapter ethernet address subnet dhcp mac address',['host'],'Use the active adapter, not a disconnected or virtual one. Compare the address and subnet with the device configuration.',{
  cmd:v('ipconfig /all','ipconfig /?',win('ipconfig')),
  ps:v('Get-NetIPConfiguration -Detailed','Get-Help Get-NetIPConfiguration -Full',ps('nettcpip/get-netipconfiguration')),
  mac:v('ifconfig\nroute -n get default','man ifconfig',apple,'The default route identifies the active interface; Wi-Fi is not always en0.'),
  linux:v('ip address show\nip route show default','man ip',linux('ip','8'),'Requires iproute2, standard on many Linux distributions.')
 },{params:[]}),
 c('dns','Look up a DNS name','Compare a device name with the IP address it resolves to.','network','dns nslookup name resolution domain hostname printer offline',['host'],'Confirm that the returned address belongs to the expected device. A successful lookup does not test that device’s service.',{
  cmd:v('nslookup {host}','nslookup /?',win('nslookup')),
  ps:v('Resolve-DnsName -Name {host}','Get-Help Resolve-DnsName -Full',ps('dnsclient/resolve-dnsname')),
  mac:v('dscacheutil -q host -a name {host}','man dscacheutil',apple,'Queries the macOS host lookup cache and resolver.'),
  linux:v('getent ahosts {host}','man getent',linux('getent'),'Uses the configured system name-service lookup.')
 }),
 c('flush','Flush DNS cache','Clear cached lookups before checking a changed DNS record.','network','dns flush reset cache stale name',[''], 'Run the DNS lookup again afterwards. Clearing a cache does not fix an incorrect DNS record.',{
  cmd:v('ipconfig /flushdns','ipconfig /?',win('ipconfig'),'Use an elevated Command Prompt if Windows requires it.'),
  ps:v('Clear-DnsClientCache','Get-Help Clear-DnsClientCache -Full',ps('dnsclient/clear-dnsclientcache'),'Elevation may be required.'),
  mac:v('sudo dscacheutil -flushcache\nsudo killall -HUP mDNSResponder','man dscacheutil',apple,'Administrator access. Common on recent macOS releases; verify against the installed version.'),
  linux:v('sudo resolvectl flush-caches','man resolvectl','https://www.freedesktop.org/software/systemd/man/latest/resolvectl.html','Only for systems using systemd-resolved. Other DNS services require their own procedure.')
 },{params:[],effect:'Changes cache',admin:true}),
 c('routes','Show routing table','See which interface and gateway carry traffic.','network','route routing gateway subnet default internet',[],'Check the default gateway and any more-specific route to the destination. These commands only display routes.',{
  cmd:v('route print','route /?',win('route_ws2008')),
  ps:v('Get-NetRoute | Sort-Object DestinationPrefix','Get-Help Get-NetRoute -Full',ps('nettcpip/get-netroute')),
  mac:v('netstat -rn','man netstat','https://github.com/apple-oss-distributions/network_cmds/tree/main/netstat.tproj'),
  linux:v('ip route show','man ip-route',linux('ip-route','8'))
 }),
 c('neighbors','Show ARP / neighbor table','Match a local network IP address to its hardware address.','network','arp mac address neighbor duplicate ip physical hardware',[],'An entry may appear only after recent communication. Neighbor information is for the local network; it is not an inventory of every device.',{
  cmd:v('arp -a','arp /?',win('arp')),
  ps:v('Get-NetNeighbor','Get-Help Get-NetNeighbor -Full',ps('nettcpip/get-netneighbor')),
  mac:v('arp -a','man arp','https://github.com/apple-oss-distributions/network_cmds/tree/main/arp.tproj'),
  linux:v('ip neigh show','man ip-neighbour',linux('ip-neighbour','8'))
 }),
 c('trace','Trace the network path','Find the responding hops on the route to a host.','network','traceroute tracert path routing latency hop',['host'],'Asterisks mean a probe did not receive a response; routers may filter probes even when the destination is reachable.',{
  cmd:v('tracert -d {host}','tracert /?',win('tracert')),
  ps:v('Test-NetConnection -ComputerName {host} -TraceRoute','Get-Help Test-NetConnection -Full',ps('nettcpip/test-netconnection')),
  mac:v('traceroute -n {host}','man traceroute','https://github.com/apple-oss-distributions/network_cmds/tree/main/traceroute.tproj'),
  linux:v('tracepath {host}','man tracepath','https://github.com/iputils/iputils/blob/master/doc/tracepath.xml','Requires iputils tracepath; may be a separate package.')
 }),
 c('ports','List listening TCP ports','Identify local TCP listeners and their owning process.','network','open ports netstat ss lsof listener connection process port',['port'],'LISTEN / LISTENING is a local listener. A listener can still be blocked by a firewall. Compare the PID with the process list.',{
  cmd:v('netstat -ano -p tcp','netstat /?',win('netstat'),'Includes active connections; look for LISTENING.'),
  ps:v('Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess','Get-Help Get-NetTCPConnection -Full',ps('nettcpip/get-nettcpconnection')),
  mac:v('lsof -nP -iTCP -sTCP:LISTEN','man lsof','https://github.com/lsof-org/lsof','Without sudo, some other users’ processes may not be visible.'),
  linux:v('ss -ltnp','man ss',linux('ss','8'),'Process names may require elevated access for other users.')
 },{toggle:'portFilter',toggleLabel:'Filter by TCP port',toggleHint:'Shows matches for the selected port; CMD text filtering can include remote endpoints.'}),
 c('wifi','List saved Wi-Fi profiles','See the network profiles already stored on the computer.','network','wifi wireless wlan ssid profile saved network',[],'Profile names are saved configurations. They do not establish that the computer is currently connected.',{
  cmd:v('netsh wlan show profiles','netsh wlan show profiles',win('netsh-wlan')),
  ps:v('netsh.exe wlan show profiles','netsh.exe wlan show profiles',win('netsh-wlan')),
  mac:v('networksetup -listpreferredwirelessnetworks {iface}','man networksetup',apple,'First run networksetup -listallhardwareports to find the Wi-Fi Device. Replace the example en0 if yours differs.',['iface']),
  linux:v('nmcli -f NAME,TYPE connection show','man nmcli','https://networkmanager.dev/docs/api/latest/nmcli.html','Requires NetworkManager; includes non-Wi-Fi connection profiles too.')
 }),
 c('wifi-key','View a saved Wi-Fi key','Retrieve a stored network key from an authorized computer.','security','wifi password key ssid wireless saved credentials',['ssid'],'The output can contain a password. Keep it out of screenshots, tickets and shared logs. This does not recover an unknown network key.',{
  cmd:v('netsh wlan show profile name={ssid} key=clear','netsh wlan show profile',win('netsh-wlan'),'Administrator access may be required; availability can depend on Windows policy.'),
  ps:v('netsh.exe wlan show profile name={ssid} key=clear','netsh.exe wlan show profile',win('netsh-wlan'),'Administrator access may be required.'),
  mac:v('security find-generic-password -D "AirPort network password" -a {ssid} -w','man security','https://github.com/apple-oss-distributions/Security','Reads a matching Keychain item if present and allowed. macOS may request Keychain authorization.'),
  linux:v('nmcli --show-secrets connection show {ssid}','man nmcli','https://networkmanager.dev/docs/api/latest/nmcli.html','Requires NetworkManager and permission to read that connection’s stored secrets.')
 },{effect:'Reveals a saved key',admin:true}),
 c('processes','List running processes','Find a process name and its ID before investigating it.','system','process tasklist ps cpu memory task manager running',[],'Match the name, PID and owner. PIDs change when a process restarts.',{
  cmd:v('tasklist','tasklist /?',win('tasklist')),
  ps:v('Get-Process | Sort-Object CPU -Descending | Select-Object -First 20 Id, ProcessName, CPU','Get-Help Get-Process -Full',ps('microsoft.powershell.management/get-process'),'CPU is cumulative CPU time, not an instantaneous utilization percentage.'),
  mac:v('ps aux','man ps',apple),
  linux:v('ps aux','man ps',linux('ps'))
 }),
 c('stop','Stop a process by PID','Request process termination after confirming its identity.','system','kill terminate stop taskkill frozen hung process',['pid'],'Confirm the process and save work first. On Unix, TERM requests orderly shutdown; force mode uses KILL. Windows termination behavior is application-dependent.',{
  cmd:v('taskkill /PID {pid}','taskkill /?',win('taskkill'),'Stopping another user’s process may require administrator access.'),
  ps:v('Stop-Process -Id {pid} -Confirm','Get-Help Stop-Process -Full',ps('microsoft.powershell.management/stop-process'),'PowerShell displays a confirmation; this is not a guarantee of graceful shutdown.'),
  mac:v('kill -TERM {pid}','man kill',apple),
  linux:v('kill -TERM {pid}','man kill',linux('kill'))
 },{toggle:'force',toggleLabel:'Force termination',toggleHint:'May discard unsaved work. On Unix this sends SIGKILL.',effect:'Stops a process'}),
 c('system','Show OS information','Confirm the operating system and build before choosing a fix.','system','os version build uname systeminfo platform hardware',[],'Record the OS build when comparing a procedure with its documented compatibility.',{
  cmd:v('systeminfo','systeminfo /?',win('systeminfo')),
  ps:v('Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version, BuildNumber','Get-Help Get-CimInstance -Full',ps('cimcmdlets/get-ciminstance')),
  mac:v('sw_vers\nuname -m','man sw_vers',apple),
  linux:v('cat /etc/os-release\nuname -r','man os-release','https://www.freedesktop.org/software/systemd/man/latest/os-release.html')
 }),
 c('services','List background services','Inspect service state before taking further action.','system','service daemon background spooler printing cups',[],'Find the relevant service and its current state. These commands do not restart or reconfigure it.',{
  cmd:v('sc query type= service state= all','sc /?',win('sc-query')),
  ps:v('Get-Service | Sort-Object DisplayName','Get-Help Get-Service -Full',ps('microsoft.powershell.management/get-service')),
  mac:v('launchctl list','man launchctl',apple,'Shows services in the current launch context, not every system domain.'),
  linux:v('systemctl list-units --type=service --all','man systemctl','https://www.freedesktop.org/software/systemd/man/latest/systemctl.html','Only for Linux systems running systemd.')
 }),
 c('hostname','Show computer name','Identify the machine from the active session.','system','hostname computer name identity device',[],'Compare the local name with the device inventory. A local hostname may differ from a DNS alias.',{
  cmd:v('hostname','hostname /?',win('hostname')),
  ps:v('$env:COMPUTERNAME','Get-Help about_Environment_Variables',ps('microsoft.powershell.core/about/about_environment_variables')),
  mac:v('scutil --get ComputerName\nhostname','man scutil',apple),
  linux:v('hostname','man hostname',linux('hostname'))
 }),
 c('disk','Check free disk space','Find volumes that are running low on free space.','files','disk full space storage df free volume drive',[],'Compare available space with the volume size. Low free space can affect updates, temporary files and print spooling.',{
  cmd:v('powershell.exe -NoProfile -Command "Get-Volume | Select-Object DriveLetter, FileSystemLabel, SizeRemaining, Size"','powershell.exe -NoProfile -Command "Get-Help Get-Volume"',ps('storage/get-volume'),'Runs the Windows Storage PowerShell module; values are in bytes.'),
  ps:v('Get-Volume | Select-Object DriveLetter, FileSystemLabel, SizeRemaining, Size','Get-Help Get-Volume -Full',ps('storage/get-volume'),'Values are in bytes.'),
  mac:v('df -h','man df',apple),
  linux:v('df -h','man df',linux('df'))
 }),
 c('list','List files in a folder','Inspect a directory, including hidden entries.','files','ls dir folder files hidden directory',['path'],'Check filenames and modification times before opening or changing anything.',{
  cmd:v('dir /a {path}','dir /?',win('dir')),
  ps:v('Get-ChildItem -LiteralPath {path} -Force','Get-Help Get-ChildItem -Full',ps('microsoft.powershell.management/get-childitem')),
  mac:v('ls -la -- {path}','man ls',apple),
  linux:v('ls -la -- {path}','man ls',linux('ls'))
 }),
 c('read','Read a text file','Display a log or configuration file without editing it.','files','cat type read text log config file',['path'],'Use a text-file path. The command prints the whole file; avoid large or sensitive logs in shared terminals.',{
  cmd:v('type {path}','type /?',win('type')),
  ps:v('Get-Content -LiteralPath {path}','Get-Help Get-Content -Full',ps('microsoft.powershell.management/get-content')),
  mac:v('cat -- {path}','man cat',apple),
  linux:v('cat -- {path}','man cat',linux('cat'))
 },{defaults:{path:'./service.log'}}),
 c('hash','Calculate a SHA-256 file hash','Compare a downloaded file or backup with its expected hash.','files','checksum sha256 hash verify backup integrity file',['path'],'Compare the full SHA-256 value with a trusted expected value. A matching hash verifies bytes, not whether a file is safe.',{
  cmd:v('certutil -hashfile {path} SHA256','certutil -?',win('certutil')),
  ps:v('Get-FileHash -LiteralPath {path} -Algorithm SHA256','Get-Help Get-FileHash -Full',ps('microsoft.powershell.utility/get-filehash')),
  mac:v('shasum -a 256 -- {path}','man shasum',apple),
  linux:v('sha256sum -- {path}','man sha256sum',linux('sha256sum'))
 },{defaults:{path:'./backup.zip'}}),
 c('location','Show the current folder','Check where relative file paths will be resolved.','files','pwd cd location directory current working path',[],'Relative paths such as ./service.log start from this directory.',{
  cmd:v('cd','cd /?',win('cd')),
  ps:v('Get-Location','Get-Help Get-Location -Full',ps('microsoft.powershell.management/get-location')),
  mac:v('pwd','man pwd',apple),
  linux:v('pwd','man pwd',linux('pwd'))
 }),
 c('identity','Show the current user','Confirm the account running this terminal.','security','whoami user identity account permissions login',[],'Use the account context when investigating permission errors. This does not list passwords.',{
  cmd:v('whoami /all','whoami /?',win('whoami')),
  ps:v('whoami.exe /all','whoami.exe /?',win('whoami')),
  mac:v('id','man id',apple),
  linux:v('id','man id',linux('id'))
 }),
 c('permissions','Inspect file permissions','Read access rights without changing them.','security','permissions access denied acl rights file ownership',['path'],'Inspect the owner and access entries. Avoid changing permissions until the required access is understood.',{
  cmd:v('icacls {path}','icacls /?',win('icacls')),
  ps:v('Get-Acl -LiteralPath {path} | Format-List','Get-Help Get-Acl -Full',ps('microsoft.powershell.security/get-acl')),
  mac:v('ls -lde -- {path}','man ls',apple,'The -e flag displays macOS ACL entries.'),
  linux:v('ls -ld -- {path}','man ls',linux('ls'),'For extended POSIX ACL details, use getfacl if installed.')
 }),
 c('firewall','Inspect firewall status','Check the active host firewall without switching it off.','security','firewall blocked security port access connection',[],'Check active profiles or policy. A successful TCP test is stronger evidence than assuming a firewall rule permits traffic.',{
  cmd:v('netsh advfirewall show allprofiles','netsh advfirewall /?',win('netsh-advfirewall')),
  ps:v('Get-NetFirewallProfile | Select-Object Name, Enabled, DefaultInboundAction, DefaultOutboundAction','Get-Help Get-NetFirewallProfile -Full',ps('netsecurity/get-netfirewallprofile')),
  mac:v('/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate','man socketfilterfw',apple,'Shows the macOS application firewall, not every packet-filter or third-party firewall rule.'),
  linux:v('sudo nft list ruleset','man nft','https://netfilter.org/projects/nftables/manpage.html','Requires nftables and elevated access. UFW/firewalld are frontends; legacy iptables setups may differ.')
 },{admin:true}),
 c('sessions','Show signed-in sessions','Inspect currently logged-in users.','security','users sessions signed in logged login',[],'Review active sessions and their source where available. Session details can be private.',{
  cmd:v('query user','query user /?',win('query-user'),'Availability depends on Windows edition and permissions.'),
  ps:v('quser.exe','quser.exe /?',win('query-user'),'Availability depends on Windows edition and permissions.'),
  mac:v('who','man who',apple),
  linux:v('who','man who',linux('who'))
 })
];
export function buildCommand(item,platform,values={},toggle=false){
 const variant=item.variants[platform];if(!variant)throw new Error('Unsupported platform.');
 const params={...Object.fromEntries(Object.entries(fields).map(([key,f])=>[key,f.value])),...item.defaults,...values};
 for(const key of new Set([...item.params,...variant.params])){const error=validateField(key,params[key]);if(error)throw new Error(`${fields[key].label}: ${error}`);params[key]=String(params[key]).trim();}
 let text=variant.template;
 if(toggle&&item.id==='ping')text=platform==='cmd'?'ping -t {host}':platform==='ps'?'ping.exe -t {host}':'ping {host}';
 if(toggle&&item.id==='stop')text=platform==='cmd'?'taskkill /F /PID {pid}':platform==='ps'?'Stop-Process -Id {pid} -Force -Confirm':'kill -KILL {pid}';
 if(toggle&&item.id==='ports'){
  const error=validateField('port',params.port);if(error)throw new Error(error);
  text=platform==='cmd'?'netstat -ano -p tcp | findstr /C:":{port} "':platform==='ps'?'Get-NetTCPConnection -State Listen -LocalPort {port}':platform==='mac'?'lsof -nP -iTCP:{port} -sTCP:LISTEN':"ss -ltnp 'sport = :{port}'";
 }
 return text.replace(/\{(\w+)\}/g,(_,key)=>['host','port','pid'].includes(key)?params[key]:q(params[key],platform));
}
function distance(a,b){const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const saved=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=saved;}}return row[b.length];}
export function searchCommands(query,category='all',favorites=null){
 const tokens=query.toLowerCase().trim().split(/\s+/).filter(Boolean).slice(0,12);
 return commands.map(item=>{if(category!=='all'&&item.category!==category)return null;if(favorites&&!favorites.includes(item.id))return null;
  const title=item.title.toLowerCase(),words=`${title} ${item.purpose} ${item.tags} ${item.category} ${categories.find(c=>c.id===item.category).label}`.toLowerCase().split(/[^a-z0-9]+/);let score=0;
  for(const token of tokens){if(title.includes(token)){score+=6;continue;}if(words.some(w=>w.includes(token))){score+=3;continue;}const near=token.length>=4&&token.length<=24?words.find(w=>Math.abs(w.length-token.length)<=1&&distance(token,w)<=1):null;if(near){score+=title.includes(near)?4:1;continue;}return null;}return {item,score};
 }).filter(Boolean).sort((a,b)=>b.score-a.score).map(x=>x.item);
}
export const workflow=[
 {id:'ip',title:'Start with your connection',body:'Check the active adapter, local IP and gateway. Compare them with the printer’s network settings.',question:'Is the computer on the expected network?'},
 {id:'ping',title:'Check basic reachability',body:'Use the printer’s IP address. Replies support IP reachability; no reply can also mean ICMP filtering.',question:'Does the IP address respond?'},
 {id:'dns',title:'Compare name and address',body:'If the IP works but the printer name does not, check that the name resolves to the correct IP.',question:'Does the name point to this printer?'},
 {id:'tcp',title:'Test the configured print port',body:'Use the port configured on this printer: commonly 9100 (RAW), 631 (IPP), or 515 (LPD). A TCP connection is not a successful print test.',question:'Is the configured service accepting connections?'},
 {id:'routes',title:'Follow the evidence',body:'If the service is unreachable, inspect routes and firewall policy. If it is reachable, check the queue, driver, print protocol and device panel.',question:'What does the result narrow down?'}
];
