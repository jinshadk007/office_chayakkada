// The browser remembers workspace-scoped sessions, never company passwords.
export function accessToken(id){try{return localStorage.getItem('tea-access:'+id)||''}catch{return ''}}
export function rememberAccess(id,token){try{localStorage.setItem('tea-access:'+id,token)}catch{}}
export function leaveWorkspace(id){try{localStorage.removeItem('tea-access:'+id)}catch{}location.assign('/');}
export function legacyToken(){try{return JSON.parse(localStorage.getItem('chayakkada-auth')||'null')?.access_token||''}catch{return ''}}
