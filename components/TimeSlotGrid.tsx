import type { TimeSlot } from "@/types";

interface Props {
  slots: TimeSlot[];
  selected: string | null; // startTime of selected slot
  onSelect: (slot: TimeSlot) => void;
}

export default function TimeSlotGrid({ slots, selected, onSelect }: Props) {
  if (slots.length === 0) {
    return (
      <p className="text-center text-slate-500 py-8">
        No available slots for this date. Please choose a different day.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {slots.map((slot) => {
        const isSelected = slot.startTime === selected;
        return (
          <button
            key={slot.startTime}
            type="button"
            disabled={!slot.available}
            onClick={() => slot.available && onSelect(slot)}
            className={`py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all duration-150 ${
              !slot.available
                ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed line-through"
                : isSelected
                ? "border-sky-500 bg-sky-500 text-white shadow-md"
                : "border-slate-200 bg-white text-slate-700 hover:border-sky-400 hover:text-sky-600"
            }`}
          >
            {slot.startTime} – {slot.endTime}
          </button>
        );
      })}
    </div>
  );
}
