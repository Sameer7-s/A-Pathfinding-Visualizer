export default function Header() {
  return (
    <header className="w-full bg-white border-b border-[#e5e7eb] sticky top-0 z-50">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          {/* Blue icon square */}
          <div
            className="w-8 h-8 rounded-md bg-[#2563eb] flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <span className="text-white font-bold text-sm leading-none">P</span>
          </div>
          <span className="text-[#111827] font-bold text-lg tracking-tight">
            PromptForge
          </span>
        </div>

        {/* MVP Badge */}
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#dbeafe] text-[#1d4ed8] tracking-wide">
          MVP
        </span>
      </div>
    </header>
  );
}
