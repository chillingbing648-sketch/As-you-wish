import { memo, useRef, useState, useCallback, useEffect } from 'react';
import type { CanvasObject } from '../types';
import { useCanvasStore } from '../store/canvasStore';
import { useObjectGesture } from './useObjectGesture';
import { ShapeObject } from './ShapeObject';
import { Icon } from '../components/Icon';
import { GifCanvasObject } from '../gif/GifCanvasObject';

interface Props { obj: CanvasObject; isSelected: boolean; zoom: number; onSelect: (id: string, additive: boolean) => void; gesture: ReturnType<typeof useObjectGesture>; screenToWorld: (x: number, y: number) => { x: number; y: number }; }
const RESIZE_HANDLES = ['nw','n','ne','e','se','s','sw','w'] as const;

function CanvasObjectNodeImpl({ obj, isSelected, zoom, onSelect, gesture, screenToWorld }: Props) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [editing, setEditing] = useState(false);
  const updateObjectData = useCanvasStore((s) => s.updateObjectData);
  const initialEditRef = useRef(true);
  useEffect(() => {
    if (initialEditRef.current && obj.type === 'text' && (obj.data as any).text === 'Write your idea…') setEditing(true);
    initialEditRef.current = false;
  }, [obj.id, obj.type]);
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (editing) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    onSelect(obj.id, e.shiftKey);
    if (obj.locked || !nodeRef.current) return;
    gesture.startMove(e, obj, nodeRef.current, zoom);
  }, [obj, editing, gesture, zoom, onSelect]);
  const handleMove = useCallback((e: React.PointerEvent) => gesture.onPointerMove(e, screenToWorld(e.clientX, e.clientY)), [gesture, screenToWorld]);
  if (obj.hidden) return null;
  const baseStyle: React.CSSProperties = { position:'absolute', left:obj.x, top:obj.y, width:obj.width, height:obj.height, transform:`rotate(${obj.rotation}deg)`, zIndex:isSelected ? 1000 : undefined, touchAction:'none' };
  return <div ref={nodeRef} className={`canvas-object canvas-object--${obj.type}${isSelected ? ' is-selected':''}${obj.locked ? ' is-locked':''}`} style={baseStyle} onPointerDown={handlePointerDown} onPointerMove={handleMove} onPointerUp={gesture.onPointerUp} onPointerCancel={gesture.onPointerUp} data-object-id={obj.id}>
    <ObjectContent obj={obj} editing={editing} setEditing={setEditing} updateObjectData={updateObjectData}/>
    {isSelected && !obj.locked && <>
      {RESIZE_HANDLES.map((h)=><div key={h} className={`resize-handle handle-${h}`} onPointerDown={(e)=>nodeRef.current && gesture.startResize(e,obj,nodeRef.current,zoom,h)}/>)}
      <div className="rotate-handle" title="Rotate" onPointerDown={(e)=>nodeRef.current && gesture.startRotate(e,obj,nodeRef.current)}><Icon name="rotate" size={12}/><div className="rotate-handle-stick"/></div>
    </>}
    {obj.locked && isSelected && <div className="lock-badge"><Icon name="lock" size={12}/></div>}
  </div>;
}

