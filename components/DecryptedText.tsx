"use client";
// Adapted from React Bits DecryptedText (DavidHDev/react-bits).
// https://reactbits.dev/text-animations/decrypted-text
// Compact sequential reveal; native span replaces motion wrapper.
import { useEffect, useState } from 'react';
export default function DecryptedText({text}:{text:string}) {
  const [display,setDisplay]=useState(text);
  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let iteration=0;
    const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const timer=setInterval(()=>{
      iteration++;
      setDisplay([...text].map((char,index)=>index<iteration||char===' '?char:chars[Math.floor(Math.random()*chars.length)]).join(''));
      if(iteration>=text.length)clearInterval(timer);
    },35);
    return ()=>clearInterval(timer);
  },[text]);
  return <span aria-label={text}><span aria-hidden="true">{display}</span></span>;
}
