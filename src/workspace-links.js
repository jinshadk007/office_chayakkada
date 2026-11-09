const roomPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function workspacePath(value,origin){
 if(typeof value!=='string')return null;
 const input=value.trim();
 if(roomPattern.test(input))return '/?room='+input;
 try{const url=new URL(input,origin),room=url.searchParams.get('room');return url.origin===origin&&url.pathname==='/'&&roomPattern.test(room||'')?'/?room='+room:null;}catch{return null;}
}
