import { useEffect, useState } from "react";

export function use_debounce <T>(value:T,delay?:number):T {
    console.log(typeof value)
    const [debouncedValue,setDebouncedValue]=useState<T>(value);

    useEffect(()=>{
        const timer =setTimeout(()=>setDebouncedValue(value),delay||1500);

        return()=>{
            clearTimeout(timer);
        }

        
    },[value,delay]);

    return debouncedValue
}
