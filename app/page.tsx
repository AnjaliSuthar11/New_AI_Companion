"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const page = () => {
  const { user} = useUser();
  const router = useRouter();
  useEffect(() => {
    if (!user) {
      return router.push("/dashboard");
    } else {
      return router.push("/sign-in");
    }
  }, [user]);
};

export default page;
