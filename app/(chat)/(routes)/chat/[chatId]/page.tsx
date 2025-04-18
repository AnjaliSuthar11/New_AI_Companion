import prismadb from "@/lib/prismadb";
// import { RedirectToSignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ChatClient } from "./components/client";

type ChatIdPageProps = {
  params: Promise<{ chatId: string }>;
};

const ChatIdPage = async ({ params }: ChatIdPageProps) => {
  const { userId } = await auth();
  const { chatId } = await params;

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
      id: chatId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        where: {
          userId,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  if (!companion) {
    return redirect("/");
  }

  return <ChatClient companion={companion} />;
};

export default ChatIdPage;
