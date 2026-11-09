import React from "react";
import { motion } from "framer-motion";
import { Crown, Heart } from "lucide-react";
import { GlasshouseThumb } from "./templates/glasshouse.jsx";
import { AureliaThumb } from "./templates/aurelia.jsx";
import { PrambananThumb } from "./templates/prambanan.jsx";
import { BaroqueThumb } from "./templates/baroque.jsx";
import { ArunikaThumb } from "./templates/arunika.jsx";
import { GoldenMinangThumb } from "./templates/goldenMinang.jsx";
import { CelestialThumb } from "./templates/celestial.jsx";
import { GardenThumb } from "./templates/garden.jsx";
import { RoyalSapphireThumb } from "./templates/royalSapphire.jsx";
import { CelestialNocturneThumb } from "./templates/celestialNocturne.jsx";
import { AzureCascadeThumb } from "./templates/azureCascade.jsx";
import { GebyokKencanaThumb } from "./templates/gebyokKencana.jsx";
import { SuntingRajoThumb } from "./templates/suntingRajo.jsx";

/* ============================================================
   MOMENLABS — DATA KATALOG TEMPLATE
   Dipakai oleh landing page (thumbnail & preview) dan halaman demo.
   tier     : paket yang membuka template ini (basic | premium | luxury)
   category : adat | modern | kontemporer | heritage (label: Modern Aesthetic)
   base     : warna latar solid untuk tema demo undangan
   ============================================================ */

