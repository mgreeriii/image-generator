import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model, ...params } = body;

    if (!model) {
      return NextResponse.json(
        { error: "Model is required" },
        { status: 400 }
      );
    }

    const output = await replicate.run(model, {
      input: params,
    });

    // Handle different response formats
    let imageUrl: string;
    if (Array.isArray(output)) {
      imageUrl = output[0];
    } else if (typeof output === 'object' && output !== null) {
      // Some models might return an object with the image URL
      imageUrl = (output as any).image || Object.values(output)[0];
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else {
      throw new Error("Unexpected response format from model");
    }

    if (!imageUrl || !imageUrl.startsWith('http')) {
      throw new Error("Invalid image URL generated");
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error generating image:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
    console.log("Detailed error:", errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 