function ObjectContent({ obj, editing, setEditing, updateObjectData }: { obj: CanvasObject; editing: boolean; setEditing: (v:boolean)=>void; updateObjectData: (id:string, patch:Record<string,unknown>)=>void }) {
  const textRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (editing && textRef.current) {
      textRef.current.focus(); const range=document.createRange(); range.selectNodeContents(textRef.current); range.collapse(false); const sel=window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range);
    }
  }, [editing]);

  if (obj.type === 'note') return <div className="note-object" style={{background:obj.data.color}}><div ref={textRef} className="note-text" contentEditable={editing} suppressContentEditableWarning onDoubleClick={(e)=>{e.stopPropagation();setEditing(true)}} onBlur={(e)=>{setEditing(false);updateObjectData(obj.id,{text:e.currentTarget.innerText})}} onPointerDown={(e)=>{if(editing)e.stopPropagation()}}>{editing ? undefined : obj.data.text}</div></div>;

  if (obj.type === 'text') {
    const d=obj.data; const highlight=d.highlight; const hs=d.highlightStyle||'soft'; const textBg=d.textBackground; const letterSpacing=d.letterSpacing?`${d.letterSpacing/100}em`:undefined; let textDecoration='none'; if(d.underline&&d.strikethrough)textDecoration='underline line-through'; else if(d.underline)textDecoration='underline'; else if(d.strikethrough)textDecoration='line-through';
    return <div ref={textRef} className={`text-object${highlight?` has-highlight highlight--${hs}`:''}${textBg?' has-text-bg':''}${d.headingStyle?` text-heading--${d.headingStyle}`:''}`} contentEditable={editing} suppressContentEditableWarning style={{fontFamily:d.fontFamily,fontSize:d.fontSize,color:d.color,fontWeight:d.fontWeight??(d.bold?700:400),fontStyle:d.italic?'italic':'normal',textDecoration,textAlign:d.align,letterSpacing,lineHeight:d.lineHeight||undefined,backgroundColor:textBg||undefined,'--text-highlight':highlight||'transparent'} as React.CSSProperties} onDoubleClick={(e)=>{e.stopPropagation();setEditing(true)}} onBlur={(e)=>{setEditing(false);updateObjectData(obj.id,{text:e.currentTarget.innerText})}} onPointerDown={(e)=>{if(editing)e.stopPropagation()}}>{editing?undefined:d.text}</div>;
  }

  if (obj.type === 'image') {
    const d=obj.data; const frame=d.frame??'none'; const filter=d.filter??'none'; let filterStyle=`brightness(${d.brightness??100}%) contrast(${d.contrast??100}%) saturate(${d.saturation??100}%)`; if(filter==='grayscale')filterStyle+=' grayscale(100%)'; else if(filter==='warm')filterStyle+=' sepia(35%) hue-rotate(-15deg)'; else if(filter==='cool')filterStyle+=' hue-rotate(180deg) saturate(85%)'; else if(filter==='fade')filterStyle+=' contrast(85%) brightness(110%) sepia(20%)'; else if(filter==='vivid')filterStyle+=' saturate(160%) contrast(115%)';
    return <div className={`image-object image-frame--${frame} ${(d.shadow??false)?'has-shadow':''}`} style={{opacity:d.opacity??1,border:d.border||undefined}}><div className="image-frame-inner"><img src={d.src} alt={d.caption||''} draggable={false} style={{filter:filterStyle,transform:`scale(${d.flipH?-1:1}, ${d.flipV?-1:1})`}}/></div>{frame==='polaroid'&&<span className="image-caption">{d.caption||'a little memory'}</span>}</div>;
  }
  if (obj.type === 'shape') return <ShapeObject data={obj.data} width={obj.width} height={obj.height}/>;
  if (obj.type === 'drawing') return <svg className="drawing-object" viewBox={`0 0 ${obj.width} ${obj.height}`} preserveAspectRatio="none" aria-hidden="true"><path d={obj.data.path} fill="none" stroke={obj.data.stroke} strokeWidth={obj.data.strokeWidth} strokeOpacity={obj.data.opacity} strokeLinecap={obj.data.lineCap} strokeLinejoin={obj.data.linejoin||'round'} vectorEffect="non-scaling-stroke"/></svg>;
  if (obj.type === 'sticker') return <div className="sticker-object" style={{background:obj.data.background}} aria-hidden="true">{obj.data.symbol}</div>;
  if (obj.type === 'gif') return <GifCanvasObject data={obj.data}/>;
  return null;
}

export const CanvasObjectNode = memo(CanvasObjectNodeImpl);
