"use client";

import { useState } from "react";
import Image from "next/image";
import { InfoCircledIcon } from "@radix-ui/react-icons";

interface ModelParams {
  model: string;
  params: {
    prompt: string;
    num_outputs: number;
    aspect_ratio: string;
    output_format: string;
    output_quality: number;
    go_fast: boolean;
  };
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modelParams, setModelParams] = useState<ModelParams | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    const currentParams: ModelParams = {
      model: "black-forest-labs/flux-schnell",
      params: {
        prompt,
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 80,
        go_fast: true,
      },
    };

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      if (!data.imageUrl) {
        throw new Error("No image URL received");
      }

      setImageUrl(data.imageUrl);
      setModelParams(currentParams);
    } catch (err) {
      console.error("Error details:", err);
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt (e.g., 'a magical forest at sunset')"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:border-gray-600 dark:placeholder-gray-400"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Generating..." : "Generate Image"}
        </button>
      </form>

      {error && (
        <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {imageUrl && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative w-[512px] h-[512px]">
              <Image
                src={imageUrl}
                alt="Generated image"
                fill
                className="rounded-lg object-cover"
                sizes="(max-width: 768px) 100vw, 512px"
              />
            </div>
          </div>
          
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-500"
            >
              <InfoCircledIcon className="w-5 h-5" />
              <span>View Model Details</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && modelParams && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold dark:text-white">Model Parameters</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-2">
                <p className="font-medium dark:text-white">Model: {modelParams.model}</p>
                <div className="space-y-1">
                  <p className="font-medium dark:text-white">Parameters:</p>
                  <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm dark:text-gray-300">
                    {JSON.stringify(modelParams.params, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 