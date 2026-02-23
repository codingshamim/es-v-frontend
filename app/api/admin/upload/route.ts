import { requireAdmin } from "@/lib/admin/auth-check";
import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { authorized, error } = await requireAdmin();
    if (!authorized) return error;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return Response.json(
        { success: false, message: "No file provided" },
        { status: 400 },
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { success: false, message: "Invalid file type. Only images allowed." },
        { status: 400 },
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json(
        { success: false, message: "File too large. Max 5MB." },
        { status: 400 },
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9-_]/g, "");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", sanitizedFolder);

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${sanitizedFolder}/${filename}`;

    return Response.json({
      success: true,
      data: { url: publicUrl, filename, size: file.size },
    });
  } catch (err) {
    console.error("[admin/upload]", err);
    return Response.json(
      { success: false, message: "Upload failed" },
      { status: 500 },
    );
  }
}