export const TEMPLATES = [
  {
    id: "sekar-prambanan",
    base: "#2B1A10",
    name: "Sekar Prambanan",
    region: "Jawa",
    category: "adat",
    tier: "premium",
    names: "Raden & Ayu",
    kicker: "Pawiwahan",
    bg: "linear-gradient(180deg,#F2C894 0%,#C9925C 50%,#4A3A22 100%)",
    fg: "#F7E8D0",
    accent: "#E8C77E",
    font: "font-display",
    ornament: "prambanan",
  },
  {
    id: "arunika",
    base: "#2A1426",
    name: "Arunika",
    region: "Jawa",
    category: "adat",
    tier: "premium",
    names: "Bagas & Laras",
    kicker: "Pahargyan Dhaup",
    bg: "linear-gradient(180deg,#3E2A58 0%,#C85E52 45%,#F8BE76 100%)",
    fg: "#FFF1DE",
    accent: "#FFC27A",
    font: "font-display",
    ornament: "arunika",
  },
  {
    id: "golden-minang",
    base: "#2A1A0C",
    name: "Golden Minangkabau",
    region: "Minang",
    category: "adat",
    tier: "premium",
    names: "Rizky & Annisa",
    kicker: "Baralek Gadang",
    bg: "linear-gradient(180deg,#5A3A18 0%,#C88A34 50%,#F6D27A 100%)",
    fg: "#FFF4E0",
    accent: "#F2C25E",
    font: "font-display",
    ornament: "goldenMinang",
  },
  {
    id: "gebyok-kencana",
    base: "#1A0F08",
    name: "Gebyok Kencana",
    region: "Jawa Klasik",
    category: "adat",
    tier: "premium",
    names: "Raden & Ayu",
    kicker: "Pawiwahan Agung",
    bg: "radial-gradient(120% 80% at 50% 30%,#3A2414 0%,#1E1209 55%,#0C0603 100%)",
    fg: "#F7E8D0",
    accent: "#E8C77E",
    font: "font-display",
    ornament: "gebyok",
  },
  {
    id: "sunting-rajo",
    base: "#2A0709",
    name: "Sunting Rajo",
    region: "Minang Royal",
    category: "adat",
    tier: "premium",
    names: "Rajo & Puti",
    kicker: "Baralek Gadang",
    bg: "radial-gradient(120% 80% at 50% 30%,#5C0E14 0%,#33080C 55%,#140203 100%)",
    fg: "#FBEBD8",
    accent: "#F0CD82",
    font: "font-display",
    ornament: "sunting",
  },
  {
    id: "wayang-kencana",
    base: "#0B0A0C",
    name: "Wayang Kencana",
    region: "Jawa",
    category: "adat",
    tier: "luxury",
    names: "Bagas & Laras",
    kicker: "Pawiwahan Agung",
    bg: "radial-gradient(120% 90% at 50% 0%,#1E1810 0%,#0B0A0C 65%)",
    fg: "#F3E6C8",
    accent: "#D4AF6A",
    font: "font-display",
    ornament: "wayang",
    demo: "/?template=wayang-kencana&plan=luxury",
  },
  {
    id: "dark-elegance",
    base: "#0B0A0C",
    name: "Dark Elegance",
    region: "Black & Gold",
    category: "modern",
    tier: "luxury",
    names: "Bima & Clara",
    kicker: "The Wedding of",
    bg: "radial-gradient(120% 90% at 50% 10%,#2A2318 0%,#0B0A0C 70%)",
    fg: "#F3E6C8",
    accent: "#D4AF6A",
    font: "font-display",
    ornament: "royal",
    demo: "/?template=dark-elegance&plan=luxury",
  },
  {
    id: "secret-garden",
    base: "#FBF5EE",
    name: "Secret Garden",
    region: "Garden Wedding",
    category: "kontemporer",
    tier: "premium",
    names: "Raka & Alya",
    kicker: "Together With Their Families",
    bg: "linear-gradient(180deg,#F8EFE6 0%,#F6E6DF 60%,#EFE6D6 100%)",
    fg: "#5A4B3C",
    accent: "#B8925A",
    font: "font-display",
    ornament: "garden",
  },
  {
    id: "sunda",
    base: "#E2D7BC",
    name: "Pasundan Asih",
    region: "Sunda",
    category: "adat",
    tier: "premium",
    names: "Asep & Euis",
    kicker: "Walimatul 'Urs",
    bg: "linear-gradient(170deg,#E9E0C9 0%,#CFC29E 100%)",
    fg: "#2F4A3A",
    accent: "#5E7D57",
    font: "font-display",
    ornament: "bambu",
  },
  {
    id: "minang",
    base: "#741A1F",
    name: "Rumah Gadang",
    region: "Minang",
    category: "adat",
    tier: "premium",
    names: "Fadil & Rahmi",
    kicker: "Baralek Gadang",
    bg: "linear-gradient(170deg,#8E1F24 0%,#5A0F14 100%)",
    fg: "#FBE7C2",
    accent: "#E3B65B",
    font: "font-display",
    ornament: "gonjong",
  },
  {
    id: "batak",
    base: "#161414",
    name: "Ulos Horas",
    region: "Batak",
    category: "adat",
    tier: "premium",
    names: "Togar & Rosa",
    kicker: "Pesta Unjuk",
    bg: "linear-gradient(170deg,#1D1A1A 0%,#0F0D0D 100%)",
    fg: "#F5EDE6",
    accent: "#C4282E",
    font: "font-display",
    ornament: "gorga",
  },
  {
    id: "bugis",
    base: "#461748",
    name: "Lipa' Sabbe",
    region: "Bugis",
    category: "adat",
    tier: "premium",
    names: "Andi & Besse",
    kicker: "Mappabotting",
    bg: "linear-gradient(170deg,#5B1E63 0%,#341039 100%)",
    fg: "#FBE9F5",
    accent: "#E6B85C",
    font: "font-display",
    ornament: "sabbe",
  },
  {
    id: "clean",
    base: "#FAF9F6",
    name: "Pure Minimal",
    region: "Clean",
    category: "modern",
    tier: "basic",
    names: "Kevin & Laras",
    kicker: "We're Getting Married",
    bg: "linear-gradient(170deg,#FFFFFF 0%,#F2F0EC 100%)",
    fg: "#1A1A1A",
    accent: "#9A938A",
    font: "font-display",
    ornament: "clean",
  },
  {
    id: "islamic",
    base: "#0C3A2F",
    name: "Nur Elegance",
    region: "Islamic",
    category: "modern",
    tier: "basic",
    names: "Fikri & Aisyah",
    kicker: "Walimatul 'Urs",
    bg: "linear-gradient(170deg,#0F4236 0%,#082920 100%)",
    fg: "#F1E9D2",
    accent: "#D2B26A",
    font: "font-display",
    ornament: "islamic",
  },
  {
    id: "dark",
    base: "#141117",
    name: "Noir Velvet",
    region: "Dark Elegance",
    category: "modern",
    tier: "basic",
    names: "Bima & Clara",
    kicker: "The Wedding of",
    bg: "radial-gradient(120% 90% at 50% 0%,#2B2530 0%,#0D0B10 70%)",
    fg: "#EADFCB",
    accent: "#BFA37A",
    font: "font-display",
    ornament: "noir",
  },
  {
    id: "royal",
    base: "#F9F5EC",
    name: "Ivory Crown",
    region: "Royal White",
    category: "modern",
    tier: "basic",
    names: "Adrian & Sabrina",
    kicker: "Royal Wedding",
    bg: "linear-gradient(170deg,#FFFDF8 0%,#F3ECDD 100%)",
    fg: "#3B3226",
    accent: "#B8955A",
    font: "font-display",
    ornament: "royal",
  },
  {
    id: "korean",
    base: "#F8E8EF",
    name: "Seoul Bloom",
    region: "Korean",
    category: "modern",
    tier: "basic",
    names: "Jiwon & Daniel",
    kicker: "우리 결혼합니다",
    bg: "linear-gradient(170deg,#FFE9EE 0%,#EDE4FF 100%)",
    fg: "#4A3A55",
    accent: "#F08BA6",
    font: "font-display",
    ornament: "korean",
  },
  {
    id: "royal-sapphire",
    base: "#F4EFE6",
    name: "Royal Sapphire",
    region: "Toile de Jouy",
    category: "heritage",
    tier: "premium",
    names: "Arsen & Kirana",
    kicker: "The Wedding of",
    bg: "radial-gradient(120% 80% at 50% 35%,#FBF8F1 0%,#F2EDE2 55%,#DDE3EE 100%)",
    fg: "#1E3264",
    accent: "#B08A3E",
    font: "font-display",
    ornament: "sapphire",
  },
  {
    id: "celestial-nocturne",
    base: "#060A1C",
    name: "Celestial Nocturne",
    region: "Modern Celestial Luxury",
    category: "heritage",
    tier: "premium",
    names: "Elara & Orion",
    kicker: "Written in the Stars",
    bg: "radial-gradient(120% 80% at 50% 20%,#1A2452 0%,#0C1434 50%,#060A1C 100%)",
    fg: "#F3E6C8",
    accent: "#D4AF6A",
    font: "font-display",
    ornament: "nocturne",
  },
  {
    id: "azure-cascade",
    base: "#F8F6F0",
    name: "Azure Cascade",
    region: "Toile Romantique",
    category: "heritage",
    tier: "premium",
    names: "Arsen & Kirana",
    kicker: "The Wedding of",
    bg: "radial-gradient(120% 80% at 50% 30%,#FFFFFF 0%,#F4F1EA 55%,#D9E1EE 100%)",
    fg: "#1E3264",
    accent: "#B08A3E",
    font: "font-display",
    ornament: "cascade",
  },
  {
    id: "botanical-glasshouse",
    base: "#FBF7F0",
    name: "Botanical Glasshouse",
    region: "Garden Wedding",
    category: "kontemporer",
    tier: "premium",
    names: "Raka & Dinda",
    kicker: "The Garden Wedding of",
    bg: "radial-gradient(120% 80% at 50% 30%,#FFFDF8 0%,#F7F1E6 60%,#EFE6D6 100%)",
    fg: "#4F5B3A",
    accent: "#B38A4E",
    font: "font-display",
    ornament: "glasshouse",
  },
  {
    id: "villa-aurelia",
    base: "#2A1E12",
    name: "Villa Aurelia",
    region: "Italian Garden",
    category: "kontemporer",
    tier: "premium",
    names: "Arkan & Nayla",
    kicker: "The Royal Wedding of",
    bg: "linear-gradient(180deg,#F3C995 0%,#C99A62 45%,#5E5A2E 100%)",
    fg: "#FBF1E1",
    accent: "#E6C58C",
    font: "font-display",
    ornament: "aurelia",
  },
  {
    id: "baroque-palace",
    base: "#2A060C",
    name: "Baroque Grand Palace",
    region: "Royal Baroque",
    category: "kontemporer",
    tier: "premium",
    names: "Adrian & Larissa",
    kicker: "The Royal Wedding of",
    bg: "linear-gradient(180deg,#3A0A12 0%,#B23A33 45%,#F6C27A 55%,#4A0E17 100%)",
    fg: "#F6E6D0",
    accent: "#D4AF37",
    font: "font-display",
    ornament: "baroque",
  },
  {
    id: "celestial-luxury",
    base: "#0B1026",
    name: "Celestial Luxury",
    region: "Celestial",
    category: "kontemporer",
    tier: "premium",
    names: "Elang & Kirana",
    kicker: "Written in the Stars",
    bg: "radial-gradient(120% 80% at 50% 22%,#1E2756 0%,#0E1433 45%,#05070F 100%)",
    fg: "#F3E6C8",
    accent: "#D4AF6A",
    font: "font-display",
    ornament: "celestialLux",
  },
  {
    id: "terracotta-sun",
    base: "#F0DFCC",
    name: "Terracotta Sun",
    region: "Boho",
    category: "kontemporer",
    tier: "premium",
    names: "Arya & Naila",
    kicker: "Save Our Date",
    bg: "linear-gradient(170deg,#F3E4D4 0%,#E8CDB5 100%)",
    fg: "#5A2E1E",
    accent: "#C0643B",
    font: "font-display",
    ornament: "terracotta",
  },
  {
    id: "porcelain-blue",
    base: "#F7F9FD",
    name: "Porcelain Blue",
    region: "Porcelain",
    category: "kontemporer",
    tier: "premium",
    names: "Fajar & Alya",
    kicker: "Wedding Invitation",
    bg: "linear-gradient(170deg,#FFFFFF 0%,#EEF2FA 100%)",
    fg: "#1F3A7A",
    accent: "#2D4FA3",
    font: "font-display",
    ornament: "porcelain",
  },
];

