import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";

const location = process.env.GCP_LOCATION || "us";
const gcpOptions: any = location !== "global" ? { apiEndpoint: `${location}-speech.googleapis.com` } : {};

if (process.env.GCP_CREDENTIALS_JSON) {
  gcpOptions.credentials = JSON.parse(process.env.GCP_CREDENTIALS_JSON);
  gcpOptions.projectId = process.env.GCP_PROJECT_ID;
}

const storage = new Storage(gcpOptions.credentials ? { credentials: gcpOptions.credentials, projectId: gcpOptions.projectId } : undefined);

export async function POST(req: NextRequest) {
  try {
    const { fileName, contentType } = await req.json();

    if (!fileName) {
      return NextResponse.json({ detail: "No fileName provided" }, { status: 400 });
    }

    const bucketName = process.env.GCP_GCS_BUCKET;
    if (!bucketName) {
      return NextResponse.json({ detail: "GCP_GCS_BUCKET not configured" }, { status: 500 });
    }

    const gcsFileName = `transcribe/${uuidv4()}-${fileName}`;
    const gcsBucket = storage.bucket(bucketName);
    const gcsFile = gcsBucket.file(gcsFileName);

    const [url] = await gcsFile.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType || "audio/mpeg",
    });

    return NextResponse.json({ url, gcsFileName });
  } catch (error: any) {
    console.error("Signed URL error:", error);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
