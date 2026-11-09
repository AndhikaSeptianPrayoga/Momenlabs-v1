/* ============================================================
   MOMENLABS — TOKEN DESAIN
   ------------------------------------------------------------
   Satu sumber gaya untuk semua template undangan. Tiap "tone" adalah
   keluarga gaya (palet + tipografi + kaca panel) yang dipakai komponen
   kit (cover, hero, hitung mundur, dekorasi section, kelopak, debu).
   Kelas Tailwind ditulis utuh agar ikut terbaca saat build (JIT).
   Lihat docs/02-riset-desain-undangan.md untuk alasan & aturan desain.
   ============================================================ */

/* pasangan font (didefinisikan di tailwind.config.js) */
export const FONTS = {
  display: "font-display", // Instrument Serif — judul editorial
  script: "font-script", // Great Vibes — nama pengantin
  caps: "font-cinzel", // Cinzel — kicker & label huruf kapital
  body: "font-cormorant", // Cormorant — teks undangan
  ui: "font-sans", // Plus Jakarta Sans — antarmuka
};

/* irama gerak bersama */
export const MOTION = {
  ease: [0.22, 1, 0.36, 1], // keluar halus (judul, panel)
  door: [0.45, 0, 0.25, 1], // pintu / tirai membuka
  dolly: [0.45, 0, 0.2, 1], // kamera maju
  pop: [0.34, 1.4, 0.5, 1], // objek muncul dengan sedikit pantulan
  reveal: { delay: 2.4, duration: 1.4 }, // nama muncul setelah pembukaan
};

