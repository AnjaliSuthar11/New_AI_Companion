import { NextResponse } from "next/server";
import {auth, currentUser } from "@clerk/nextjs/server";
import { checkSubscription } from "@/lib/subscription";
import prismadb from "@/lib/prismadb";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest,context:{params:{companionId:string}})
 {
    try{

        // const url=new URL(request.url);
        // const pathSegments=url.pathname.split("/");
        // const companionId=pathSegments[pathSegments.length-1];
        const {companionId}= context.params;
        const body = await request.json();
        const user = await currentUser();
        const {src,name,description,instructions,seed,categoryId,gender} = body;

        if(!companionId){
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
                id:companionId,
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
    request: NextRequest,context:{params:{companionId:string}})
{
    
    try{
        // const url=new URL(request.url);
        // const pathSegments=url.pathname.split("/");
        // const companionId=pathSegments[pathSegments.length-1];
        const {companionId} = context.params
        const { userId } = await auth();

        if(!userId){
            return new NextResponse("Unauthorized",{status:401})
        }

        const companion = await prismadb.companion.delete({
            where:{
                userId,
                id:companionId,

            }
        })

        return NextResponse.json(companion)

    }catch(error){
        console.log("[COMPANION_DELETE]",error)
        return new NextResponse("Internal Error",{status:500})
    }
}