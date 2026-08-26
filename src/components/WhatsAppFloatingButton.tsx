import Image from "next/image";
import whatsappLogo from "@/whatsapp-clean.png";

const WHATSAPP_URL = "https://wa.me/420774333774";

// Rozměry, odsazení i dorovnání log řeší .floating-action-btn v globals.css,
// aby se obě plovoucí tlačítka nemohla rozejít.
export default function WhatsAppFloatingButton() {
  return (
    <a
      href={WHATSAPP_URL}
      aria-label="Otevrit WhatsApp chat"
      title="WhatsApp"
      className="floating-action-btn floating-action-btn--first floating-action-btn--whatsapp"
    >
      <Image
        src={whatsappLogo}
        alt="WhatsApp"
        className="floating-action-btn__image"
        sizes="(max-width: 768px) 56px, 68px"
        loading="lazy"
      />
    </a>
  );
}
