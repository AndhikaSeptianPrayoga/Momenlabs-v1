import React, { useLayoutEffect } from "react";
import DarkElegance, { DEFAULT_DATA } from "./DarkElegance.jsx";
import { ThemedCover, demoDataFor, themeVars } from "../catalog.jsx";
import { GlasshouseCover, glasshouseDecor } from "./glasshouse.jsx";
import { AureliaCover, aureliaDecor, aureliaData } from "./aurelia.jsx";
import { PrambananCover, prambananDecor, prambananData } from "./prambanan.jsx";
import { BaroqueCover, baroqueDecor } from "./baroque.jsx";
import { ArunikaCover, arunikaDecor, arunikaData } from "./arunika.jsx";
import { GoldenMinangCover, goldenMinangDecor, goldenMinangData } from "./goldenMinang.jsx";
import { CelestialCover, celestialDecor } from "./celestial.jsx";
import { GardenCover, gardenDecor } from "./garden.jsx";
import { RoyalSapphireCover, royalSapphireDecor } from "./royalSapphire.jsx";
import { CelestialNocturneCover, celestialNocturneDecor } from "./celestialNocturne.jsx";
import { AzureCascadeCover, azureCascadeDecor } from "./azureCascade.jsx";
import { GebyokKencanaCover, gebyokKencanaDecor } from "./gebyokKencana.jsx";
import { SuntingRajoCover, suntingRajoDecor } from "./suntingRajo.jsx";

// template katalog dengan cover & dekorasi khusus
const SPECIAL = {
  "botanical-glasshouse": { Cover: GlasshouseCover, decor: glasshouseDecor },
  "villa-aurelia": { Cover: AureliaCover, decor: aureliaDecor, data: aureliaData },
  "sekar-prambanan": { Cover: PrambananCover, decor: prambananDecor, data: prambananData },
  "baroque-palace": { Cover: BaroqueCover, decor: baroqueDecor },
  arunika: { Cover: ArunikaCover, decor: arunikaDecor, data: arunikaData },
  "golden-minang": { Cover: GoldenMinangCover, decor: goldenMinangDecor, data: goldenMinangData },
  "celestial-luxury": { Cover: CelestialCover, decor: celestialDecor },
  "secret-garden": { Cover: GardenCover, decor: gardenDecor },
  "royal-sapphire": { Cover: RoyalSapphireCover, decor: royalSapphireDecor },
  "celestial-nocturne": { Cover: CelestialNocturneCover, decor: celestialNocturneDecor },
  "azure-cascade": { Cover: AzureCascadeCover, decor: azureCascadeDecor },
  "gebyok-kencana": { Cover: GebyokKencanaCover, decor: gebyokKencanaDecor },
  "sunting-rajo": { Cover: SuntingRajoCover, decor: suntingRajoDecor },
};

/* ============================================================
   DEMO KATALOG
   Template katalog yang belum punya file undangan sendiri ditampilkan
   memakai mesin undangan Dark Elegance, dengan warna & cover dari katalog.
   ============================================================ */

export default function ThemedDemo({ template, isPremium, isLuxury, guestName }) {
  // warna tema dipasang di <html> agar seluruh halaman (termasuk latar body) ikut berubah
  useLayoutEffect(() => {
    const root = document.documentElement;
    const vars = themeVars(template);
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    return () => Object.keys(vars).forEach((k) => root.style.removeProperty(k));
  }, [template]);

  const special = SPECIAL[template.id];
  const Cover = special?.Cover ?? ThemedCover;

  return (
    <DarkElegance
      isPremium={isPremium}
      isLuxury={isLuxury}
      guestName={guestName}
      data={(special?.data ?? ((d) => d))(demoDataFor(template, DEFAULT_DATA))}
      decor={special?.decor ?? null}
      renderCover={({ guestName: name, onOpen }) => <Cover t={template} guestName={name} onOpen={onOpen} />}
    />
  );
}
