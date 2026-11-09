import {randomBytes,scrypt as scryptCallback,timingSafeEqual,createHmac} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(scryptCallback);
export class AccessError extends Error{constructor(message,status=401){super(message);this.status=status;}}
export async function passwordAccess(password){
 if(typeof password!=='string'||password.length<6||password.length>128)throw new AccessError('Use a company password with 6–128 characters.',400);
 const salt=randomBytes(16).toString('hex');
 return {salt,hash:(await scrypt(password,salt,32)).toString('hex'),failed:0,windowStart:0};
}
export async function matchesPassword(password,access){
 if(typeof password!=='string'||password.length>128||!access?.salt||!access?.hash)return false;
 const expected=Buffer.from(access.hash,'hex'),actual=await scrypt(password,access.salt,32);
 return expected.length===actual.length&&timingSafeEqual(expected,actual);
}
function signature(id,expires,hash){return createHmac('sha256',Buffer.from(hash,'hex')).update('chayakkada-room-session:'+id+':'+expires).digest('base64url');}
export function sessionToken(id,access,now=Date.now()){
 const expires=Math.floor(now/1000)+7*24*60*60;
 return `${id}.${expires}.${signature(id,expires,access.hash)}`;
}
export function requireRoomAccess(req,id,access,now=Date.now()){
 const header=req.headers?.authorization;
 if(typeof header!=='string'||!header.startsWith('Bearer ')||!access?.hash)throw new AccessError('Enter your company password to open this workspace.');
 const [room,expires,mac,...extra]=header.slice(7).split('.');
 if(extra.length||room!==id||!/^\d+$/.test(expires||'')||Number(expires)<=Math.floor(now/1000)||!mac)throw new AccessError('Enter your company password again.');
 const expected=Buffer.from(signature(id,expires,access.hash)),actual=Buffer.from(mac);
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw new AccessError('Enter your company password again.');
}
export function publicRoom(room){if(!room)return room;const {_access,...data}=room.data;return {...room,data};}
