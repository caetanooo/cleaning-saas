/**
 * lib/whatsapp.ts
 *
 * WhatsApp Business API — message sending + message builders for the
 * cleaner booking-confirmation flow.
 *
 * Required env vars (when active):
 *   WHATSAPP_API_TOKEN        — Bearer token for Meta Graph API
 *   WHATSAPP_PHONE_NUMBER_ID  — Your WhatsApp Business phone number ID
 */

// ─── Send ─────────────────────────────────────────────────────────────────────

export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  const apiToken      = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiToken || !phoneNumberId) {
    console.warn("[whatsapp] env vars not configured — skipping send to", to);
    return;
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error("[whatsapp] send failed:", errText);
  }
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const PT_MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function formatDatePtBR(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} de ${PT_MONTHS[month - 1]} de ${year}`;
}

export function formatServiceTypePtBR(type: string): string {
  if (type === "deep") return "Deep Cleaning";
  if (type === "move") return "Move-in / Move-out";
  return "Limpeza Regular";
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}min`;
}

// ─── Message Builders ─────────────────────────────────────────────────────────

/**
 * First message sent to the cleaner after a new booking is placed.
 * Includes all booking details and asks for acceptance.
 */
export function buildCleanerNotificationMessage(params: {
  date: string;
  startTime: string | null;
  bedrooms: number;
  bathrooms: number;
  serviceType: string;
  estimatedDuration: number | null;
  staffCount: number;
  totalPrice: number;
  customerAddress: string;
}): string {
  const { date, startTime, bedrooms, bathrooms, serviceType, estimatedDuration, staffCount, totalPrice, customerAddress } = params;

  const staffLabel =
    staffCount === 2 ? " (dupla)" :
    staffCount === 3 ? " (trio)"  : "";

  const lines: string[] = [
    "✅ Novo Agendamento Confirmado!",
    "",
    `📅 Data: ${formatDatePtBR(date)}`,
  ];

  if (startTime) lines.push(`⏰ Hora: ${startTime}`);

  lines.push(
    `🏠 Casa: ${bedrooms} quarto${bedrooms !== 1 ? "s" : ""} / ${bathrooms} banheiro${bathrooms !== 1 ? "s" : ""}`,
    `🧽 Tipo: ${formatServiceTypePtBR(serviceType)}`,
  );

  if (estimatedDuration) {
    lines.push(`⏱ Duração estimada: ${formatDuration(estimatedDuration)}${staffLabel}`);
  }

  lines.push(
    `💰 Valor a receber: $${totalPrice.toFixed(2)}`,
    `📍 Endereço: ${customerAddress}`,
  );

  return lines.join("\n");
}

/**
 * Sent after the cleaner accepts — asks how many staff members will attend.
 */
export function buildTeamSizeQuestionMessage(estimatedDuration: number | null): string {
  const lines: string[] = [
    "Ótimo! Você vai ao serviço com quantas pessoas?",
    "",
    "*1* - Sozinha" + (estimatedDuration ? ` (${formatDuration(estimatedDuration)})` : ""),
    "*2* - Em dupla" + (estimatedDuration ? ` (${formatDuration(Math.ceil(estimatedDuration / 2))})` : " — duração cai pela metade"),
    "*3* - Em trio" + (estimatedDuration ? ` (${formatDuration(Math.ceil(estimatedDuration / 3))})` : " — duração cai para 1/3"),
    "",
    "Responda com *1*, *2* ou *3*.",
  ];
  return lines.join("\n");
}

/**
 * Sent to the cleaner after she selects the team size — confirms the booking
 * with the recalculated duration.
 */
export function buildConfirmationMessage(staffCount: number, newDuration: number): string {
  const staffLabel =
    staffCount === 1 ? "sozinha" :
    staffCount === 2 ? "em dupla" : "em trio";

  return [
    "✅ Serviço confirmado!",
    "",
    `Indo ${staffLabel}, a duração estimada é de *${formatDuration(newDuration)}*.`,
    "Até lá! 🧹",
  ].join("\n");
}

/**
 * Sent to the customer (in English) when the cleaner declines the booking.
 */
export function buildCustomerDeclineMessage(customerName: string): string {
  return (
    `Hi ${customerName}! Unfortunately, your cleaner wasn't available for the requested time slot. ` +
    `Please contact us to reschedule.`
  );
}

/**
 * Sent to the cleaner when her reply isn't understood.
 */
export function buildUnknownReplyMessage(expected: "acceptance" | "team_size"): string {
  return expected === "acceptance"
    ? "Não entendi. Responda *SIM* para aceitar ou *NAO* para recusar."
    : "Não entendi. Responda *1* (sozinha), *2* (dupla) ou *3* (trio).";
}
