import { upload } from '@vercel/blob/client';
import { readFileSync } from 'node:fs';
const A='https://weshort-admin.vercel.app', S='https://weshort-ochre.vercel.app';
const api=async(m,p,b)=>{const r=await fetch(A+p,{method:m,headers:{Origin:S,...(b?{'Content-Type':'application/json'}:{})},body:b?JSON.stringify(b):undefined});
  const t=await r.text(); if(!r.ok) throw new Error(`${m} ${p} -> ${r.status} ${t.slice(0,100)}`); return t?JSON.parse(t):null;};

async function one(label, path, size){
  const file=new File([readFileSync(path)], path.split(/[\/]/).pop(), {type:'video/mp4'});
  const a=await api('POST','/api/uploads',{fileName:file.name,sizeBytes:file.size,contentType:'video/mp4',
    media:{durationSec:36,width:1920,height:1080,aspectRatio:'16:9',container:'MP4',videoCodec:'',audioCodec:'',frameRate:0}});
  let seen=[];
  const res=await upload(file.name,file,{access:'public',handleUploadUrl:`${A}/api/uploads/blob`,
    contentType:'video/mp4',multipart:true,
    onUploadProgress:({percentage})=>{seen.push(Math.floor(percentage));}});
  console.log(`  ${label}: progress went ${seen.filter((v,i)=>i===0||v!==seen[i-1]).join(' -> ')}`);
  const at=await api('POST',`/api/uploads/${a.id}/attach`,{url:res.url,sizeBytes:file.size});
  console.log(`  ${label}: attach -> ${at.status}`);
  return a.id;
}

console.log('uploading a film and a trailer at the same time:');
const ids = await Promise.all([
  one('film   ', process.argv[2]),
  one('trailer', process.argv[3]),
]);
for (const id of ids) { await api('DELETE', `/api/uploads/${id}`); }
console.log('  cleaned up');
