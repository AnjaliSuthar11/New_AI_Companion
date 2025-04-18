"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export async function checkAuth() {
  const { userId } = await auth(); // Get current user ID from Clerk

  if (!userId) {
    redirect("/sign-in"); // Redirect to sign-in if not authenticated
  }

  return userId; // Return user ID if authenticated
}
