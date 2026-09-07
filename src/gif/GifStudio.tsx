import { useEffect, useMemo, useRef, useState } from 'react';
import { useGifStore } from './gifStore';
import { encodeGif } from './gifEncoder';
import { canvasObjectsToSvg, fileToDataUrl, svgToImageData } from './gifUtils';
import { useCanvasStore } from '../store/canvasStore';
import type { CanvasObject } from '../types';
import type { StoredGif } from './types';
import { Icon } from '../components/Icon';

interface Props { onClose: () => void; worldCenter?: () => { x: number; y: number }; }
type Mode = 'create' | 'library';

function captureObjectsForGif(): CanvasObject[] {
  const doc = useCanvasStore.getState().doc;
  if (!doc) return [];
  const visible = Object.values(doc.objects).filter((obj) => !obj.hidden);
  if (!visible.length) return [];
  const minX = Math.min(...visible.map((o) => o.x));
  const minY = Math.min(...visible.map((o) => o.y));
  const maxX = Math.max(...visible.map((o) => o.x + o.width));
  const maxY = Math.max(...visible.map((o) => o.y + o.height));
  const scale = Math.min(1, 440 / Math.max(1, maxX - minX), 280 / Math.max(1, maxY - minY));
  return visible.map((obj) => ({ ...structuredClone(obj), id: crypto.randomUUID(), x:20+(obj.x-minX)*scale, y:20+(obj.y-minY)*scale, width:obj.width*scale, height:obj.height*scale, createdAt:Date.now(), updatedAt:Date.now() } as CanvasObject));
}

