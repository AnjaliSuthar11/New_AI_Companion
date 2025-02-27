import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { absoluteUrl } from "@/lib/utils";
import { auth, currentUser } from "@clerk/nextjs/server";

const settingsUrl = absoluteUrl("/dashboard/settings"); //basiclaly after  payment redirect to website  which page

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userSubscription = await prismadb.userSubscription.findUnique({
      where: {
        userId: userId,
      },
    });
    if (userSubscription && userSubscription.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userSubscription.stripeCustomerId,
        return_url: settingsUrl,
      });
      return new NextResponse(JSON.stringify({ url: stripeSession.url }));
    }
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: settingsUrl,
      cancel_url: settingsUrl,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: user?.emailAddresses[0].emailAddress,
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: {
              name: "AI Companion",
              description: "Upgrade to pro",
            },
            unit_amount: 999, //20 dollar
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
      },
    });

    return new NextResponse(JSON.stringify({ url: stripeSession.url }));
  } catch (error) {
    console.log("Stripe_Error", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}