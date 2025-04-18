import { NextResponse } from "next/server";
import {auth, currentUser } from "@clerk/nextjs/server";
import { checkSubscription } from "@/lib/subscription";
import prismadb from "@/lib/prismadb";

export async function PATCH(req:Request,
    {params}:{params:{companionId:string}}
) {
    try{
        const body = await req.json();
        const user = await currentUser();
        const {src,name,description,instructions,seed,categoryId,gender} = body;

        if(!params.companionId){
            return new NextResponse("Missing required fields",{status:400})
        }

        if(!user || !user.id || !user.firstName ){
            return new NextResponse("Unauthorized",{status:401});

        }

        if(!src || !name || !description || !instructions || !seed || !categoryId || !gender ){
            return new NextResponse("Missing required fields",{status:400});
        }

    
        //Todo:Check for subscription
                const isPro= await checkSubscription();
        
                if(!isPro){
                    return new NextResponse("pro subscription required",{status:403});
                }

        const companion = await prismadb.companion.update({
            where:{
                id:params.companionId,
                userId:user.id,

            },
            data:{
                categoryId,
                userId:user.id,
                userName:user.firstName,
                src,
                name,
                description,
                instructions,
                seed,
                gender

            }
        });
        return NextResponse.json(companion);




    }catch(error){
        console.log("[COMPANION_PATCH]",error);
        return new NextResponse("Internal Error",{status:500});
    }
    
}

export async function DELETE(
    Request:Request,
    {params}:{params:{companionId:string}}
){
    try{
        const { userId } = await auth();

        if(!userId){
            return new NextResponse("Unauthorized",{status:401})
        }

        const companion = await prismadb.companion.delete({
            where:{
                userId,
                id:params.companionId,

            }
        })

        return NextResponse.json(companion)

    }catch(error){
        console.log("[COMPANION_DELETE]",error)
        return new NextResponse("Internal Error",{status:500})
    }
}