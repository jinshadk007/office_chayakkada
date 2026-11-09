import { randomUUID } from 'node:crypto';
export const defaults={tea:1200,coffee:2000,black:1000,lemon:1500};
export function fresh(company){return {company,orders:[],ledger:[],prices:{...defaults},sponsor:null};}
const text=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
export function change(room,action){
 const name=text(action.name,60),now=new Date().toISOString();
 switch(action.type){
 case 'add': {
 if(!name||!Object.hasOwn(defaults,action.drink)||!Number.isInteger(action.qty)||action.qty<1||action.qty>50)throw Error('Enter a name, drink, and quantity from 1 to 50.');
 if(room.orders.length>=200)throw Error('This round is full. Finish it before adding more.');
 room.orders.push({id:randomUUID(),name,drink:action.drink,qty:action.qty,note:text(action.note,100),unitPrice:room.prices[action.drink],createdAt:now});break;}
 case 'remove':room.orders=room.orders.filter(o=>o.id!==action.id);break;
 case 'sponsor':if(!name)throw Error('Enter the sponsor’s name.');room.sponsor={name};break;
 case 'unsponsor':room.sponsor=null;break;
 case 'prices':for(const id of Object.keys(defaults)){const p=action.prices?.[id];if(!Number.isInteger(p)||p<0||p>100000)throw Error('Prices must be between ₹0 and ₹1,000.');}room.prices={...action.prices};break;
 case 'finish':{
 if(!room.orders.length)throw Error('This round has already been finished.');
 const total=room.orders.reduce((s,o)=>s+o.qty*o.unitPrice,0);
 if(room.sponsor){room.ledger.push({id:randomUUID(),name:room.sponsor.name,amount:total,type:'charge',description:`Sponsored ${room.orders.reduce((s,o)=>s+o.qty,0)} drinks`,at:now});}
 else for(const o of room.orders)room.ledger.push({id:randomUUID(),name:o.name,amount:o.qty*o.unitPrice,type:'charge',description:`${o.qty} × ${o.drink}${o.note?' · '+o.note:''}`,at:now});
 room.orders=[];room.sponsor=null;break;}
 case 'payment':{
 const balance=room.ledger.filter(e=>e.name.toLocaleLowerCase()===name.toLocaleLowerCase()).reduce((s,e)=>s+(e.type==='charge'?e.amount:-e.amount),0);
 if(!name||!Number.isInteger(action.amount)||action.amount<=0||action.amount>balance)throw Error('Payment must be more than zero and no more than the balance.');
 room.ledger.push({id:randomUUID(),name,amount:action.amount,type:'payment',description:'Payment recorded',at:now});break;}
 case 'undoPayment':room.ledger=room.ledger.filter(e=>!(e.id===action.id&&e.type==='payment'));break;
 default:throw Error('Unknown action.');
 }return room;
}
