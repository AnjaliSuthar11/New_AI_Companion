import prismadb from "@/lib/prismadb";
import CompanionForm from "./components/companion-form";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/dist/server/api-utils";
import { RedirectToSignIn } from "@clerk/nextjs";

interface CompanionIdPageProps {
  params: Promise<{
    companionId: string;
  }>;
}

const Page = async ({ params }: CompanionIdPageProps) => {
  const { userId } = await auth();
  const { companionId } = await params;

  if (!userId) {
    return {
      redirect: {
        destination: "/sign-in/[[...rest]]/page.tsx",
        permanent: false,
      },
    };
  }

  const companion = await prismadb.companion.findUnique({
    where: {
      id: companionId,
      userId,
    },
  });

  const categories = await prismadb.category.findMany();

  return <CompanionForm initialData={companion} categories={categories} />;
};

export default Page;
