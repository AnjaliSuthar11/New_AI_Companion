import prismadb from "@/lib/prismadb";
import CompanionForm from "./components/companion-form";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/dist/server/api-utils";
import { RedirectToSignIn } from "@clerk/nextjs";

interface CompanionIdPageProps{
    params:{
        companionId:string;
     }
}

const Page = async ({
    params }:CompanionIdPageProps) => {
        const {userId} = await auth();

        if(!userId){
            return{
                redirect:{
                    destination:"/signin",
                    permanent:false
                }
            }
        }

        const companion= await prismadb.companion.findUnique({
            where:{
                id:params.companionId,
                userId,

            }
        });

        const categories = await prismadb.category.findMany();

  return (
    <CompanionForm 
    initialData={companion} 
    categories={categories}/>
  )
}

export default Page
