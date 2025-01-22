"use client";

import { useState } from "react";
import Image from "next/image";
import { InfoCircledIcon } from "@radix-ui/react-icons";

type ModelId = "black-forest-labs/flux-schnell" | "stability-ai/stable-diffusion-3.5-large" | "ideogram-ai/ideogram-v2";

interface ModelConfig {
  id: ModelId;
  name: string;
  getParams: (prompt: string) => Record<string, any>;
}

const MODEL_CONFIGS: ModelConfig[] = [
  {
    id: "black-forest-labs/flux-schnell",
    name: "Flux",
    getParams: (prompt) => ({
      prompt,
      num_outputs: 1,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 80,
      go_fast: true,
    }),
  },
  {
    id: "stability-ai/stable-diffusion-3.5-large",
    name: "Stable Diffusion 3.5",
    getParams: (prompt) => ({
      prompt,
      cfg: 3.5,
      steps: 28,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 90,
    }),
  },
  {
    id: "ideogram-ai/ideogram-v2",
    name: "Ideogram",
    getParams: (prompt) => ({
      prompt,
      resolution: "None",
      style_type: "None",
      aspect_ratio: "16:9",
      magic_prompt_option: "Auto",
    }),
  },
];

// Utility function to convert aspect ratio to Tailwind class
const getAspectRatioClass = (aspectRatio: string): string => {
  const ratioMap: Record<string, string> = {
    "1:1": "aspect-square",
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
    "3:2": "aspect-[3/2]",
  };
  return ratioMap[aspectRatio] || "aspect-square"; // fallback to square if ratio not found
};

interface ModelParams {
  model: ModelId;
  params: Record<string, any>;
}

export default function ImageGenerator() {
  const [selectedModel, setSelectedModel] = useState<ModelId>("black-forest-labs/flux-schnell");
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

    const selectedConfig = MODEL_CONFIGS.find(config => config.id === selectedModel)!;
    const params = selectedConfig.getParams(prompt);

    const currentParams: ModelParams = {
      model: selectedModel,
      params
    };

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          model: selectedModel,
          ...params
        }),
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
    <>
      <div className="space-y-8">
        {/* Model Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-2">
          <div className="grid grid-cols-3 gap-2">
            {MODEL_CONFIGS.map((config) => (
              <button
                key={config.id}
                onClick={() => setSelectedModel(config.id)}
                className={`px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                  selectedModel === config.id
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {config.name}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt (e.g., 'a magical forest at sunset')"
              className="w-full p-4 pr-36 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:border-gray-700 dark:placeholder-gray-400 shadow-sm"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-2 bottom-2 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </div>
              ) : (
                "Generate"
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Generated Image */}
        {imageUrl && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg">
              <div className={`relative ${getAspectRatioClass(MODEL_CONFIGS.find(config => config.id === selectedModel)?.getParams("").aspect_ratio || "1:1")} rounded-lg overflow-hidden`}>
                <Image
                  src={imageUrl}
                  alt="Generated image"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  <InfoCircledIcon className="w-5 h-5" />
                  <span>View Model Details</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && modelParams && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-xl">
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
                  <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-sm dark:text-gray-300 overflow-auto">
                    {JSON.stringify(modelParams.params, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 