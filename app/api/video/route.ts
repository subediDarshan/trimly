import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(){
    try {
        const {userId} = await auth()
        if(!userId) {
            throw new Error("Login first")
        }
        const videos = await prisma.video.findMany({
            where: {userId},
            orderBy: {createdAt: "desc"}
        })
        return NextResponse.json(videos)
    } catch {
        return NextResponse.json({error: "Error fetching videos"}, {status: 500})
    } finally {
        await prisma.$disconnect()
    }
}