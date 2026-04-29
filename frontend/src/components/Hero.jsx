export default function Hero() {
  return (
    <section className="text-center pt-12 pb-8 px-4">
      {/* Eyebrow tag */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#e5e7eb] bg-white text-xs font-medium text-[#6b7280] mb-5">
        <span className="w-2 h-2 rounded-full bg-[#2563eb] inline-block"></span>
        AI-Powered Prompt Optimization
      </div>

      {/* Main title */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111827] leading-tight tracking-tight max-w-3xl mx-auto">
        Optimize weak prompts into{" "}
        <span className="text-[#2563eb]">powerful AI instructions</span>
      </h1>

      {/* Subtitle */}
      <p className="mt-4 text-base sm:text-lg text-[#6b7280] max-w-xl mx-auto leading-relaxed">
        Paste your prompt, choose a mode, and generate a clearer, structured
        version instantly.
      </p>

      {/* Supporting text */}
      <p className="mt-3 text-sm text-[#9ca3af]">
        Built for students, developers, creators, and founders.
      </p>
    </section>
  );
}
