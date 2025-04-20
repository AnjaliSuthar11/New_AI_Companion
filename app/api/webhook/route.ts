// import { NextResponse } from "next/server";
// import Stripe from "stripe";
// import { stripe } from "@/lib/stripe";
// import prismadb from "@/lib/prismadb";

// export async function POST(req: Request) {
//   const body = await req.text();
//   const signature = req.headers.get("Stripe-Signature") as string;

//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       body,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET!
//     );
//   } catch (error: any) {
//     return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
//   }

//   const session = event.data.object as Stripe.Checkout.Session;

//   if (event.type === "checkout.session.completed") {
//     const subscription = await stripe.subscriptions.retrieve(
//       session.subscription as string
//     );

//     if (!session?.metadata?.userId) {
//       return new NextResponse("User id is required", { status: 400 });
//     }

//     console.log("userid", session?.metadata?.userId);
//     try {
//         await prismadb.userSubscription.create({
//             data:{
//                 userId:session?.metadata?.userId,
//                 stripeSubscriptionId:subscription.id,
//                 stripeCustomerId:subscription.customer as string,
//                 stripePriceId:subscription.items.data[0].price.id,
//                 stripeCurrentPeriodEnd: new Date(
//                     subscription.current_period_end * 1000
//                 )
//             }
//         })
//       console.log("Subscription inserted successfully!");
//     } catch (error) {
//       console.error("Prisma error:", error);
//     }
//   }

//   if (event.type === "invoice.payment_succeeded") {
//     const subscription = await stripe.subscriptions.retrieve(
//       session.subscription as string
//     );

//     await prismadb.userSubscription.update({
//       where: {
//         stripeSubscriptionId: subscription.id,
//       },
//       data: {
//         stripePriceId: subscription.items.data[0].price.id,
//         stripeCurrentPeriodEnd: new Date(
//           subscription.current_period_end * 1000
//         ),
//       },
//     });
//   }

//   if(event.type === "customer.subscription.deleted"){
//     await prismadb.userSubscription.delete({
//         where: {
//           userId : session?.metadata?.userId
//         },
//       });
//   }

//   return new NextResponse(null, { status: 200 });
// }


import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import prismadb from "@/lib/prismadb";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Log session details for debugging
  console.log("Session data:", session);

  if (event.type === "checkout.session.completed") {
    if (!session?.subscription) {
      console.error("Missing subscription in session:", session);
      return new NextResponse("Missing subscription ID", { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
  
    // Check for userId in metadata
    if (!session?.metadata?.userId) {
      return new NextResponse("User id is required", { status: 400 });
    }

    try {
      await prismadb.userSubscription.create({
        data: {
          userId: session.metadata.userId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        },
      });
      console.log("Subscription inserted successfully!");
    } catch (error) {
      console.error("Prisma error:", error);
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    if (!session?.subscription) {
      console.error("Missing subscription in session:", session);
      return new NextResponse("Missing subscription ID", { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await prismadb.userSubscription.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object; // Get the subscription object
  
    // Assuming the userId is stored in the metadata of the subscription
    const userId = subscription.metadata.userId;
  
    // Delete the user subscription from the database
    if (userId) {
      await prismadb.userSubscription.delete({
        where: {
          userId: userId,  // Use the userId from the metadata
        },
      });
    } else {
      console.log('No userId found in subscription metadata');
    }
  }
  

  return new NextResponse(null, { status: 200 });
}
