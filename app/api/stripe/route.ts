import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { absoluteUrl } from "@/lib/utils";
import { auth, currentUser } from "@clerk/nextjs/server";

const settingsUrl = absoluteUrl("/dashboard/settings");

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user has an existing subscription
    const userSubscription = await prismadb.userSubscription.findUnique({
      where: {
        userId: userId,
      },
    });

    // If user already has a Stripe customer, redirect to billing portal
    if (userSubscription?.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userSubscription.stripeCustomerId,
        return_url: settingsUrl,
      });
      return new NextResponse(JSON.stringify({ url: stripeSession.url }));
    }

    // ✅ Create a new customer in Stripe and attach metadata
    const customer = await stripe.customers.create({
      email: user.emailAddresses[0].emailAddress,
      metadata: {
        userId,
      },
    });

    // ✅ Create a new checkout session in subscription mode with customer
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: settingsUrl,
      cancel_url: settingsUrl,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer: customer.id, // ✅ this is needed for subscription to work
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: {
              name: "AI Companion",
              description: "Upgrade to pro",
            },
            unit_amount: 999,
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
