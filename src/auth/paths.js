// Only the workspace home is a return destination. Reject external redirects.
export function safeReturnPath(value,origin){
 try{
  const url=new URL(value||'/',origin);
  if(url.origin!==origin||url.pathname!=='/')return '/';
  const room=url.searchParams.get('room');
  return room&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(room)?'/?room='+room:'/';
 }catch{return '/';}
}
