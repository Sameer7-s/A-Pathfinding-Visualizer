import { useState, useRef } from "react";
import ModeSelector from "./ModeSelector";

/* ── Mode helper text ── */
const MODE_HINTS = {
  General: "Best for improving normal prompts.",
  Coding: "Best for code generation, debugging, and technical prompts.",
  Writing: "Best for blogs, emails, scripts, captions, and content.",
  Startup: "Best for PRDs, business ideas, strategy, and product planning.",
};

const API_URL = "http://127.0.0.1:8000/optimize";
const TIMEOUT_MS = 20_000;

/**
 * OptimizerCard — the main working area.
 *
 * Props:
 *   prompt             {string}
 *   setPrompt          {function}
 *   mode               {string}
 *   setMode            {function}
 *   setOptimizedPrompt {function}
 *   setError           {function}
 *   loading            {boolean}
 *   setLoading         {function}
 *   error              {string}
 */
export default function OptimizerCard({
  prompt,
  setPrompt,
  mode,
  setMode,
  setOptimizedPrompt,
  setError,
  loading,
  setLoading,
  error,
}) {
  const abortRef = useRef(null);

  async function handleOptimize() {
    const trimmed = prompt.trim();

    // Validation
    if (!trimmed) {
      setError("Please enter a prompt before optimizing.");
      return;
    }

    // Prevent duplicate requests
    if (loading) return;

    setError("");
    setOptimizedPrompt("");
    setLoading(true);

    // AbortController for timeout
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, mode }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("non_200");
      }

      const data = await response.json();

      if (!data.optimized_prompt) {
        throw new Error("invalid_response");
      }

      setOptimizedPrompt(data.optimized_prompt);
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else if (err.message === "invalid_response") {
        setError("Invalid response from server.");
      } else if (err.message === "non_200") {
        setError("Server returned an error. Check your FastAPI backend.");
      } else {
        setError(
          "Backend is not responding. Make sure FastAPI is running on port 8000."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 pb-6">
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-sm p-5 sm:p-7">
        {/* Section title */}
        <h2 className="text-base font-semibold text-[#111827] mb-3">
          Your Prompt
        </h2>

        {/* Textarea */}
        <div className="relative">
          <label htmlFor="prompt-input" className="sr-only">
            Your prompt
          </label>
          <textarea
            id="prompt-input"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error) setError("");
            }}
            placeholder="Paste your weak prompt here…"
            rows={7}
            disabled={loading}
            className="w-full resize-y min-h-[180px] px-4 py-3 rounded-lg border border-[#d1d5db] bg-white
                       text-[#111827] text-sm leading-relaxed placeholder-[#9ca3af]
                       focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20
                       disabled:bg-[#f9fafb] disabled:cursor-not-allowed transition-colors"
          />
          {/* Character counter */}
          <p className="mt-1.5 text-right text-xs text-[#9ca3af]">
            {prompt.length} character{prompt.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Mode selector + hint */}
        <div className="mt-4 space-y-2">
          <ModeSelector mode={mode} setMode={setMode} />
          <p className="text-xs text-[#6b7280]">{MODE_HINTS[mode]}</p>
        </div>

        {/* Optimize button */}
        <div className="mt-5">
          <button
            id="optimize-btn"
            onClick={handleOptimize}
            disabled={loading}
            aria-busy={loading}
            className={`flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-lg text-sm font-semibold
                        text-white transition-all w-full sm:w-auto
                        ${
                          loading
                            ? "bg-[#93c5fd] cursor-not-allowed"
                            : "bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.98]"
                        }`}
          >
            {loading && <span className="spinner" aria-hidden="true" />}
            {loading ? "Optimizing…" : "Optimize Prompt"}
          </button>
        </div>

        {/* Inline error */}
        {error && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-[#fef2f2] border border-[#fecaca]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 mt-0.5 text-[#dc2626] flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs text-[#dc2626] leading-snug">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
