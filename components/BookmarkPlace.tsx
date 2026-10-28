"use client";
import { useEffect, useState } from 'react';
import { BookmarkIcon } from './icons';
export function BookmarkPlace({slug}:{slug:string}) {
 const [saved,setSaved]=useState(false);
 // eslint-disable-next-line react-hooks/set-state-in-effect -- persisted bookmarks are browser-only
 useEffect(()=>{try {setSaved(JSON.parse(localStorage.getItem('miras-bookmarks')||'[]').includes(slug));}catch{}},[slug]);
 return <button type="button" className="photo-bookmark" aria-label={saved?'Remove bookmark':'Bookmark place'} aria-pressed={saved} onClick={()=>{try{const items:string[]=JSON.parse(localStorage.getItem('miras-bookmarks')||'[]');localStorage.setItem('miras-bookmarks',JSON.stringify(saved?items.filter(s=>s!==slug):[...items,slug]));setSaved(!saved);}catch{}}}><BookmarkIcon size={22}/></button>;
}
