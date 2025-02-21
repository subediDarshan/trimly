import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";
import path from "path";
import { writeFile } from "fs/promises";

const prisma = new PrismaClient();

// Configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
    public_id: string;
    duration?: number;
    bytes: number;
    [key: string]: unknown;
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const originalSize = formData.get("originalSize") as string;
        console.log("this is file", file);

        if (!file) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = file.name.replaceAll(" ", "_");
        console.log("filename: ", filename);

        const filePath = path.join(process.cwd(), "public/assets/" + filename);

        await writeFile(filePath, buffer);

        // const bytes = await file.arrayBuffer();
        // const buffer = Buffer.from(bytes);

        const response = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                // const uploadStream = cloudinary.uploader.upload_stream(
                //   {
                //     resource_type: "video",
                //     folder: "trimly-videos",
                //     transformation: [{ quality: "60", fetch_format: "mp4" }],
                //   },
                //   (error, result) => {
                //     if (error) reject(error);
                //     else resolve(result as CloudinaryUploadResult);
                //   }
                // );
                // uploadStream.end(buffer);

                cloudinary.uploader.upload_large(
                    filePath,
                    {
                        resource_type: "video",
                        chunk_size: 6000000, // 6MB chunks
                        folder: "trimly-videos",
                        transformation: [
                            { quality: "60", fetch_format: "mp4" },
                        ],
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result as CloudinaryUploadResult);
                    }
                );
            }
        );

        console.log("this is response", response);

        const video = await prisma.video.create({
            data: {
                title,
                description,
                publicId: response.public_id,
                originalSize,
                compressedSize: String(response.bytes),
                duration: response.duration || 0,
                userId,
            },
        });

        return NextResponse.json(video);
    } catch (error) {
        console.log("Upload video failed", error);
        return NextResponse.json(
            { error: "Upload video failed" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: "100mb",
        },
    },
};
