/** WhatsApp click-to-chat link with a prefilled message. */
export const waLink = (base: string, text: string) => `${base}?text=${encodeURIComponent(text)}`
