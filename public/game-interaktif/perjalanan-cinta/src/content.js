// =====================================================================
// ISI CERITA — ganti bagian ini untuk tiap klien (nama, dialog, kuis, foto).
// Foto: isi `photo: 'foto/awal.jpg'` di tiap kenangan untuk memakai foto asli.
// =====================================================================
export const COUPLE = { him: 'Raka', her: 'Alya', date: '14 Februari 2027' };

export const TEXT = {
  title: 'Perjalanan Cinta',
  subtitle: `${COUPLE.him} & ${COUPLE.her}`,
  tagline: 'Dari pertama kenal sampai hari bahagia',
  demo: 'Contoh Demo',
  start: 'Mulai Petualangan',
  hint: 'Gerak: WASD / panah · Bicara: E',
  hintTouch: 'Geser joystick untuk jalan · ketuk tombol hati untuk bicara',
  locked: 'Selesaikan bab ini dulu, ya!',
  finaleAsk: 'Tulis pesan untuk pasanganmu',
  finalePlaceholder: 'Tulis harapan dan doa untuk perjalanan kalian berdua…',
  finaleSend: 'Terbangkan ke langit ✨',
  amen: 'Semoga dikabulkan oleh Yang di Atas ya..',
  roam: 'Lanjut jalan-jalan',
  replay: 'Main dari awal',
};

export const MEMORIES = {
  awal: { emoji: '📚', title: 'Pertama Kenal', colors: ['#ffd6e0', '#ffe9b8'], caption: 'Perpustakaan kampus — buku yang tinggal satu.' },
  kencan: { emoji: '🍜', title: 'Kencan Pertama', colors: ['#ffe2c2', '#ffc9d6'], caption: 'Mie ayam pinggir jalan, ngobrol sampai warung tutup.' },
  jadian: { emoji: '💌', title: 'Hari Jadian', colors: ['#e3d9ff', '#ffd6e0'], caption: 'Bangku taman, sore yang bikin deg-degan.' },
  lamaran: { emoji: '💍', title: 'Lamaran', colors: ['#ffd9b0', '#ffb3c7'], caption: 'Pantai saat senja — dan jawabannya "iya".' },
  nikah: { emoji: '💒', title: 'Hari Bahagia', colors: ['#fff1c9', '#ffd6e0'], caption: 'Babak baru dimulai, berdua selamanya.' },
};

// Bab berurutan. Setiap bab: dialog → (mini game) → kuis → foto kenangan → gerbang terbuka.
export const CHAPTERS = [
  {
    id: 'awal', name: 'Bab 1 · Awal Kenal', place: 'Perpustakaan Kampus',
    talk: 'Sapa Alya',
    dialog: [
      ['her', 'Eh… kamu juga mau pinjam buku ini? Tinggal satu, lho.'],
      ['him', 'Iya, tapi kamu duluan aja. Aku bisa nunggu, kok.'],
      ['her', 'Hehe, makasih ya. Kapan-kapan aku traktir kopi deh sebagai gantinya!'],
    ],
    quiz: { q: 'Di mana Raka dan Alya pertama kali bertemu?', options: ['Konser musik', 'Perpustakaan kampus', 'Kedai kopi', 'Stasiun kereta'], answer: 1 },
  },
  {
    id: 'kencan', name: 'Bab 2 · Kencan Pertama', place: 'Warung Mie Ayam',
    talk: 'Ajak Alya makan',
    dialog: [
      ['him', 'Jadi… traktiran kopinya diganti mie ayam aja gimana?'],
      ['her', 'Boleh! Tapi bantuin aku kumpulin hati yang berceceran dulu, ya. Hehe.'],
    ],
    minigame: { count: 8, time: 30, intro: 'Kumpulkan 8 hati sebelum waktu habis!' },
    quiz: { q: 'Apa menu kencan pertama mereka?', options: ['Sushi', 'Steak', 'Mie ayam pinggir jalan', 'Martabak manis'], answer: 2 },
  },
  {
    id: 'jadian', name: 'Bab 3 · Jadian', place: 'Taman Kota',
    talk: 'Duduk bareng Alya',
    dialog: [
      ['him', 'Alya… aku mau jujur. Aku… sayang kamu.'],
      ['her', '…Dari tadi aku nungguin kamu ngomong itu, tahu.'],
      ['her', 'Mulai sekarang kita jalan bareng, ya?'],
    ],
    quiz: { q: 'Siapa yang pertama kali bilang "aku sayang kamu"?', options: ['Raka', 'Alya', 'Barengan', 'Lewat surat'], answer: 0 },
    follow: true, // setelah bab ini, Alya ikut berjalan bersama pemain
  },
  {
    id: 'lamaran', name: 'Bab 4 · Lamaran', place: 'Pantai Senja',
    talk: 'Lamar Alya',
    dialog: [
      ['him', 'Tiga tahun bareng kamu adalah tiga tahun terbaik di hidupku.'],
      ['him', 'Alya… maukah kamu menikah denganku?'],
      ['her', 'Iya… iya, aku mau! 😭💖'],
    ],
    quiz: { q: 'Berapa lama mereka pacaran sebelum lamaran?', options: ['1 tahun', '2 tahun', '3 tahun', '5 tahun'], answer: 2 },
    proposal: true,
  },
  {
    id: 'nikah', name: 'Bab 5 · Hari Bahagia', place: 'Taman Pernikahan',
    talk: 'Melangkah ke pelaminan',
    dialog: [
      ['her', 'Nggak nyangka ya, dari buku yang tinggal satu… sampai sini.'],
      ['him', 'Dan ini baru permulaan. Ayo, semua sudah menunggu.'],
    ],
    quiz: { q: 'Apa mimpi bersama mereka setelah menikah?', options: ['Keliling Eropa', 'Rumah dengan taman kecil', 'Buka kafe', 'Pindah ke luar kota'], answer: 1 },
    wedding: true,
  },
];
