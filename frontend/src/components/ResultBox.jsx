import { useState } from "react";

/**
 * ResultBox — shown only when an optimized prompt exists.
 *
 * Props:
 *   optimizedPrompt {string}   — the AI-improved prompt
 *   onClear         {function} — resets all state
 */
export default function ResultBox({ optimizedPrompt, onClear }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard
      .writeText(optimizedPrompt)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // Fallback for older browsers
        const el = document.createElement("textarea");
        el.value = optimizedPrompt;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 pb-10 fade-in">
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-sm overflow-hidden">
        {/* Header row */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e5e7eb]">
          <h2 className="text-sm font-semibold text-[#111827]">
            ✨ Optimized Prompt
          </h2>
          <button
            onClick={handleCopy}
            aria-label="Copy optimized prompt"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
              ${
                copied
                  ? "bg-[#dcfce7] text-[#16a34a] border-[#bbf7d0]"
                  : "bg-white text-[#2563eb] border-[#dbeafe] hover:bg-[#eff6ff]"
              }`}
          >
            {copied ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>

        {/* Output area */}
        <div className="px-5 py-4">
          <div
            className="min-h-[160px] rounded-lg bg-[#f8fafc] border border-[#e5e7eb] p-4
                        text-[#111827] text-sm leading-relaxed whitespace-pre-wrap break-words"
          >
            {optimizedPrompt}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-5 flex flex-col sm:flex-row gap-3">
          {/* Full-width copy on mobile, normal on desktop */}
          <button
            onClick={handleCopy}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all
              ${
                copied
                  ? "bg-[#dcfce7] text-[#16a34a] border-[#bbf7d0]"
                  : "bg-[#2563eb] text-white border-transparent hover:bg-[#1d4ed8]"
              }`}
          >
            {copied ? "✓ Copied to clipboard!" : "Copy Optimized Prompt"}
          </button>

          {/* Clear button */}
          <button
            onClick={onClear}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                       border border-[#e5e7eb] bg-white text-[#6b7280] hover:text-[#111827] hover:border-[#d1d5db]
                       transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Clear &amp; Start Again
          </button>
        </div>
      </div>
    </div>
  );
}
