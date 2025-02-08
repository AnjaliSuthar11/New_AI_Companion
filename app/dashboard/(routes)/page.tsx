import { useClerk, UserButton } from '@clerk/nextjs'
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react'
import Search_input from '@/components/Search-input';
import prismadb from '@/lib/prismadb';
import { Categories } from '@/components/Categories';
import { PrismaClient } from '@prisma/client';
import {Companions}  from "@/components/Companions"


interface RootPageProps{
  searchParams:{
    categoryId:string;
    name:string;
  }
}

const RootPage = async ({
  searchParams
}:RootPageProps) => {
    const data= await prismadb.companion.findMany({
      where:{
        categoryId:searchParams.categoryId,
        name:{
          search:searchParams.name
        }
      },
      orderBy:{
        createdAt:"desc",

      },
      include:{
        _count:{
          select:{
            messages:true
          }
        }
      }
    })
    
   const categories=await prismadb.category.findMany();

  return (
    <div className='h-full p-4 space-y-2'>
      <Search_input/>
      <Categories data={categories}/>
      <Companions data={data} />
   
    </div>
  )
}

export default RootPage