/* keluarga gaya */
export const TONES = {
  /* European Royal — maroon & emas (Baroque Grand Palace) */
  maroon: {
    dark: true,
    kicker: "text-[#E9C98A]",
    title: "text-foil drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)]",
    amp: "text-[#E9C98A]",
    body: "text-[#F6E6D0]",
    hint: "text-[#F6E6D0]/60",
    panel: "border-[#D4AF37]/40 bg-[#4A0E17]/70 text-[#F6E6D0] shadow-[0_20px_40px_-18px_rgba(0,0,0,0.7)]",
    count: "text-foil",
    countLabel: "text-[#F6E6D0]/60",
    button: "bg-foil text-[#4A0E17] shadow-[0_14px_30px_-10px_rgba(212,175,55,0.7)]",
    coverBg: "bg-[#2A060C]",
    wash: "bg-[radial-gradient(90%_70%_at_50%_45%,rgba(58,10,18,0.78),rgba(30,4,8,0.95))]",
    washMax: 0.62,
    line: "via-[#D4AF37]/50",
    glow: "rgba(212,175,55,0.10)",
    petals: { from: ["#B3122A", "#E9A3AE", "#8E0E20", "#F4C9C4"], to: "#4A0E17" },
    dust: { color: "#F6DB8C", glow: "rgba(212,175,55,0.8)" },
  },
  /* Italian garden — espresso & emas (Villa Aurelia) */
  espresso: {
    dark: true,
    kicker: "text-[#E9C98A]",
    title: "text-foil drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
    amp: "text-[#E9C98A]",
    body: "text-[#F6E6D0]",
    hint: "text-[#F6E6D0]/60",
    panel: "border-[#E9C98A]/30 bg-[#2A1E12]/60 text-[#F6E6D0] shadow-[0_20px_40px_-18px_rgba(0,0,0,0.7)]",
    count: "text-foil",
    countLabel: "text-[#F6E6D0]/60",
    button: "bg-foil text-[#3A2A18] shadow-[0_14px_30px_-10px_rgba(233,201,138,0.7)]",
    coverBg: "bg-[#2A1E12]",
    wash: "bg-[radial-gradient(90%_70%_at_50%_45%,rgba(42,30,18,0.72),rgba(26,18,10,0.93))]",
    washMax: 0.58,
    line: "via-[#E9C98A]/40",
    glow: "rgba(233,180,120,0.10)",
    petals: { from: ["#FFF8EE", "#F7E7D2", "#FBEFE2", "#EFD9BE"], to: "#D8BC98" },
    dust: { color: "#FFF0C8", glow: "rgba(255,226,160,0.8)" },
  },
  /* Adat Jawa — cokelat candi & emas (Sekar Prambanan) */
  javanese: {
    dark: true,
    kicker: "text-[#E8C77E]",
    title: "text-foil drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
    amp: "text-[#E8C77E]",
    body: "text-[#F7E8D0]",
    hint: "text-[#F7E8D0]/60",
    panel: "border-[#E8C77E]/30 bg-[#2B1A10]/60 text-[#F7E8D0] shadow-[0_20px_40px_-18px_rgba(0,0,0,0.7)]",
    count: "text-foil",
    countLabel: "text-[#F7E8D0]/60",
    button: "bg-foil text-[#3A2414] shadow-[0_14px_30px_-10px_rgba(232,199,126,0.7)]",
    coverBg: "bg-[#2B1A10]",
    wash: "bg-[radial-gradient(90%_70%_at_50%_45%,rgba(43,26,16,0.72),rgba(26,15,8,0.93))]",
    washMax: 0.58,
    line: "via-[#E8C77E]/40",
    glow: "rgba(232,180,120,0.10)",
    petals: { from: ["#B3122A", "#F4B8BE", "#FFF8EE", "#8E0E20"], to: "#5E0612" },
    dust: { color: "#FFF0C8", glow: "rgba(255,226,160,0.8)" },
  },
  /* Adat Minang royal — marun songket, emas & krem (Sunting Rajo) */
  minang: {
    dark: true,
    kicker: "text-[#F0CD82]",
    title: "text-foil drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)]",
    amp: "text-[#F0CD82]",
    body: "text-[#FBEBD8]",
    hint: "text-[#FBEBD8]/60",
    panel: "border-[#F0CD82]/35 bg-[#3A0A0E]/70 text-[#FBEBD8] shadow-[0_20px_40px_-18px_rgba(0,0,0,0.75)]",
    count: "text-foil",
    countLabel: "text-[#FBEBD8]/60",
    button: "bg-foil text-[#3A0A0E] shadow-[0_14px_30px_-10px_rgba(240,205,130,0.7)]",
    coverBg: "bg-[#2A0709]",
    wash: "bg-[radial-gradient(90%_70%_at_50%_45%,rgba(58,10,14,0.74),rgba(30,5,7,0.94))]",
    washMax: 0.6,
    line: "via-[#F0CD82]/40",
    glow: "rgba(240,180,120,0.10)",
    petals: { from: ["#B3122A", "#E8435A", "#FFF3E0", "#8E0E20"], to: "#5E0612" },
    dust: { color: "#FFF0C8", glow: "rgba(255,214,140,0.85)" },
  },
  /* Adat Jawa fajar — jingga matahari terbit, ungu subuh & emas (Arunika) */
  sunrise: {
    dark: true,
    kicker: "text-[#FFD9A0] drop-shadow-[0_2px_10px_rgba(40,14,20,0.7)]",
    title: "text-foil drop-shadow-[0_4px_14px_rgba(40,12,16,0.65)]",
    amp: "text-[#FFC27A]",
    body: "text-[#FFF1DE] drop-shadow-[0_2px_10px_rgba(40,14,20,0.7)]",
    hint: "text-[#FFF1DE]/70",
    panel: "border-[#FFC27A]/35 bg-[#3A1A14]/60 text-[#FFF1DE] shadow-[0_20px_40px_-18px_rgba(40,10,0,0.7)]",
    count: "text-foil",
    countLabel: "text-[#FFF1DE]/60",
    button: "bg-[linear-gradient(135deg,#FFE0A0,#F29A48_55%,#D0602E)] text-[#3A1408] shadow-[0_14px_30px_-10px_rgba(240,138,60,0.75)]",
    coverBg: "bg-[#1E1634]",
    wash: "bg-[radial-gradient(90%_70%_at_50%_45%,rgba(58,24,18,0.7),rgba(30,12,12,0.93))]",
    washMax: 0.58,
    line: "via-[#FFC27A]/45",
    glow: "rgba(255,170,90,0.12)",
    petals: { from: ["#FFFDF6", "#FFF3DC", "#FFE2B8", "#F6B46A"], to: "#C8702E" }, // melati & kenanga
    dust: { color: "#FFE6B8", glow: "rgba(255,190,110,0.85)" },
  },
  /* Adat Minang senja — emas golden hour & cokelat kayu (Golden Minangkabau) */
  goldenHour: {
    dark: true,
    kicker: "text-[#FFE3A6] drop-shadow-[0_2px_10px_rgba(36,20,4,0.75)]",
    title: "text-foil drop-shadow-[0_4px_14px_rgba(36,18,4,0.7)]",
    amp: "text-[#F6C866]",
    body: "text-[#FFF4E0] drop-shadow-[0_2px_10px_rgba(36,20,4,0.75)]",
    hint: "text-[#FFF4E0]/70",
    panel: "border-[#F2C25E]/35 bg-[#2E1C0A]/60 text-[#FFF4E0] shadow-[0_20px_40px_-18px_rgba(30,14,0,0.7)]",
    count: "text-foil",
    countLabel: "text-[#FFF4E0]/60",
    button: "bg-[linear-gradient(135deg,#FFEDB0,#E8B04A_55%,#B87A24)] text-[#2E1A06] shadow-[0_14px_30px_-10px_rgba(232,176,74,0.75)]",
    coverBg: "bg-[#2A1A0C]",
    wash: "bg-[radial-gradient(90%_70%_at_50%_45%,rgba(46,28,10,0.72),rgba(24,14,4,0.93))]",
    washMax: 0.58,
    line: "via-[#F2C25E]/45",
    glow: "rgba(255,196,100,0.12)",
    petals: { from: ["#FFF2CC", "#F6D27A", "#E8A848", "#FFE6A8"], to: "#9A6418" }, // daun & kelopak emas
    dust: { color: "#FFE2A0", glow: "rgba(255,200,110,0.85)" },
  },
  /* Garden wedding terang — krem & cokelat (Botanical Glasshouse) */
  ivory: {
    dark: false,
    kicker: "text-[#7A5A3A] drop-shadow-[0_2px_10px_rgba(255,246,230,0.95)]",
    title: "text-[#5A3A22] drop-shadow-[0_2px_10px_rgba(255,246,230,0.95)]",
    amp: "text-[#9A7244]",
    body: "text-[#5E4430] drop-shadow-[0_2px_10px_rgba(255,246,230,0.95)]",
    hint: "text-[#5E4430]/80 drop-shadow-[0_2px_10px_rgba(255,246,230,0.95)]",
    panel: "border-white/60 bg-[#FFF8EE]/70 text-[#4E3A28] shadow-[0_20px_40px_-18px_rgba(70,40,20,0.5)]",
    count: "text-[#6B4A2C]",
    countLabel: "text-[#6B4A2C]/60",
    button: "bg-foil text-[#3E2A18] shadow-[0_14px_30px_-10px_rgba(179,138,78,0.7)]",
    coverBg: "bg-[#F7EBDD]",
    wash: "bg-[radial-gradient(90%_70%_at_50%_45%,rgba(253,248,240,0.9),rgba(247,238,226,0.97))]",
    washMax: 0.84,
    line: "via-[#B38A4E]/40",
    glow: "rgba(255,226,180,0.18)",
    petals: { from: ["#FFFBF4", "#F9DCD6", "#FFF3E2", "#F3CFC4"], to: "#DDBFA6" },
    dust: { color: "#FFF6DC", glow: "rgba(255,230,170,0.75)" },
  },
  /* Botanical Heritage — toile de Jouy biru safir & emas di atas kertas krem (Royal Sapphire) */
  sapphire: {
    dark: false,
    kicker: "text-[#3A5486]",
    title: "text-[#1E3264]",
    amp: "text-[#B08A3E]",
    body: "text-[#33405E]",
    hint: "text-[#33405E]/70",
    panel: "border-[#C9A55A]/45 bg-[#FBF7EE]/85 text-[#24365F] shadow-[0_20px_40px_-18px_rgba(30,50,100,0.35)]",
    count: "text-[#1E3264]",
    countLabel: "text-[#1E3264]/60",
    button: "bg-foil text-[#1E2A48] shadow-[0_14px_30px_-10px_rgba(176,138,62,0.7)]",
    coverBg: "bg-[#F1ECE2]",
    wash: "bg-[radial-gradient(90%_70%_at_50%_45%,rgba(250,247,240,0.86),rgba(238,234,224,0.95))]",
    washMax: 0.82,
    line: "via-[#B08A3E]/45",
    glow: "rgba(200,170,100,0.14)",
    petals: { from: ["#FFFFFF", "#E8EEF8", "#F6EBD2", "#9FB2D6"], to: "#6A7FA8" },
    dust: { color: "#F6DE9E", glow: "rgba(230,190,110,0.85)" },
  },
  /* Modern Celestial Luxury — langit tengah malam navy, emas & krem (Celestial Nocturne) */
  nocturne: {
    dark: true,
    kicker: "text-[#E8C987]",
    title: "text-foil drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]",
    amp: "text-[#E8C987]",
    body: "text-[#F3E6C8]",
    hint: "text-[#F3E6C8]/60",
    panel: "border-[#D4AF6A]/35 bg-[#0B1230]/60 text-[#F3E6C8] shadow-[0_20px_40px_-18px_rgba(0,0,0,0.7)]",
    count: "text-foil",
    countLabel: "text-[#F3E6C8]/60",
    button: "bg-foil text-[#141A35] shadow-[0_14px_30px_-10px_rgba(212,175,106,0.7)]",
    coverBg: "bg-[#020D19]",
    wash: "bg-[radial-gradient(90%_70%_at_50%_45%,rgba(4,16,30,0.72),rgba(2,6,14,0.92))]",
    washMax: 0.6,
    line: "via-[#D4AF6A]/40",
    glow: "rgba(212,175,106,0.12)",
    petals: { from: ["#FFF6E0", "#F3E6C8", "#E8C987", "#FFFFFF"], to: "#B08A4A" },
    dust: { color: "#FFE9B0", glow: "rgba(232,201,135,0.9)" },
  },
};
