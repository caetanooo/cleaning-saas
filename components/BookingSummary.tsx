import type { Booking, FrequencyType, TimeBlock } from "@/types";

interface Props {
  booking: Booking;
}

const FREQ_LABELS: Record<FrequencyType, string> = {
  one_time: "One-Time",
  weekly:   "Weekly",
  biweekly: "Bi-Weekly",
  monthly:  "Monthly",
};

const BLOCK_INFO: Record<TimeBlock, { label: string; hours: string }> = {
  morning:   { label: "Morning",   hours: "9:00am – 1:00pm" },
  afternoon: { label: "Afternoon", hours: "1:30pm – 6:00pm" },
};

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export default function BookingSummary({ booking }: Props) {
  const block = BLOCK_INFO[booking.timeBlock];
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">✓</div>
        <div>
          <p className="font-bold text-slate-800">Booking Confirmed!</p>
          <p className="text-xs text-slate-400">ID: {booking.id}</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        <Row label="Home"      value={`${booking.bedrooms === 5 ? "5+" : booking.bedrooms} bed · ${booking.bathrooms === 5 ? "5+" : booking.bathrooms} bath`} />
        <Row label="Frequency" value={FREQ_LABELS[booking.frequency]} />
        <Row label="Date"      value={formatDate(booking.date)} />
        <Row label="Time"      value={`${block.label} (${block.hours})`} />
        <Row label="Address"   value={booking.customerAddress} />
        <Row label="Name"      value={booking.customerName} />
        <Row label="Phone"     value={booking.customerPhone} />
        <Row label="Pets"      value={booking.hasPets ? "Yes" : "No"} />
        <Row label="Total"     value={`$${booking.totalPrice.toFixed(2)}`} highlight />
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-2.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold text-right max-w-[60%] ${highlight ? "text-sky-600 text-base" : "text-slate-800"}`}>
        {value}
      </span>
    </div>
  );
}
