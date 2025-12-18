import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { v2 as cloudinary } from "cloudinary";
import Event from "@/database/event.model";

/* ---------------- GET: fetch all events ---------------- */
export async function GET() {
  try {
    await connectDB();
    const events = await Event.find().sort({ createdAt: -1 });

    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

/* ---------------- POST: create event ---------------- */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();

    /* ---------- image ---------- */
    const file = formData.get("image") as File;
    if (!file) {
      return NextResponse.json(
        { message: "Image file is required" },
        { status: 400 }
      );
    }

    /* ---------- helpers ---------- */
    const parseJSON = (value: FormDataEntryValue | null, field: string) => {
      if (!value) throw new Error(`${field} is required`);
      try {
        return JSON.parse(value.toString());
      } catch {
        throw new Error(`${field} must be valid JSON`);
      }
    };

    const tags = parseJSON(formData.get("tags"), "tags");
    const agenda = parseJSON(formData.get("agenda"), "agenda");

    /* ---------- upload image ---------- */
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "DevEvent" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as { secure_url: string });
            }
          )
          .end(buffer);
      }
    );

    /* ---------- build clean payload ---------- */
    const eventData = {
      title: formData.get("title"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      overview: formData.get("overview"),
      venue: formData.get("venue"),
      location: formData.get("location"),
      date: formData.get("date"),
      time: formData.get("time"),
      mode: formData.get("mode"),
      audience: formData.get("audience"),
      organizer: formData.get("organizer"),
      image: uploadResult.secure_url,
      tags,
      agenda,
    };

    const createdEvent = await Event.create(eventData);

    return NextResponse.json(
      { message: "Event Created Successfully", event: createdEvent },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Event Creation Failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
