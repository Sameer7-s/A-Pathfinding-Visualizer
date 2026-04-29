/**
 * ModeSelector — controlled dropdown for optimization mode.
 *
 * Props:
 *   mode    {string}   — current selected mode
 *   setMode {function} — state setter from parent
 */

const MODES = [
  { value: "General", label: "General" },
  { value: "Coding", label: "Coding" },
  { value: "Writing", label: "Writing" },
  { value: "Startup", label: "Startup" },
];

export default function ModeSelector({ mode, setMode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="mode-select"
        className="text-sm font-semibold text-[#111827]"
      >
        Optimization Mode
      </label>
      <select
        id="mode-select"
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="w-full sm:w-56 px-3 py-2.5 rounded-lg border border-[#d1d5db] bg-white text-[#111827] text-sm
                   focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20
                   transition-colors cursor-pointer"
      >
        {MODES.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}
