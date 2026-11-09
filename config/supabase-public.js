// Public project identifiers supplied by the project owner. These are safe in
// the browser bundle; secret/service-role keys must stay in Vercel settings.
const project={
 url:'https://twpicuqymaqanptwwevy.supabase.co',
 key:'sb_publishable_ABAY8y0kGy4qdyWEo0Ol5w_ByfsCgnU',
};
export function publicSupabase({url,key}={}){
 const selectedURL=url||project.url;
 // A different project must supply its own matching publishable key.
 return {url:selectedURL,key:key||(selectedURL===project.url?project.key:undefined)};
}