// Pembagian katalog per paket. Paket di atasnya selalu mendapat semua template paket di bawahnya.
export const TIERS = [
  {
    id: "basic",
    name: "Basic",
    price: "50.000",
    tagline: "Modern & Simpel",
    desc: "Template modern yang bersih dan elegan, cocok untuk undangan yang cepat jadi.",
    includes: null,
    parallax: "Tanpa parallax",
  },
  {
    id: "premium",
    name: "Premium",
    price: "100.000",
    tagline: "Adat & European + Parallax",
    desc: "11 template dengan efek parallax halus: 5 Adat Nusantara dan 6 European Classic. Termasuk juga semua template Basic.",
    includes: "Basic",
    parallax: "Parallax halus",
  },
  {
    id: "luxury",
    name: "Luxury",
    price: "150.000",
    tagline: "Eksklusif + Cinematic Parallax",
    desc: "Template eksklusif dengan parallax sinematik berlapis-lapis dan opening animation khusus. Termasuk semua template Basic & Premium.",
    includes: "Basic & Premium",
    parallax: "Cinematic parallax",
  },
];
export const tierOf = (id) => TIERS.find((t) => t.id === id);

function Ornament({ type, accent, fg, compact }) {
  switch (type) {
    case "gunungan":
      return (
        <>
          <svg viewBox="0 0 100 120" className="absolute left-1/2 top-[6%] w-[28%] -translate-x-1/2" fill="none" stroke={accent} strokeWidth="1.2" aria-hidden="true">
            <path d="M50 4 C 78 36, 92 70, 82 112 L 18 112 C 8 70, 22 36, 50 4Z" />
            <path d="M50 18 C 70 44, 80 72, 72 104 L 28 104 C 20 72, 30 44, 50 18Z" opacity="0.7" />
            <path d="M50 18 V 104" opacity="0.6" />
            {[40, 54, 68, 82, 96].map((y) => (
              <path key={y} d={`M${50 - (y - 18) * 0.28} ${y} Q 50 ${y - 8} ${50 + (y - 18) * 0.28} ${y}`} opacity="0.6" />
            ))}
            <circle cx="50" cy="60" r="5" fill={accent} opacity="0.8" />
          </svg>
          <svg viewBox="0 0 200 20" className="absolute inset-x-[8%] bottom-[3%]" fill={accent} aria-hidden="true">
            {Array.from({ length: 10 }).map((_, i) => (
              <path key={i} d={`M${i * 20 + 10} 2 L ${i * 20 + 16} 10 L ${i * 20 + 10} 18 L ${i * 20 + 4} 10Z`} opacity={0.35 + (i % 2) * 0.3} />
            ))}
          </svg>
        </>
      );
    case "wayang":
      return (
        <>
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 44 44'%3E%3Cg fill='none' stroke='%23D4AF6A' stroke-width='1'%3E%3Cg transform='rotate(45 22 22)'%3E%3Cellipse cx='22' cy='11' rx='5.5' ry='9.5'/%3E%3Cellipse cx='22' cy='33' rx='5.5' ry='9.5'/%3E%3Cellipse cx='11' cy='22' rx='9.5' ry='5.5'/%3E%3Cellipse cx='33' cy='22' rx='9.5' ry='5.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute left-1/2 top-[22%] h-[45%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `radial-gradient(closest-side, ${accent}40, transparent)` }} />
          <svg viewBox="0 0 200 300" className={`absolute left-1/2 -translate-x-1/2 ${compact ? "top-[7%] w-[26%]" : "top-[6%] w-[24%]"}`} aria-hidden="true">
            <defs>
              <linearGradient id="wk-thumb-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F6E7B8" />
                <stop offset="45%" stopColor={accent} />
                <stop offset="100%" stopColor="#9C7A3C" />
              </linearGradient>
            </defs>
            <path d="M100 6 C128 40 176 110 178 196 C179 236 160 262 150 270 L150 288 L50 288 L50 270 C40 262 21 236 22 196 C24 110 72 40 100 6Z" fill="url(#wk-thumb-gold)" />
            <g fill="none" stroke="#0B0A0C" strokeWidth="5" strokeLinecap="round">
              <path d="M100 250 V 70" />
              <path d="M100 110 C 82 100 64 108 66 128 M100 110 C 118 100 136 108 134 128 M100 160 C 76 150 52 162 56 190 M100 160 C 124 150 148 162 144 190 M100 205 C 80 198 62 208 64 228 M100 205 C 120 198 138 208 136 228" />
            </g>
            <path d="M88 288 V 268 Q 100 254 112 268 V 288Z" fill="#0B0A0C" />
            <rect x="34" y="288" width="132" height="8" rx="2" fill="url(#wk-thumb-gold)" />
          </svg>
          <svg viewBox="0 0 200 14" className="absolute inset-x-[8%] bottom-[4%]" fill="none" stroke={accent} aria-hidden="true" preserveAspectRatio="none">
            <path d="M0 1 H 200 M0 13 H 200" strokeWidth="0.6" opacity="0.6" />
            {Array.from({ length: 20 }).map((_, i) => (
              <path key={i} d={`M${i * 10} 12 C ${i * 10 + 2} 8, ${i * 10 + 5} 9, ${i * 10 + 6} 6 C ${i * 10 + 7} 3, ${i * 10 + 9} 3, ${i * 10 + 11} 2`} strokeWidth="1" opacity="0.8" />
            ))}
          </svg>
        </>
      );
    case "bambu":
      return (
        <>
          {[["left-[5%]", 0], ["right-[5%]", 1]].map(([pos, k]) => (
            <svg key={pos} viewBox="0 0 30 200" className={`absolute ${pos} top-0 h-full w-[13%]`} aria-hidden="true">
              {[4, 16].map((x, j) => (
                <g key={x} opacity={j ? 0.5 : 0.85}>
                  <rect x={x} y={j ? 30 : -5} width="8" height="220" rx="4" fill={accent} />
                  {[30, 70, 110, 150, 190].map((y) => (
                    <rect key={y} x={x - 1} y={y + (k + j) * 8} width="10" height="2" rx="1" fill={fg} opacity="0.5" />
                  ))}
                </g>
              ))}
              <path d="M12 60 q 14 -6 18 -20 q -14 4 -18 20Z" fill={accent} />
              <path d="M12 130 q -10 -2 -12 -16 q 10 4 12 16Z" fill={accent} />
            </svg>
          ))}
          <svg viewBox="0 0 100 30" className="absolute left-1/2 top-[10%] w-[30%] -translate-x-1/2" fill="none" stroke={fg} strokeWidth="1" aria-hidden="true">
            <path d="M10 15 H 40 M60 15 H 90" />
            <path d="M50 4 L 58 15 L 50 26 L 42 15Z" fill={accent} stroke="none" />
          </svg>
        </>
      );
    case "gonjong":
      return (
        <>
          <svg viewBox="0 0 200 70" className="absolute inset-x-0 top-[4%] w-full" aria-hidden="true">
            <path
              d="M0 62 Q 18 58 26 14 Q 40 46 66 46 Q 84 46 100 6 Q 116 46 134 46 Q 160 46 174 14 Q 182 58 200 62 L 200 70 L 0 70Z"
              fill={accent}
              opacity="0.9"
            />
            <path d="M0 70 H 200" stroke={fg} strokeWidth="2" opacity="0.4" />
            {Array.from({ length: 12 }).map((_, i) => (
              <path key={i} d={`M${i * 17 + 4} 70 l 6 -8 l 6 8`} fill="none" stroke="#5A0F14" strokeWidth="1.5" />
            ))}
          </svg>
          <svg viewBox="0 0 200 16" className="absolute inset-x-0 bottom-[5%] w-full" aria-hidden="true">
            {Array.from({ length: 14 }).map((_, i) => (
              <circle key={i} cx={i * 15 + 7} cy="8" r="4" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.7" />
            ))}
          </svg>
        </>
      );
    case "gorga":
      return (
        <>
          {["top-0", "bottom-0 rotate-180"].map((pos) => (
            <svg key={pos} viewBox="0 0 200 40" className={`absolute inset-x-0 ${pos} w-full`} aria-hidden="true">
              <rect width="200" height="6" fill={accent} />
              {Array.from({ length: 10 }).map((_, i) => (
                <g key={i}>
                  <path d={`M${i * 20} 6 L ${i * 20 + 10} 22 L ${i * 20 + 20} 6Z`} fill={accent} />
                  <path d={`M${i * 20 + 5} 6 L ${i * 20 + 10} 14 L ${i * 20 + 15} 6Z`} fill={fg} />
                </g>
              ))}
              <rect y="26" width="200" height="2" fill={fg} opacity="0.6" />
              <rect y="31" width="200" height="1" fill={accent} opacity="0.8" />
            </svg>
          ))}
          <svg viewBox="0 0 60 30" className="absolute left-1/2 top-[22%] w-[22%] -translate-x-1/2" fill="none" stroke={accent} strokeWidth="1.5" aria-hidden="true">
            <path d="M5 15 C 15 0, 25 30, 30 15 C 35 0, 45 30, 55 15" />
          </svg>
        </>
      );
    case "sabbe":
      return (
        <>
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, ${accent} 0 2px, transparent 2px 22px), repeating-linear-gradient(90deg, ${accent} 0 2px, transparent 2px 22px), repeating-linear-gradient(0deg, transparent 0 9px, rgba(255,255,255,0.25) 9px 13px, transparent 13px 22px), repeating-linear-gradient(90deg, transparent 0 9px, rgba(255,255,255,0.25) 9px 13px, transparent 13px 22px)`,
            }}
          />
          <div className="absolute inset-[9%] rounded-[50%_50%_12px_12px/30%_30%_12px_12px] border" style={{ borderColor: accent, background: "rgba(52,16,57,0.75)" }} />
        </>
      );
    case "clean":
      return (
        <>
          <div className="absolute inset-[7%] border" style={{ borderColor: `${fg}22` }} />
          <svg viewBox="0 0 60 60" className="absolute left-1/2 top-[13%] w-[16%] -translate-x-1/2" fill="none" stroke={accent} strokeWidth="1" aria-hidden="true">
            <path d="M30 55 C 30 35, 30 20, 30 5" />
            {[12, 22, 32, 42].map((y, i) => (
              <path key={y} d={i % 2 ? `M30 ${y} q -12 -2 -14 -10 q 10 0 14 10Z` : `M30 ${y} q 12 -2 14 -10 q -10 0 -14 10Z`} />
            ))}
          </svg>
        </>
      );
    case "islamic":
      return (
        <>
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='none' stroke='%23D2B26A' stroke-width='1'%3E%3Crect x='10' y='10' width='20' height='20'/%3E%3Crect x='10' y='10' width='20' height='20' transform='rotate(45 20 20)'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "34px 34px",
            }}
          />
          <svg viewBox="0 0 100 140" className="absolute inset-x-[10%] top-[8%] w-[80%]" fill="none" stroke={accent} strokeWidth="1.2" aria-hidden="true">
            <path d="M6 140 V 60 C 6 30, 30 14, 50 4 C 70 14, 94 30, 94 60 V 140" />
            <path d="M14 140 V 62 C 14 38, 34 24, 50 14 C 66 24, 86 38, 86 62 V 140" opacity="0.5" />
            <g transform="translate(50 30)">
              <rect x="-6" y="-6" width="12" height="12" fill={accent} />
              <rect x="-6" y="-6" width="12" height="12" fill={accent} transform="rotate(45)" />
            </g>
          </svg>
        </>
      );
    case "noir":
      return (
        <>
          <div className="absolute inset-0 bg-grain opacity-20 mix-blend-overlay" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{ backgroundImage: `repeating-linear-gradient(45deg, ${accent} 0 1px, transparent 1px 14px)` }}
          />
          <div className="absolute left-1/2 top-[12%] h-[38%] w-px -translate-x-1/2" style={{ background: `linear-gradient(to bottom, transparent, ${accent})` }} />
          <div className="absolute left-1/2 top-[50%] h-2 w-2 -translate-x-1/2 rotate-45" style={{ background: accent }} />
        </>
      );
    case "royal":
      return (
        <>
          <div className="absolute inset-[5%] border-2" style={{ borderColor: `${accent}AA` }} />
          <div className="absolute inset-[7.5%] border" style={{ borderColor: `${accent}66` }} />
          {["left-[5%] top-[5%]", "right-[5%] top-[5%] rotate-90", "right-[5%] bottom-[5%] rotate-180", "left-[5%] bottom-[5%] -rotate-90"].map((p) => (
            <svg key={p} viewBox="0 0 30 30" className={`absolute ${p} w-[12%]`} fill="none" stroke={accent} strokeWidth="1.3" aria-hidden="true">
              <path d="M2 28 V 8 Q 2 2 8 2 H 28" />
              <path d="M8 22 Q 8 8 22 8" opacity="0.7" />
              <circle cx="8" cy="8" r="2" fill={accent} />
            </svg>
          ))}
          <Crown className="absolute left-1/2 top-[14%] h-[9%] w-[9%] -translate-x-1/2" style={{ color: accent }} strokeWidth={1.3} />
        </>
      );
    case "korean":
      return (
        <>
          <div className="absolute -right-[10%] -top-[8%] h-[40%] w-[60%] rounded-full bg-white/50 blur-2xl" />
          <div
            className={`absolute left-1/2 -translate-x-1/2 rotate-[-4deg] rounded-sm bg-white p-[4%] pb-[12%] shadow-lg ${
              compact ? "top-[11%] w-[56%]" : "top-[9%] w-[46%]"
            }`}
          >
            <div className="aspect-square w-full rounded-[2px] bg-gradient-to-br from-[#F9C6D3] via-[#F6DCE4] to-[#CFC1FF]">
              <svg viewBox="0 0 100 100" className="h-full w-full opacity-60" aria-hidden="true">
                <circle cx="38" cy="42" r="12" fill="white" />
                <circle cx="62" cy="42" r="12" fill="white" />
                <path d="M14 100 C 18 70, 30 62, 38 62 C 46 62, 50 70, 50 100Z" fill="white" />
                <path d="M50 100 C 50 70, 54 62, 62 62 C 70 62, 82 70, 86 100Z" fill="white" />
              </svg>
            </div>
          </div>
          {[["left-[10%] top-[8%]", 14], ["right-[12%] top-[44%]", 10], ["left-[14%] top-[46%]", 8]].map(([p, s]) => (
            <Heart key={p} className={`absolute ${p}`} style={{ width: `${s}%`, height: `${s}%`, color: accent, fill: accent }} />
          ))}
        </>
      );
    case "garden":
      return <GardenThumb compact={compact} />;
    case "celestialLux":
      return <CelestialThumb compact={compact} />;
    case "baroque":
      return <BaroqueThumb compact={compact} />;
    case "arunika":
      return <ArunikaThumb />;
    case "goldenMinang":
      return <GoldenMinangThumb />;
    case "prambanan":
      return <PrambananThumb compact={compact} />;
    case "aurelia":
      return <AureliaThumb compact={compact} />;
    case "glasshouse":
      return <GlasshouseThumb />;
    case "sapphire":
      return <RoyalSapphireThumb />;
    case "nocturne":
      return <CelestialNocturneThumb />;
    case "cascade":
      return <AzureCascadeThumb />;
    case "gebyok":
      return <GebyokKencanaThumb />;
    case "sunting":
      return <SuntingRajoThumb />;
    case "celestial":
    case "botanical":
    case "deco":
    case "terracotta":
    case "porcelain":
      return <ContemporaryOrnament type={type} accent={accent} fg={fg} />;
    default:
      return null;
  }
}

export function TemplateCover({ t, compact = false, guestName }) {
  // posisi blok teks per tema: thumbnail katalog (compact) vs layar HP preview
  const textTop = (
    compact
      ? { gunungan: "top-[40%]", wayang: "top-[39%]", bambu: "top-[30%]", gonjong: "top-[34%]", gorga: "top-[36%]", sabbe: "top-[28%]", clean: "top-[34%]", islamic: "top-[38%]", noir: "top-[56%]", royal: "top-[30%]", korean: "top-[62%]", glasshouse: "top-[6%]", sapphire: "top-[29%]", nocturne: "top-[34%]", cascade: "top-[30%]", gebyok: "top-[36%]", sunting: "top-[38%]", aurelia: "top-[6%]", prambanan: "top-[6%]", baroque: "top-[5%]", arunika: "top-[5%]", goldenMinang: "top-[5%]", celestialLux: "top-[46%]", garden: "top-[5%]", celestial: "top-[34%]", botanical: "top-[30%]", deco: "top-[36%]", terracotta: "top-[38%]", porcelain: "top-[32%]" }
      : { gunungan: "top-[33%]", wayang: "top-[27%]", bambu: "top-[22%]", gonjong: "top-[26%]", gorga: "top-[28%]", sabbe: "top-[22%]", clean: "top-[24%]", islamic: "top-[31%]", noir: "top-[42%]", royal: "top-[24%]", korean: "top-[43%]", glasshouse: "top-[7%]", sapphire: "top-[27%]", nocturne: "top-[32%]", cascade: "top-[28%]", gebyok: "top-[34%]", sunting: "top-[36%]", aurelia: "top-[7%]", prambanan: "top-[7%]", baroque: "top-[6%]", arunika: "top-[6%]", goldenMinang: "top-[6%]", celestialLux: "top-[42%]", garden: "top-[6%]", celestial: "top-[27%]", botanical: "top-[24%]", deco: "top-[29%]", terracotta: "top-[31%]", porcelain: "top-[26%]" }
  )[t.ornament];
  const nameSize = compact ? "text-[26px] sm:text-[32px]" : "text-[40px]";

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: t.bg }}>
      <Ornament type={t.ornament} accent={t.accent} fg={t.fg} compact={compact} />
      <div className={`absolute inset-x-0 ${textTop} px-[10%] text-center`} style={{ color: t.fg }}>
        <p className={`${compact ? "text-[7px] sm:text-[8px]" : "text-[10px]"} font-semibold uppercase tracking-[0.3em] opacity-80`} style={{ color: t.accent }}>
          {t.kicker}
        </p>
        <p className={`mt-[5%] font-script leading-[0.95] ${nameSize}`}>{t.names.split(" & ")[0]}</p>
        <p className={`${t.font} italic ${compact ? "text-sm" : "text-lg"}`} style={{ color: t.accent }}>&amp;</p>
        <p className={`font-script leading-[0.95] ${nameSize}`}>{t.names.split(" & ")[1]}</p>
        <p className={`mt-[5%] ${compact ? "text-[7px] sm:text-[8px]" : "text-[10px]"} tracking-[0.3em] opacity-70`}>12 . 12 . 2026</p>
      </div>
      {!compact && (
        <div
          className="absolute inset-x-[12%] bottom-[17%] rounded-xl border px-3 py-2 text-center backdrop-blur-sm"
          style={{ borderColor: `${t.accent}66`, background: "rgba(255,255,255,0.12)", color: t.fg }}
        >
          <p className="text-[9px] uppercase tracking-[0.2em] opacity-60">Kepada Yth.</p>
          <p className="mt-0.5 truncate text-sm font-semibold">{guestName || "Bapak/Ibu/Saudara/i"}</p>
        </div>
      )}
    </div>
  );
}


/* ============================================================
   ORNAMEN TAMBAHAN (Kontemporer)
   ============================================================ */

function BotanicalBranch({ color, className = "", style }) {
  const leaves = [
    [25, 92, -40],
    [40, 75, -30],
    [55, 60, -20],
    [70, 46, -15],
    [85, 33, -10],
    [100, 21, -5],
  ];
  return (
    <svg viewBox="0 0 120 120" className={className} style={style} fill="none" stroke={color} strokeWidth="1.1" aria-hidden="true">
      <path d="M5 115 C 30 80, 60 50, 115 10" />
      {leaves.map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x - 6} cy={y - 8} rx="4" ry="9" transform={`rotate(${r - 30} ${x - 6} ${y - 8})`} fill={color} fillOpacity="0.22" />
          <ellipse cx={x + 7} cy={y + 5} rx="4" ry="9" transform={`rotate(${r + 50} ${x + 7} ${y + 5})`} fill={color} fillOpacity="0.22" />
        </g>
      ))}
    </svg>
  );
}

function PorcelainFlower({ color, className = "" }) {
  return (
    <svg viewBox="0 0 60 60" className={className} fill="none" stroke={color} strokeWidth="1" aria-hidden="true">
      <path d="M2 58 C 10 40, 4 24, 18 14 C 28 8, 40 12, 46 4" />
      <path d="M8 46 c 6 -2, 10 2, 12 6 M14 30 c 4 -4, 10 -4, 14 0" opacity="0.7" />
      <g transform="translate(22 22)">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="0" cy="-7" rx="4" ry="7" transform={`rotate(${a})`} fill={color} fillOpacity="0.18" />
        ))}
        <circle r="2.5" fill={color} />
      </g>
      <g transform="translate(44 40) scale(0.6)">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="0" cy="-7" rx="4" ry="7" transform={`rotate(${a})`} fill={color} fillOpacity="0.18" />
        ))}
        <circle r="2.5" fill={color} />
      </g>
    </svg>
  );
}

const CELESTIAL_STARS = Array.from({ length: 42 }, (_, i) => ({
  x: (i * 37 + 11) % 100,
  y: (i * 53 + 7) % 100,
  s: 1 + (i % 3),
  o: 0.25 + (i % 5) * 0.13,
}));

function ContemporaryOrnament({ type, accent, fg }) {
  switch (type) {
    case "celestial":
      return (
        <>
          {CELESTIAL_STARS.map((st, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, background: accent, opacity: st.o }}
            />
          ))}
          <svg viewBox="0 0 100 100" className="absolute left-1/2 top-[8%] w-[22%] -translate-x-1/2" aria-hidden="true">
            <defs>
              <mask id="ml-moon">
                <rect width="100" height="100" fill="white" />
                <circle cx="63" cy="40" r="27" fill="black" />
              </mask>
            </defs>
            <circle cx="50" cy="50" r="30" fill={accent} mask="url(#ml-moon)" />
            <circle cx="50" cy="50" r="38" fill="none" stroke={accent} strokeOpacity="0.3" strokeWidth="0.8" />
          </svg>
          <svg viewBox="0 0 200 60" className="absolute inset-x-[10%] bottom-[7%] w-[80%]" fill="none" stroke={accent} aria-hidden="true">
            <polyline points="5,45 40,20 75,35 110,10 150,30 195,15" strokeWidth="0.8" strokeOpacity="0.5" />
            {[[5, 45], [40, 20], [75, 35], [110, 10], [150, 30], [195, 15]].map(([x, y]) => (
              <circle key={x} cx={x} cy={y} r="2.4" fill={accent} stroke="none" />
            ))}
          </svg>
        </>
      );
    case "botanical":
      return (
        <>
          <BotanicalBranch color={accent} className="absolute -left-[4%] -top-[2%] w-[48%]" />
          <BotanicalBranch color={accent} className="absolute -bottom-[2%] -right-[4%] w-[48%] rotate-180" />
          <div className="absolute inset-[9%] rounded-[3px] border" style={{ borderColor: `${accent}44` }} />
        </>
      );
    case "deco":
      return (
        <>
          <div className="absolute inset-[4%] border" style={{ borderColor: `${accent}88` }} />
          <div className="absolute inset-[6%] border" style={{ borderColor: `${accent}44` }} />
          <svg viewBox="0 0 200 110" className="absolute inset-x-[10%] top-[7%] w-[80%]" fill="none" stroke={accent} strokeWidth="1" aria-hidden="true">
            {Array.from({ length: 13 }).map((_, i) => {
              const a = Math.PI * (i / 12);
              return <path key={i} d={`M100 100 L ${100 + 90 * Math.cos(Math.PI - a)} ${100 - 90 * Math.sin(a)}`} opacity="0.55" />;
            })}
            <path d="M10 100 A 90 90 0 0 1 190 100" />
            <path d="M40 100 A 60 60 0 0 1 160 100" />
            <path d="M70 100 A 30 30 0 0 1 130 100" fill={accent} fillOpacity="0.25" />
            <path d="M0 104 H 200" strokeWidth="1.6" />
          </svg>
          <svg viewBox="0 0 200 20" className="absolute inset-x-[10%] bottom-[8%] w-[80%]" fill="none" stroke={accent} aria-hidden="true">
            {Array.from({ length: 10 }).map((_, i) => (
              <path key={i} d={`M${i * 20 + 2} 16 L ${i * 20 + 10} 4 L ${i * 20 + 18} 16`} strokeWidth="1" opacity="0.7" />
            ))}
          </svg>
        </>
      );
    case "terracotta":
      return (
        <>
          <div className="absolute inset-x-[11%] bottom-[5%] top-[5%] rounded-t-full border-2" style={{ borderColor: `${accent}99` }} />
          <svg viewBox="0 0 100 56" className="absolute left-1/2 top-[13%] w-[38%] -translate-x-1/2" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => {
              const a = Math.PI * (i / 8);
              return (
                <path
                  key={i}
                  d={`M${50 - 30 * Math.cos(a)} ${50 - 30 * Math.sin(a)} L ${50 - 44 * Math.cos(a)} ${50 - 44 * Math.sin(a)}`}
                  stroke={accent}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              );
            })}
            <path d="M24 50 A 26 26 0 0 1 76 50Z" fill={accent} />
          </svg>
          <BotanicalBranch color={fg} className="absolute bottom-[3%] left-[3%] w-[30%] opacity-40" />
          <BotanicalBranch color={fg} className="absolute bottom-[3%] right-[3%] w-[30%] -scale-x-100 opacity-40" />
        </>
      );
    case "porcelain":
      return (
        <>
          <PorcelainFlower color={accent} className="absolute left-[3%] top-[3%] w-[30%]" />
          <PorcelainFlower color={accent} className="absolute right-[3%] top-[3%] w-[30%] -scale-x-100" />
          <svg viewBox="0 0 200 26" className="absolute inset-x-0 bottom-0 w-full" fill="none" stroke={accent} aria-hidden="true" preserveAspectRatio="none">
            {Array.from({ length: 11 }).map((_, i) => (
              <g key={i} strokeWidth="1" opacity="0.75">
                <path d={`M${i * 20 - 10} 26 a 10 10 0 0 1 20 0`} />
                <path d={`M${i * 20 - 6} 26 a 6 6 0 0 1 12 0`} />
                <path d={`M${i * 20 - 2} 26 a 2 2 0 0 1 4 0`} />
              </g>
            ))}
          </svg>
          <div className="absolute inset-x-[16%] top-[30%] h-px" style={{ background: `${accent}44` }} />
        </>
      );
    default:
      return null;
  }
}

/* ============================================================
   TEMA DEMO — warna template katalog → CSS variable undangan
   ============================================================ */

export const CATEGORY_LABEL = { adat: "Adat", modern: "Modern", kontemporer: "European", heritage: "Modern Aesthetic" };

export const demoUrl = (t) => t.demo ?? `/?template=${t.id}`;

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const mix = (a, b, k) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return A.map((v, i) => Math.round(v + (B[i] - v) * k));
};
const rgb = (arr) => arr.join(" ");
const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const isDarkTemplate = (t) => luminance(t.base) < 0.45;

/* variabel warna yang dipakai template undangan (noir = latar, cream = teks, gold = aksen) */
export function themeVars(t) {
  const dark = isDarkTemplate(t);
  const { base, fg, accent } = t;
  return {
    "--c-noir": rgb(hexToRgb(base)),
    "--c-noir-900": rgb(dark ? mix(base, "#000000", 0.35) : mix(base, fg, 0.03)),
    "--c-noir-800": rgb(mix(base, fg, 0.05)),
    "--c-noir-700": rgb(mix(base, fg, 0.09)),
    "--c-noir-600": rgb(mix(base, fg, 0.15)),
    "--c-cream": rgb(hexToRgb(fg)),
    "--c-gold": rgb(hexToRgb(accent)),
    "--c-gold-light": rgb(dark ? mix(accent, "#FFFFFF", 0.35) : mix(accent, fg, 0.2)),
    "--c-gold-deep": rgb(dark ? mix(accent, "#000000", 0.25) : mix(accent, fg, 0.5)),
    "--c-foil-a": rgb(dark ? mix(accent, "#FFFFFF", 0.55) : mix(accent, fg, 0.1)),
    "--c-foil-b": rgb(hexToRgb(accent)),
  };
}

/* data contoh undangan memakai nama pasangan dari katalog */
export function demoDataFor(t, base) {
  const [g, b] = t.names.split(" & ");
  const groomName = `${g} Pratama Putra`;
  const brideName = `${b} Ayu Lestari`;
  const holders = [brideName, groomName];
  return {
    ...base,
    groom: { ...base.groom, nickname: g, fullName: groomName, instagram: g.toLowerCase() },
    bride: { ...base.bride, nickname: b, fullName: brideName, instagram: b.toLowerCase() },
    gifts: {
      ...base.gifts,
      banks: base.gifts.banks.map((bank, i) => ({ ...bank, holder: holders[i % 2] })),
      qris: { ...base.gifts.qris, holder: `${b} & ${g}` },
      address: { ...base.gifts.address, recipient: brideName },
    },
  };
}

/* cover undangan demo: tampilan cover katalog, layar penuh */
export function ThemedCover({ t, guestName, onOpen }) {
  const dark = isDarkTemplate(t);
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex justify-center"
      style={{ background: t.base }}
      exit={{ y: "-100%" }}
      transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-full w-full max-w-[440px]"
      >
        <TemplateCover t={t} guestName={guestName} />
        <div className="absolute inset-x-0 bottom-[7%] flex justify-center">
          <motion.button
            onClick={onOpen}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex items-center gap-2 rounded-full px-7 py-3.5 text-xs font-bold tracking-[0.15em] shadow-lg transition active:scale-95"
            style={{ background: t.accent, color: dark ? t.base : "#FFFFFF" }}
          >
            <Heart className="h-3.5 w-3.5" /> BUKA UNDANGAN
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
