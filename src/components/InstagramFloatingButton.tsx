import Image from "next/image";
import instagramLogo from "@/instagram.jpg";

const INSTAGRAM_URL =
  "https://www.instagram.com/mikaauto.cz?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";

export default function InstagramFloatingButton() {
  return (
    <>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Otevrit Instagram profil"
        title="Instagram"
        className="instagram-floating-button"
      >
        <Image
          src={instagramLogo}
          alt="Instagram"
          className="instagram-floating-button__image"
          sizes="(max-width: 768px) 58px, 68px"
          loading="lazy"
        />
      </a>

      <style>{`
        /* Sedí nalevo od WhatsApp tlačítka – rozměry a odsazení držte v souladu
           s WhatsAppFloatingButton (68px desktop / 58px mobil). */
        .instagram-floating-button {
          position: fixed;
          right: calc(24px + 68px + 16px);
          bottom: calc(24px + env(safe-area-inset-bottom));
          z-index: 35;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 68px;
          height: 68px;
          border-radius: 999px;
          overflow: hidden;
          text-decoration: none;
          box-shadow: 0 18px 30px rgba(7, 23, 12, 0.34);
          transition: transform 0.2s ease, filter 0.2s ease;
        }
        .instagram-floating-button:hover {
          transform: translateY(-2px) scale(1.03);
          filter: brightness(1.04);
        }
        .instagram-floating-button__image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        @media (max-width: 768px) {
          .instagram-floating-button {
            right: calc(16px + 58px + 12px);
            bottom: calc(16px + env(safe-area-inset-bottom));
            width: 58px;
            height: 58px;
            box-shadow: 0 14px 24px rgba(7, 23, 12, 0.32);
          }
        }
      `}</style>
    </>
  );
}
