import { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import OptimizerCard from "./components/OptimizerCard";
import ResultBox from "./components/ResultBox";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("General");
  const [optimizedPrompt, setOptimizedPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClear = () => {
    setPrompt("");
    setMode("General");
    setOptimizedPrompt("");
    setError("");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#111827]">
      <Header />

      <main className="flex-grow w-full max-w-[1100px] mx-auto px-4 sm:px-6 w-full flex flex-col gap-6 pt-4 pb-12">
        <Hero />
        
        <OptimizerCard
          prompt={prompt}
          setPrompt={setPrompt}
          mode={mode}
          setMode={setMode}
          setOptimizedPrompt={setOptimizedPrompt}
          setError={setError}
          loading={loading}
          setLoading={setLoading}
          error={error}
        />

        {optimizedPrompt && (
          <ResultBox
            optimizedPrompt={optimizedPrompt}
            onClear={handleClear}
          />
        )}
      </main>

      <footer className="w-full border-t border-[#e5e7eb] bg-white py-6 mt-auto">
        <p className="text-center text-sm text-[#6b7280]">
          PromptForge MVP — Built for better AI prompts.
        </p>
      </footer>
    </div>
  );
}
