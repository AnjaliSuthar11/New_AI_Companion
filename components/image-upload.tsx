"use client"

import { useEffect, useState } from "react";
import {CldUploadButton} from "next-cloudinary"
import Image from "next/image";
import axios from "axios";
import { Button } from "./ui/button";

interface ImageUploadProps{
    value:string,
    onChange:(src:string)=>void;
    disabled?:boolean;
    name:string,
    gender:string,
    description:string

}
export const ImageUpload =({
    value,
    onChange,
    name,
    gender,
    description,
    disabled
}:ImageUploadProps)=>{
    const [isMounted,setIsMounted]=useState(false);
    const [loading,setLoading]=useState(false)

    
   
        const generateImage=async ()=>{
            if(!name||!gender||!description){
                alert("Please provide name, gender, and description first");
                return;
            } 
            try{
                setLoading(true);
                const response=await axios.post("/api/ai-image",{
                    name,gender,description
                });

                const imageUrl=response.data.imageUrl;
                onChange(imageUrl);
            }catch(error){
                console.error("error generating Ai image",error)
            }finally{
                setLoading(false);
            }
        };
        
    useEffect(()=>{
        setIsMounted(true);
    },[]);

    if(!isMounted){
        return null
    }

    
    return(
        <div className="space-y-4 w-full flex flex-col justify-center items-center">
            <CldUploadButton 
            onSuccess={(result:any)=>onChange(result.info.secure_url)}
            options={{
                maxFiles:1
            }} uploadPreset="AI_Companion">

                <div className="p-4 border-4 border-dashed boarder-primary/10 rounded-lg hover:opacity-75 transition flex flex-col space-y-2 items-center justify-center">

                <div className="relative h-40 w-40">
                    <Image 
                    fill 
                    alt="Upload" 
                    src={value || "/placeholder.svg"} className="rounded-lg object-cover"/>
                </div>

                </div>

            </CldUploadButton>
            <Button className="bg-primary my-0" onClick={generateImage} type="button">
                Generate with AI
            </Button>
            {loading && <p>Generating AI Image....</p>}

        </div>
    )
}