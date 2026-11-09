import React from "react";
import { FONTS, MOTION, TONES } from "./tokens.js";
import { Bird, Butterflies, CoverTitle, Dust, GuestPanel, Petals } from "./kit/index.js";

/* ============================================================
   MOMENLABS — STYLE GUIDE (/?design=1)
   Halaman review design system: token tiap keluarga gaya, tipografi,
   irama gerak & komponen kit, dirender langsung dari kode yang dipakai
   template (bukan salinan), jadi selalu sesuai kenyataan.
   ============================================================ */

const TONE_INFO = {
  maroon: { label: "Maroon & Emas", use: "European Royal — Baroque Grand Palace", swatch: ["#2A060C", "#4A0E17", "#B23A33", "#D4AF37", "#F6E6D0"] },
  espresso: { label: "Espresso & Emas", use: "Italian Garden — Villa Aurelia", swatch: ["#2A1E12", "#3A2A18", "#C99A62", "#E9C98A", "#F6E6D0"] },
  javanese: { label: "Candi & Emas", use: "Adat Jawa — Sekar Prambanan", swatch: ["#2B1A10", "#3A2414", "#C9925C", "#E8C77E", "#F7E8D0"] },
  sunrise: { label: "Fajar Jingga", use: "Adat Jawa — Arunika", swatch: ["#1E1634", "#86446A", "#EC8E4E", "#FFC27A", "#FFF1DE"] },
  goldenHour: { label: "Emas Senja", use: "Adat Minang — Golden Minangkabau", swatch: ["#2A1A0C", "#5A3410", "#B87A24", "#F2C25E", "#FFF4E0"] },
  ivory: { label: "Ivory & Cokelat", use: "Garden Wedding — Botanical Glasshouse", swatch: ["#F7EBDD", "#FFF8EE", "#B38A4E", "#7A5A3A", "#4E3A28"] },
};

const SAMPLE = { names: "Raka & Dinda", kicker: "The Wedding of" };

function Section({ title, note, children }) {
  return (
    <section className="border-t border-white/10 py-12">
      <h2 className="font-display text-3xl text-[#F3EADB]">{title}</h2>
      {note && <p className="mt-1 max-w-2xl text-sm text-[#F3EADB]/60">{note}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/* pratinjau satu tone: judul cover + panel tamu di atas latar tone */
function TonePreview({ id }) {
  const tone = TONES[id];
  const info = TONE_INFO[id];
  const bg = tone.dark ? "bg-[radial-gradient(120%_80%_at_50%_30%,#5a3a2a,#1a0c08)]" : "bg-[radial-gradient(120%_80%_at_50%_30%,#fff4e4,#e9cfae)]";
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className={`relative h-[420px] overflow-hidden ${bg}`}>
        <Dust palette={tone.dust} count={10} />
        <Petals palette={tone.petals} count={6} />
        <CoverTitle tone={tone} t={SAMPLE} leaving={false} delay={-2} />
        <GuestPanel tone={tone} guestName="Bapak Andi" leaving={false} onOpen={() => {}} delay={0} />
      </div>
      <div className="p-5">
        <p className="font-cinzel text-xs tracking-[0.3em] text-gold">{id.toUpperCase()}</p>
        <p className="mt-1 font-display text-2xl text-[#F3EADB]">{info.label}</p>
        <p className="text-sm text-[#F3EADB]/60">{info.use}</p>
        <div className="mt-4 flex gap-2">
          {info.swatch.map((c) => (
            <div key={c} className="text-center">
              <div className="h-10 w-10 rounded-full border border-white/20" style={{ background: c }} />
              <p className="mt-1 font-mono text-[9px] text-[#F3EADB]/50">{c}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StyleGuide() {
  return (
    <div className="theme-noir min-h-screen bg-noir px-6 py-12 font-sans text-[#F3EADB] md:px-16">
      <header>
        <p className="font-cinzel text-xs tracking-[0.4em] text-gold">MOMENLABS DESIGN SYSTEM</p>
        <h1 className="mt-2 font-display text-5xl md:text-6xl">Style Guide Undangan</h1>
        <p className="mt-3 max-w-2xl text-[#F3EADB]/70">
          Token & komponen bersama untuk semua template berbasis adegan. Sumber: <code className="text-gold">src/design/tokens.js</code> &{" "}
          <code className="text-gold">src/design/kit/</code>. Aturan desain: <code className="text-gold">docs/02-riset-desain-undangan.md</code>.
        </p>
      </header>

      <Section title="Keluarga gaya (tone)" note="Tiap template memilih satu tone. Judul cover, panel tamu, hitung mundur, kelopak & debu otomatis mengikuti.">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Object.keys(TONES).map((id) => (
            <TonePreview key={id} id={id} />
          ))}
        </div>
      </Section>

      <Section title="Tipografi" note="Pasangan font tetap; ukuran mengikuti peran.">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            [FONTS.script, "Script — nama pengantin", "Raka & Dinda", "text-5xl"],
            [FONTS.caps, "Caps — kicker & label", "THE WEDDING OF", "text-sm tracking-[0.4em]"],
            [FONTS.display, "Display — judul editorial", "Kisah Kami", "text-4xl"],
            [FONTS.body, "Body — teks undangan", "Dengan memohon rahmat dan ridho Allah SWT…", "text-xl italic"],
          ].map(([font, role, sample, size]) => (
            <div key={role} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs text-[#F3EADB]/50">
                {role} · <code>{font}</code>
              </p>
              <p className={`mt-2 ${font} ${size}`}>{sample}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Irama gerak" note="Easing bersama di MOTION — dipakai pembukaan, tirai, kamera & objek muncul.">
        <div className="grid gap-3 md:grid-cols-5">
          {Object.entries(MOTION).map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-cinzel text-xs tracking-[0.2em] text-gold">{k}</p>
              <p className="mt-1 font-mono text-[11px] text-[#F3EADB]/70">{JSON.stringify(v)}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Makhluk hidup" note="Burung tampak samping (mengepak 3× lalu melayang) & kupu-kupu bersayap 3D — beranatomi, bukan siluet.">
        <div className="relative grid h-72 grid-cols-3 items-center overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#f6c27a,#e8875a)]">
          {[110, 70, 40].map((size, i) => (
            <div key={size} className="flex justify-center">
              <Bird size={size} tone={["rgba(48,26,14,0.92)", "rgba(70,40,22,0.75)", "rgba(90,56,34,0.55)"][i]} flap={2.6} delay={i * 0.3} detail={i === 0} />
            </div>
          ))}
          <Butterflies />
        </div>
      </Section>
    </div>
  );
}
