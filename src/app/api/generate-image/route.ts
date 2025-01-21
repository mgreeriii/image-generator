import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt,
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 80,
        go_fast: true,
      },
    }) as string[];

    if (!output || !output[0]) {
      throw new Error("No image was generated");
    }

    return NextResponse.json({ imageUrl: output[0] });
  } catch (error) {
    console.error("Error generating image:", error);
    
    // More detailed error message for debugging
    const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
    console.log("Detailed error:", errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 