function svgDataUrl(objects: CanvasObject[]) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(canvasObjectsToSvg(objects,480,320,'#FFFDFB'))}`;
}

export function GifStudio({ onClose }: Props) {
  const [mode,setMode]=useState<Mode>('create');
  const [playing,setPlaying]=useState(true);
  const [previewUrl,setPreviewUrl]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [urlValue,setUrlValue]=useState('');
  const fileRef=useRef<HTMLInputElement|null>(null);
  const store=useGifStore();
  const addObject=useCanvasStore(s=>s.addObject);

  useEffect(()=>{void store.load(); store.newDocument(captureObjectsForGif());},[]);

  const current=store.current;
  const selectedFrame=store.selectedFrame;
  const frame= current?.frames[selectedFrame];

  useEffect(()=>{
    if(!current||!frame)return;
    setPreviewUrl(svgDataUrl(frame.objects));
    if(!playing||current.frames.length<=1)return;
    const timer=window.setInterval(()=>store.setSelectedFrame((store.selectedFrame+1)%current.frames.length),frame.duration);
    return()=>window.clearInterval(timer);
  },[current,selectedFrame,playing,store]);

  const captureCurrent=()=>{ if(current){ store.replaceFrameObjects(selectedFrame,captureObjectsForGif()); setMessage('Captured the current canvas into this frame.'); }};

  const createGif=async()=>{
    if(!current||busy)return;
    setBusy(true);setMessage('Rendering GIF…');
    try{
      const images:ImageData[]=[];
      for(const f of current.frames) images.push(await svgToImageData(canvasObjectsToSvg(f.objects,current.width,current.height,'#FFFDFB'),current.width,current.height));
      const blob=encodeGif(images,current.frames.map(f=>f.duration),current.loop);const id=current.id;
      await store.persist({id,name:current.name,blob,document:current,createdAt:Date.now(),updatedAt:Date.now()});
      const src=URL.createObjectURL(blob);
      addObject({id:crypto.randomUUID(),type:'gif',x:120,y:120,width:current.width,height:current.height,rotation:0,zIndex:0,locked:false,hidden:false,createdAt:Date.now(),updatedAt:Date.now(),data:{src,name:current.name,source:'created',naturalWidth:current.width,naturalHeight:current.height,loop:current.loop,gifId:id}});
      setMessage('GIF created and added to the canvas.');setMode('library');
    }catch(error){setMessage(error instanceof Error?error.message:'Could not create this GIF.');}finally{setBusy(false);}
  };

  const importFile=async(file:File)=>{
    if(file.type!=='image/gif'){setMessage('Please choose a GIF file.');return;}
    if(file.size>12*1024*1024){setMessage('GIFs are limited to 12 MB in the current version.');return;}
    try{const src=await fileToDataUrl(file);const id=crypto.randomUUID();const record:StoredGif={id,name:file.name.replace(/\.gif$/i,'')||'Imported GIF',blob:file,createdAt:Date.now(),updatedAt:Date.now()};await store.persist(record);addObject({id:crypto.randomUUID(),type:'gif',x:120,y:120,width:360,height:240,rotation:0,zIndex:0,locked:false,hidden:false,createdAt:Date.now(),updatedAt:Date.now(),data:{src,name:record.name,source:'uploaded',naturalWidth:360,naturalHeight:240,loop:true,gifId:id}});setMessage('GIF imported and added to the canvas.');}catch{setMessage('Could not import this GIF.');}
  };

  const addExternal=async()=>{const value=urlValue.trim();if(!/^https?:\/\/.+/i.test(value)){setMessage('Paste a valid GIF URL.');return;}const id=crypto.randomUUID();const record:StoredGif={id,name:'External GIF',sourceUrl:value,createdAt:Date.now(),updatedAt:Date.now()};await store.persist(record);addObject({id:crypto.randomUUID(),type:'gif',x:120,y:120,width:360,height:240,rotation:0,zIndex:0,locked:false,hidden:false,createdAt:Date.now(),updatedAt:Date.now(),data:{src:value,sourceUrl:value,name:'External GIF',source:'external',naturalWidth:360,naturalHeight:240,loop:true,gifId:id}});setUrlValue('');setMessage('External GIF added to the canvas.');};

  const addStoredToCanvas=(gif:StoredGif)=>{const src=gif.blob?URL.createObjectURL(gif.blob):gif.sourceUrl||'';addObject({id:crypto.randomUUID(),type:'gif',x:120,y:120,width:gif.document?.width??360,height:gif.document?.height??240,rotation:0,zIndex:0,locked:false,hidden:false,createdAt:Date.now(),updatedAt:Date.now(),data:{src,sourceUrl:gif.sourceUrl,name:gif.name,source:gif.document?'created':gif.blob?'uploaded':'external',naturalWidth:gif.document?.width??360,naturalHeight:gif.document?.height??240,loop:gif.document?.loop??true,gifId:gif.id}});setMessage(`${gif.name} added to the canvas.`);};
  const resetCreator=()=>{store.clearCurrent();store.newDocument(captureObjectsForGif());setMessage('New GIF timeline started.');setMode('create');};
  const frameThumbs=useMemo(()=>current?.frames.map(f=>svgDataUrl(f.objects))??[],[current]);

  return <div className="gif-studio-backdrop" onClick={onClose}><div className="gif-studio" role="dialog" aria-modal="true" aria-label="GIF Studio" onClick={e=>e.stopPropagation()}>
    <header className="gif-studio-header"><div><div className="gif-studio-kicker">Creative Studio</div><h2>🎞️ GIF Studio</h2><p>Make little moving moments for your canvas.</p></div><button className="gif-studio-close" onClick={onClose} aria-label="Close GIF Studio"><Icon name="x" size={18}/></button></header>
    <div className="gif-studio-tabs"><button className={mode==='create'?'is-active':''} onClick={()=>setMode('create')}>Create GIF</button><button className={mode==='library'?'is-active':''} onClick={()=>setMode('library')}>My GIFs & Import</button></div>

    {mode==='create'&&current&&<div className="gif-create-view"><section className="gif-stage-card"><div className="gif-stage-toolbar"><button className="gif-secondary-btn" onClick={()=>setPlaying(v=>!v)}>{playing?'Ⅱ Pause':'▶ Play'}</button><span>{selectedFrame+1} / {current.frames.length}</span><label>Loop <input type="checkbox" checked={current.loop} onChange={e=>store.setLoop(e.target.checked)}/></label></div><div className="gif-stage">{previewUrl?<img src={previewUrl} alt="Current GIF frame preview"/>:<div className="gif-stage-empty">Capture the canvas to start.</div>}</div><div className="gif-stage-actions"><button className="gif-secondary-btn" onClick={captureCurrent}>↺ Capture Canvas</button><button className="gif-primary-btn" onClick={()=>void createGif()} disabled={busy}>{busy?'Rendering…':'✓ Create & Add'}</button></div></section>
      <section className="gif-timeline-card"><div className="gif-section-heading"><span>Frames</span><small>Up to 60 frames</small></div><div className="gif-timeline">{current.frames.map((f,index)=><button key={f.id} className={`gif-frame ${index===selectedFrame?'is-active':''}`} onClick={()=>store.setSelectedFrame(index)}><img src={frameThumbs[index]} alt={`Frame ${index+1}`}/><span>{String(index+1).padStart(2,'0')}</span></button>)}<button className="gif-add-frame" onClick={()=>store.addFrame(captureObjectsForGif())}>＋</button></div>{frame&&<div className="gif-frame-controls"><button onClick={()=>store.duplicateFrame(selectedFrame)}>Duplicate</button><button onClick={()=>store.deleteFrame(selectedFrame)} disabled={current.frames.length<=1}>Delete</button><button onClick={()=>store.moveFrame(selectedFrame,Math.max(0,selectedFrame-1))} disabled={selectedFrame===0}>← Move</button><button onClick={()=>store.moveFrame(selectedFrame,Math.min(current.frames.length-1,selectedFrame+1))} disabled={selectedFrame===current.frames.length-1}>Move →</button><label className="gif-duration">Delay <input type="number" min="20" max="2000" value={frame.duration} onChange={e=>store.setFrameDuration(selectedFrame,Number(e.target.value))}/> ms</label></div>}<div className="gif-hint">Tip: arrange a scene on the canvas, capture it, change the canvas, then capture the next frame.</div></section></div>}

    {mode==='library'&&<div className="gif-library-view"><section className="gif-import-card"><div><div className="gif-section-heading"><span>Use an existing GIF</span><small>Local or external</small></div><p>Upload a GIF from your device or paste a direct image URL.</p></div><div className="gif-import-actions"><button className="gif-primary-btn" onClick={()=>fileRef.current?.click()}>＋ Upload GIF</button><input ref={fileRef} hidden type="file" accept="image/gif" onChange={e=>{const file=e.target.files?.[0];if(file)void importFile(file);e.currentTarget.value='';}}/><div className="gif-url-row"><input value={urlValue} onChange={e=>setUrlValue(e.target.value)} placeholder="https://…/animation.gif"/><button className="gif-secondary-btn" onClick={()=>void addExternal()}>Add URL</button></div></div></section><div className="gif-section-heading gif-library-heading"><span>Saved GIFs</span><small>{store.gifs.length} saved</small></div>{store.gifs.length===0?<div className="gif-library-empty"><div>🎀</div><strong>No GIFs yet</strong><span>Upload one or create your first animation.</span><button className="gif-secondary-btn" onClick={resetCreator}>Create a GIF</button></div>:<div className="gif-grid">{store.gifs.map(gif=><GifCard key={gif.id} gif={gif} onAdd={addStoredToCanvas} onDelete={store.remove}/>)}</div>}</div>}
    {message&&<div className="gif-studio-message" role="status">{message}</div>}
  </div></div>;
}

function GifCard({gif,onAdd,onDelete}:{gif:StoredGif;onAdd:(gif:StoredGif)=>void;onDelete:(id:string)=>Promise<void>}){
  const [src,setSrc]=useState(gif.sourceUrl||'');
  useEffect(()=>{if(!gif.blob)return;const url=URL.createObjectURL(gif.blob);setSrc(url);return()=>URL.revokeObjectURL(url);},[gif.blob]);
  return <article className="gif-card"><div className="gif-card-media">{src?<img src={src} alt={gif.name}/>:<span>🎞️</span>}</div><div className="gif-card-footer"><div><strong>{gif.name}</strong><small>{gif.document?`${gif.document.frames.length} frames`:'Imported'}</small></div><button className="gif-primary-btn gif-card-add" onClick={()=>onAdd(gif)}>Add</button></div><button className="gif-card-delete" onClick={()=>void onDelete(gif.id)} aria-label={`Delete ${gif.name}`}><Icon name="trash" size={13}/></button></article>;
}
