import Image from "next/image";
import instagramLogo from "@/instagram.png";

const INSTAGRAM_URL =
  "https://www.instagram.com/mikaauto.cz?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";

// Rozměry, odsazení i dorovnání log řeší .floating-action-btn v globals.css,
// aby se obě plovoucí tlačítka nemohla rozejít.
export default function InstagramFloatingButton() {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Otevrit Instagram profil"
      title="Instagram"
      className="floating-action-btn floating-action-btn--second floating-action-btn--instagram"
    >
      <Image
        src={instagramLogo}
        alt="Instagram"
        className="floating-action-btn__image"
        sizes="(max-width: 768px) 56px, 68px"
        loading="lazy"
      />
    </a>
  );
}
