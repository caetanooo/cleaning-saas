import type { ServiceType } from "@/types";

interface Props {
  type: ServiceType;
  selected: boolean;
  onSelect: (type: ServiceType) => void;
}

const SERVICE_META: Record<ServiceType, { title: string; icon: string; duration: string; description: string }> = {
  standard: {
    title: "Standard Clean",
    icon: "🧹",
    duration: "2 hours",
    description: "Dust, vacuum, mop, and sanitize kitchens and bathrooms.",
  },
  deep: {
    title: "Deep Clean",
    icon: "✨",
    duration: "4 hours",
    description: "Top-to-bottom scrub including inside oven, fridge, and baseboards.",
  },
  move_in_out: {
    title: "Move-In / Move-Out",
    icon: "📦",
    duration: "6 hours",
    description: "Full property clean — inside cabinets, walls spot-cleaned, garage sweep.",
  },
};

export default function ServiceCard({ type, selected, onSelect }: Props) {
  const { title, icon, duration, description } = SERVICE_META[type];
  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
        selected
          ? "border-sky-500 bg-sky-50 shadow-md"
          : "border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm"
      }`}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-bold text-slate-800 text-lg mb-1">{title}</h3>
      <p className="text-sky-600 text-sm font-semibold mb-2">{duration}</p>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
      {selected && (
        <span className="mt-3 inline-block text-xs font-bold text-sky-600 bg-sky-100 px-3 py-1 rounded-full">
          Selected ✓
        </span>
      )}
    </button>
  );
}
