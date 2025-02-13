import Search_input from "@/components/Search-input";
import prismadb from "@/lib/prismadb";
import { Categories } from "@/components/Categories";
import { PrismaClient } from "@prisma/client";
import { Companions } from "@/components/Companions";
import { checkAuth } from "@/actions/auth";

interface RootPageProps {
  searchParams: Promise<{
    categoryId: string;
    name: string;
  }>;
}

const RootPage = async ({ searchParams }: RootPageProps) => {
  await checkAuth();
  const { categoryId, name } = await searchParams;

  const data = await prismadb.companion.findMany({
    where: {
      categoryId: categoryId,
      name: {
        search: name,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  const categories = await prismadb.category.findMany();

  return (
    <div className="h-full p-4 space-y-2">
      <Search_input />
      <Categories data={categories} />
      <Companions data={data} />
    </div>
  );
};

export default RootPage;
