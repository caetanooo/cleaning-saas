interface Props {
  steps: string[];
  current: number; // 0-indexed
}

export default function StepIndicator({ steps, current }: Props) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        const isLast  = i === steps.length - 1;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  done
                    ? "bg-sky-500 border-sky-500 text-white"
                    : active
                    ? "border-sky-500 text-sky-500 bg-white"
                    : "border-slate-300 text-slate-400 bg-white"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                  active ? "text-sky-600" : done ? "text-sky-500" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`w-16 sm:w-24 h-0.5 mb-5 mx-1 ${
                  done ? "bg-sky-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
