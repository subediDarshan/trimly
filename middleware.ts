import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/"
])


export default clerkMiddleware(async(auth, req:NextRequest) => {
    const {userId} = await auth()
    const currentUrl = new URL(req.url)
    const isApiRequest = currentUrl.pathname.startsWith("/api")


    if(currentUrl.pathname === "/") {
        return NextResponse.redirect(new URL("/home", req.url))
    }

    if(userId && isPublicRoute(req)) {
        return NextResponse.redirect(new URL("/home", req.url))
    }

    if(!userId) {
        
        if(!isPublicRoute(req)) {
            console.log("check");
            return NextResponse.redirect(new URL("/sign-in", req.url))
        }
        if(isApiRequest) {
            return NextResponse.redirect(new URL("/sign-in", req.url))
        }
    }

    return NextResponse.next()


});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};