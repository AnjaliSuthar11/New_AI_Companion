import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { checkSubscription } from "@/lib/subscription";

export async function POST(req:Request) {
    try{
        const body = await req.json();
        const user = await currentUser();
        const {src,name,description,instructions,seed,categoryId,gender} = body;

        if(!user || !user.id || !user.firstName ){
            return new NextResponse("Unauthorized",{status:401});

        }

        if(!src || !name || !description || !instructions || !seed || !categoryId || !gender){
            return new NextResponse("Missing required fields",{status:400});
        }

        //Todo:Check for subscription
        const isPro= await checkSubscription();

        if(!isPro){
            return new NextResponse("pro subscription required",{status:403});
        }

        const companion = await prismadb.companion.create({
            data:{
                categoryId,
                userId:user.id,
                userName:user.firstName,
                src,
                name,
                description,
                instructions,
                seed,
                gender,
            

            }
        });
        return NextResponse.json(companion);




    }catch(error){
        console.log("[COMPANION_POST]",error);
        return new NextResponse("Internal Error",{status:500});
    }
    
}