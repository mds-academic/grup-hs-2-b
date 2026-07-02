export const courseData = {
  1: {
    kicker: "Checkpoint 01",
    title: "Video Pembelajaran",
    duration: "Tonton Video Ini",
    videoId: "RnyYn2SzFVU",
    startSeconds: 2,
    endSeconds: 239,
    bookmarks: [
      { time: 2, label: "Pengenalan Algoritma" },
      { time: 65, label: "Perbedaan Algoritma" },
      { time: 109, label: "Optimasi Algoritma" },
      { time: 160, label: "Contoh Optimasi Algoritma" }
    ],
    quizzes: [
      {
        time: 238, // 3:58
        resume: false,
        questions: [
          {
            type: "essay",
            title: "Analogi Logika: Menebak Angka 1-100",
            question: "Temanmu memikirkan angka 1 sampai 100. Kamu hanya boleh bertanya 'Apakah lebih besar/kecil?'. Bagaimana cara tercepat untuk menebak angka tersebut dengan jumlah tebakan sesedikit mungkin? Jelaskan logikamu!",
            minChars: 150,
            keywords: ["tengah", "50", "bagi dua", "setengah", "dibagi dua", "nilai tengah"],
            successMessage: "Selamat! Kamu menemukan cara yang paling efisien (Binary Search / selalu membagi dua rentang angka).",
            failureMessage: "Usaha yang bagus! Tapi ada cara yang jauh lebih cepat, yaitu selalu menebak nilai tengahnya (50, lalu 75, dst.) karena akan langsung membuang setengah kemungkinan salah. Ini disebut Binary Search!"
          }
        ]
      }
    ]
  },
  2: {
    kicker: "Checkpoint 02",
    title: "Optimasi Loop & Step Count",
    duration: "Tonton Video Ini",
    videoId: "RnyYn2SzFVU",
    startSeconds: 240,
    endSeconds: 882,
    bookmarks: [
      { time: 240, label: "Apa itu Step Count?" },
      { time: 420, label: "Mencari Angka pada Array" },
      { time: 480, label: "Implementasi For Loop" },
      { time: 750, label: "Optimasi dengan Break" }
    ],
    quizzes: [
      {
        time: 881, // 14:41
        resume: false,
        questions: [
          {
            type: "input",
            title: "Mini Activity: Hitung Step Count 🎯",
            html: `
              <div style="text-align: left; font-family: 'Outfit', sans-serif;">
                <div style="display: inline-block; background-color: #ffe600; padding: 10px 24px; border-radius: 12px; border: 3px solid #1a1a1a; box-shadow: 4px 4px 0px #1a1a1a; margin-bottom: 24px; margin-top: 10px;">
                  <h3 style="margin: 0; font-size: 22px; font-weight: 800; color: #1a1a1a;">Mini Activity: Hitung Step Count 🎯</h3>
                </div>
                
                <p style="font-weight: 800; font-size: 18px; color: #1a1a1a; margin-bottom: 16px;">Perhatikan daftar ini:</p>
                
                <div style="background-color: #1a1a1a; padding: 24px; border-radius: 16px; font-family: 'Courier New', Courier, monospace; font-size: 16px; margin-bottom: 24px; border: 3px solid #ffe600; box-shadow: 4px 4px 0px #ffe600; color: #f8f8f2; line-height: 1.6; font-weight: bold;">
                  <div><span style="color: #ff79c6;">numbers</span> <span style="color: #ffb86c;">=</span> <span style="color: #f1fa8c;">[</span><span style="color: #50fa7b;">5</span><span style="color: #f8f8f2;">,</span> <span style="color: #50fa7b;">8</span><span style="color: #f8f8f2;">,</span> <span style="color: #50fa7b;">12</span><span style="color: #f8f8f2;">,</span> <span style="color: #50fa7b;">20</span><span style="color: #f8f8f2;">,</span> <span style="color: #50fa7b;">25</span><span style="color: #f8f8f2;">,</span> <span style="color: #50fa7b;">30</span><span style="color: #f1fa8c;">]</span></div>
                  <div style="margin-top: 8px;"><span style="color: #ff79c6;">target</span> <span style="color: #ffb86c;">=</span> <span style="color: #50fa7b;">20</span></div>
                </div>
                
                <p style="font-weight: 800; font-size: 18px; color: #1a1a1a;">Jika program mencari dari kiri ke kanan dan berhenti saat ketemu, berapa step count-nya?</p>
              </div>
            `,
            correct: "4",
            explanation: "Program mengecek satu per satu: 5, 8, 12, dan terakhir 20. Total ada 4 langkah."
          },
          {
            type: "input",
            title: "Latihan: Tebak Output 🕵️‍♂️",
            html: `
              <div style="text-align: left; font-family: 'Outfit', sans-serif;">
                <div style="display: inline-block; background-color: #ffe600; padding: 10px 24px; border-radius: 12px; border: 3px solid #1a1a1a; box-shadow: 4px 4px 0px #1a1a1a; margin-bottom: 24px; margin-top: 10px;">
                  <h3 style="margin: 0; font-size: 22px; font-weight: 800; color: #1a1a1a;">Latihan: Tebak Output 🕵️‍♂️</h3>
                </div>
                
                <div style="background-color: #1a1a1a; padding: 24px; border-radius: 16px; font-family: 'Courier New', Courier, monospace; font-size: 16px; margin-bottom: 24px; border: 3px solid #ffe600; box-shadow: 4px 4px 0px #ffe600; color: #f8f8f2; line-height: 1.6; font-weight: bold;">
                  <div><span style="color: #ff79c6;">numbers</span> <span style="color: #ffb86c;">=</span> <span style="color: #f1fa8c;">[</span><span style="color: #50fa7b;">2</span><span style="color: #f8f8f2;">,</span> <span style="color: #50fa7b;">4</span><span style="color: #f8f8f2;">,</span> <span style="color: #50fa7b;">6</span><span style="color: #f8f8f2;">,</span> <span style="color: #50fa7b;">8</span><span style="color: #f8f8f2;">,</span> <span style="color: #50fa7b;">10</span><span style="color: #f1fa8c;">]</span></div>
                  <div style="margin-top: 8px;"><span style="color: #ff79c6;">target</span> <span style="color: #ffb86c;">=</span> <span style="color: #50fa7b;">6</span></div>
                  <br>
                  <div><span style="color: #ff79c6;">steps</span> <span style="color: #ffb86c;">=</span> <span style="color: #50fa7b;">0</span></div>
                  <br>
                  <div><span style="color: #ff79c6;">for</span> <span style="color: #f8f8f2;">number</span> <span style="color: #ff79c6;">in</span> <span style="color: #f8f8f2;">numbers:</span></div>
                  <div style="padding-left: 32px;"><span style="color: #f8f8f2;">steps</span> <span style="color: #ffb86c;">+=</span> <span style="color: #50fa7b;">1</span></div>
                  <div style="padding-left: 32px;"><span style="color: #ff79c6;">if</span> <span style="color: #f8f8f2;">number</span> <span style="color: #ffb86c;">==</span> <span style="color: #f8f8f2;">target:</span></div>
                  <div style="padding-left: 64px; color: #ff79c6;">break</div>
                  <br>
                  <div><span style="color: #8be9fd;">print</span><span style="color: #f1fa8c;">(</span><span style="color: #f8f8f2;">steps</span><span style="color: #f1fa8c;">)</span></div>
                </div>
                
                <p style="font-weight: 800; font-size: 18px; color: #1a1a1a;">Apa output-nya?</p>
              </div>
            `,
            correct: "3",
            explanation: "Program mengecek 2, 4, lalu 6. Saat di angka 6, loop melakukan `break` lalu menampilkan isi variabel steps yaitu 3."
          }
        ]
      }
    ]
  },
  3: {
    title: "Optimasi Program Python",
    duration: "Tonton Video Ini",
    videoId: "RnyYn2SzFVU",
    startSeconds: 909,
    endSeconds: 1617,
    bookmarks: [
      { time: 910, label: "Prinsip DRY (Don't Repeat)" },
      { time: 981, label: "Looping untuk Efisiensi" },
      { time: 1200, label: "Menjumlahkan Data Array" },
      { time: 1402, label: "Menggunakan Function sum()" },
      { time: 1471, label: "Memilih Algoritma yang Tepat" }
    ],
    quizzes: [
      {
        time: 1616, // 26:56
        resume: false,
        questions: [
          {
            type: "card_choice",
            title: "Latihan: Pilih Algoritma Lebih Efisien 🤔",
            html: `
              <div style="text-align: left; font-family: 'Outfit', sans-serif;">
                <div style="background-color: #00c3ff; color: #000; font-weight: 800; font-size: 16px; padding: 6px 14px; border-radius: 8px; border: 2px solid #000; display: inline-block; margin-bottom: 15px; box-shadow: 2px 2px 0px #000;">
                  Kasus:
                </div>
                <span style="font-weight: 800; font-size: 18px; color: #1a1a1a; margin-left: 10px;">Kamu ingin menghitung total nilai dari 30 siswa.</span>
                <p style="font-weight: 800; font-size: 18px; color: #1a1a1a; margin-top: 20px; margin-bottom: 10px;">Mana yang lebih efisien?</p>
              </div>
            `,
            cards: [
              {
                id: "A",
                title: "Cara A:",
                html: "Menulis semua nilai satu per satu<br>dalam operasi tambah."
              },
              {
                id: "B",
                title: "Cara B:",
                html: "Menyimpan nilai dalam list, lalu<br>memakai loop atau <code style='font-family: monospace; background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 4px;'>sum()</code>."
              }
            ],
            correct: "B",
            explanation: "Cara B jauh lebih efisien karena list dan loop memudahkan operasi perhitungan sekaligus, tidak perlu mengetik nama variabel satu per satu!"
          }
        ]
      }
    ]
  },
  4: {
    kicker: "Checkpoint 04 · Optimasi",
    title: "Mini Project Optimasi",
    duration: "Tugas Akhir Optimasi",
    videoId: "RnyYn2SzFVU",
    startSeconds: 1618,
    endSeconds: 1705,
    bookmarks: [
      { time: 1618, label: "Instruksi Mini Project" },
      { time: 1648, label: "Syarat dan Panduan Pengerjaan" }
    ],
    quizzes: []
  },
  5: {
    kicker: "Materi 03 · Function",
    title: "Functions in Python",
    duration: "Konsep & Praktik",
    videoId: "RnyYn2SzFVU",
    startSeconds: 1712,
    endSeconds: 3497,
    bookmarks: [
      { time: 1712, label: "Apa itu Function?" },
      { time: 2085, label: "Membuat Function (def)" },
      { time: 2337, label: "Function dengan Parameter" },
      { time: 2575, label: "Multiple Parameter" },
      { time: 2723, label: "Mengembalikan Nilai (return)" }
    ],
    quizzes: [
      {
        time: 2332,
        questions: [
          {
            type: 'input',
            html: `
              <div class="code-block" style="font-size: 16px; margin-bottom: 15px; background-color: #282a36; color: #f8f8f2; padding: 15px; border-radius: 8px; text-align: left; font-family: monospace;">
<span style="color: #ff79c6;">def</span> <span style="color: #50fa7b;">say_hello</span>():<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #8be9fd;">print</span>(<span style="color: #f1fa8c;">"Selamat pagi!"</span>)<br><br>
<span style="color: #f8f8f2;">say_hello</span>()<br>
<span style="color: #f8f8f2;">say_hello</span>()
              </div>
              <p style="margin-bottom: 5px; font-weight: bold;">Apa output-nya? (Ketikkan jawabanmu di bawah)</p>
            `,
            correct: "Selamat pagi",
            validate: function(input) {
              const lower = input.toLowerCase();
              const matches = lower.match(/selamat pagi/g);
              const count = matches ? matches.length : 0;
              
              if (count === 2) {
                return {
                  isCorrect: true,
                  feedback: "Tepat! Karena function say_hello() dipanggil dua kali, maka akan mencetak 'Selamat pagi!' sebanyak dua kali."
                };
              } else if (count === 1) {
                return {
                  isCorrect: false,
                  feedback: "Hampir! Coba perhatikan lagi kodenya, function say_hello() dipanggil berapa kali? (Ketikkan output-nya dua kali juga ya)"
                };
              } else {
                return {
                  isCorrect: false,
                  feedback: "Belum tepat. Coba cek lagi teks apa yang ada di dalam function print()?"
                };
              }
            }
          }
        ]
      },
      {
        time: 2719,
        questions: [
          {
            type: 'input',
            html: `
              <h3 style="margin-bottom: 10px; font-weight: bold; font-family: 'Fredoka', sans-serif;">Latihan: Lengkapi Function 🧩</h3>
              <p style="margin-bottom: 15px;">Lengkapi kode berikut agar function bisa menampilkan nama dan skor.</p>
              <div class="code-block" style="font-size: 16px; margin-bottom: 15px; background-color: #282a36; color: #f8f8f2; padding: 15px; border-radius: 8px; text-align: left; font-family: monospace;">
<span style="color: #ff79c6;">def</span> <span style="color: #50fa7b;">show_score</span>(___, ___):<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #8be9fd;">print</span>(<span style="color: #f1fa8c;">"Nama:"</span>, name)<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #8be9fd;">print</span>(<span style="color: #f1fa8c;">"Score:"</span>, score)<br><br>
<span style="color: #f8f8f2;">show_score</span>(<span style="color: #f1fa8c;">"Dina"</span>, <span style="color: #bd93f9;">90</span>)
              </div>
              <p style="margin-bottom: 5px; font-weight: bold;">Parameter apa yang harus diisi? (Ketikkan, pisahkan dengan koma)</p>
            `,
            correct: "name, score",
            validate: function(input) {
              const lower = input.toLowerCase().trim();
              if (lower.includes("name") && lower.includes("score")) {
                if (lower.indexOf("name") < lower.indexOf("score")) {
                  return { isCorrect: true, feedback: "Tepat! Parameter yang dibutuhkan adalah 'name' dan 'score'." };
                } else {
                  return { isCorrect: false, feedback: "Hampir tepat! Urutan parameternya terbalik nih. Harus sesuai urutan nilai yang dikirim: (string nama, angka skor)." };
                }
              } else {
                return { isCorrect: false, feedback: "Belum tepat. Coba perhatikan variabel apa yang digunakan di dalam perintah print()?" };
              }
            }
          }
        ]
      },
      {
        time: 3134,
        questions: [
          {
            title: "Latihan: Print atau Return? 🤔",
            html: `
              <div style="background-color: #00c3ff; color: #000; font-weight: 800; font-size: 16px; padding: 6px 14px; border-radius: 8px; border: 2px solid #000; display: inline-block; margin-bottom: 10px; box-shadow: 2px 2px 0px #000;">
                Kasus 1:
              </div>
              <p style="font-weight: bold; font-size: 18px; color: #1a1a1a;">Function hanya menampilkan pesan "Selamat datang".</p>
              <p style="font-weight: bold; font-size: 18px; color: #1a1a1a; margin-top: 10px;">Lebih cocok pakai apa?</p>
            `,
            choices: ["print()", "return"],
            correct: "print()",
            explanation: "Karena tujuannya HANYA menampilkan pesan ke layar (tidak diproses lebih lanjut), maka menggunakan print()."
          },
          {
            title: "Latihan: Print atau Return? 🤔",
            html: `
              <div style="background-color: #00c3ff; color: #000; font-weight: 800; font-size: 16px; padding: 6px 14px; border-radius: 8px; border: 2px solid #000; display: inline-block; margin-bottom: 10px; box-shadow: 2px 2px 0px #000;">
                Kasus 2:
              </div>
              <p style="font-weight: bold; font-size: 18px; color: #1a1a1a;">Function menghitung total harga dan hasilnya mau dipakai untuk menghitung diskon.</p>
              <p style="font-weight: bold; font-size: 18px; color: #1a1a1a; margin-top: 10px;">Lebih cocok pakai apa?</p>
            `,
            choices: ["print()", "return"],
            correct: "return",
            explanation: "Karena nilainya (total harga) akan digunakan lagi di proses selanjutnya (menghitung diskon), maka kita wajib menggunakan return."
          }
        ]
      },
      {
        time: 3321,
        questions: [
          {
            type: 'essay',
            minChars: 10,
            html: `
              <h3 style="margin-bottom: 10px; font-weight: bold; font-family: 'Fredoka', sans-serif;">Latihan: Tulis Kode Lengkap 📝</h3>
              <p style="margin-bottom: 15px;">Sekarang saatnya menggabungkan semuanya! Tulis kembali KODE LENGKAP untuk function <code>calculate_area</code> di bawah.</p>
              <div class="code-block" style="font-size: 16px; margin-bottom: 15px; background-color: #282a36; color: #f8f8f2; padding: 15px; border-radius: 8px; text-align: left; font-family: monospace;">
<span style="color: #ff79c6;">def</span> <span style="color: #50fa7b;">calculate_area</span>(___, ___):<br>
&nbsp;&nbsp;&nbsp;&nbsp;area = length * width<br>
&nbsp;&nbsp;&nbsp;&nbsp;____ area<br><br>
result = calculate_area(___, ___)<br>
____(____)
              </div>
              <p style="margin-bottom: 5px; font-weight: bold;">Tulis kodemu (lengkap) di kotak ini:</p>
            `,
            validate: function(input) {
              const lower = input.toLowerCase();
              const hasDef = lower.includes("def") && lower.includes("calculate_area");
              const hasParams = lower.includes("length") && lower.includes("width");
              const hasReturn = lower.includes("return") && lower.includes("area");
              const hasCall = lower.includes("calculate_area(10, 5)") || lower.includes("calculate_area(10,5)");
              const hasPrint = lower.includes("print(result)");
              
              if (hasDef && hasParams && hasReturn && hasCall && hasPrint) {
                return { isCorrect: true, feedback: "Sempurna! Kamu berhasil membuat function-nya, mengembalikan nilainya (return), lalu memanggil dan mencetak hasilnya." };
              } else if (!hasReturn) {
                return { isCorrect: false, feedback: "Hampir! Ingat, function ini harus **mengembalikan** nilai area. Jangan lupa kata kunci 'return'." };
              } else if (!hasCall) {
                return { isCorrect: false, feedback: "Function sudah ada, tapi pemanggilannya belum tepat. Pastikan kamu memanggil dengan argumen 10 dan 5." };
              } else if (!hasPrint) {
                return { isCorrect: false, feedback: "Nilainya sudah ditampung ke variabel result, tapi belum dicetak ke layar. Jangan lupa print hasilnya!" };
              } else {
                return { isCorrect: false, feedback: "Kodenya belum lengkap. Pastikan mengetik semuanya: def function beserta parameternya, return, lalu pemanggilan fungsi dengan 10 dan 5, dan terakhir diprint." };
              }
            }
          }
        ]
      }
    ]
  },
  6: {
    kicker: "Materi 04",
    title: "Modular Design in Python",
    duration: "Tonton Video Ini",
    videoId: "hP6MSkerx9A",
    startSeconds: 85,
    endSeconds: 723,
    bookmarks: [
      { time: 86, label: "Konsep Modular Design" },
      { time: 207, label: "Tanpa Modular Design" },
      { time: 311, label: "Dengan Modular Design" },
      { time: 407, label: "Manfaat Modular Design" },
      { time: 474, label: "Reusable Code" },
      { time: 552, label: "Memperbaiki Bug" }
    ],
    quizzes: [
      {
        time: 622,
        resume: false,
        questions: [
          {
            type: "custom",
            title: "Latihan Debugging 🕵️‍♂️",
            html: `
              <div style="text-align: left; font-family: 'Outfit', sans-serif;">
                <div style="display: inline-block; background-color: #ffe600; padding: 10px 24px; border-radius: 12px; border: 3px solid #1a1a1a; box-shadow: 4px 4px 0px #1a1a1a; margin-bottom: 24px; margin-top: 10px;">
                  <h3 style="margin: 0; font-size: 22px; font-weight: 800; color: #1a1a1a;">Latihan Debugging 🕵️‍♂️</h3>
                </div>
                
                <p style="font-weight: 800; font-size: 18px; color: #1a1a1a; margin-bottom: 16px;">Perbaiki langsung baris kode yang rusak di bawah ini!</p>
                
                <div class="code-block" style="background-color: #1a1a1a; padding: 24px; border-radius: 16px; font-family: 'Courier New', Courier, monospace; font-size: 16px; margin-bottom: 24px; border: 3px solid #ffe600; box-shadow: 4px 4px 0px #ffe600; color: #f8f8f2; line-height: 1.6; font-weight: bold; text-align: left;">
<span style="color: #ff79c6;">def</span> <span style="color: #8be9fd;">calculate_total</span>(<span style="color: #f1fa8c;">price</span>, <span style="color: #f1fa8c;">quantity</span>):<br>
&nbsp;&nbsp;&nbsp;&nbsp;<input id="tab6-inline-input" type="text" value="return harga + jumlah" spellcheck="false" style="background: rgba(255, 230, 0, 0.1); color: #f8f8f2; border: 1px dashed #ffe600; border-radius: 4px; padding: 4px 8px; outline: none; font-family: 'Courier New', Courier, monospace; font-size: 16px; width: 300px;"><br><br>
<span style="color: #ff79c6;">total</span> <span style="color: #ffb86c;">=</span> <span style="color: #8be9fd;">calculate_total</span>(<span style="color: #50fa7b;">10000</span>, <span style="color: #50fa7b;">3</span>)<br>
<span style="color: #8be9fd;">print</span>(<span style="color: #f8f8f2;">total</span>)
                </div>
                
                <p style="font-weight: 800; font-size: 18px; color: #1a1a1a; margin-bottom: 16px;">Output yang benar harusnya: 30000</p>
                
                <div>
                  <button onclick="window.checkTab6Guess(this)" style="background-color: #ffe600; color: #1a1a1a; font-weight: bold; padding: 12px 24px; border-radius: 8px; border: 2px solid #1a1a1a; cursor: pointer; font-family: 'Outfit', sans-serif; font-size: 16px; box-shadow: 3px 3px 0px #1a1a1a;">Cek Jawaban!</button>
                </div>
                <div class="feedback" style="display:none; margin-top:15px; padding:15px; border-radius:8px; border: 2px solid #1a1a1a; box-shadow: 3px 3px 0px #1a1a1a; font-weight:bold; font-family:'Outfit', sans-serif; font-size: 16px;"></div>
              </div>
            `
          }
        ]
      }
    ]
  },
  7: {
    kicker: "Checkpoint 05",
    title: "Checkpoint : Mini Project",
    duration: "Tugas Akhir",
    videoId: "hP6MSkerx9A",
    startSeconds: 626,
    endSeconds: 721,
    bookmarks: [
      { time: 626, label: "Instruksi Mini Project" },
      { time: 646, label: "Panduan Pengerjaan" }
    ],
    quizzes: []
  },
  8: {
    kicker: "Menabung, Bunga Tunggal, Bunga Majemuk",
    title: "Financial Literacy",
    duration: "Tonton Video Ini",
    videoId: "hP6MSkerx9A",
    startSeconds: 725,
    bookmarks: [
      { time: 725, label: "Pengenalan Menabung & Bunga" },
      { time: 815, label: "Bunga Tunggal" },
      { time: 898, label: "Bunga Tunggal di Python" },
      { time: 1280, label: "Simulasi Bunga Tunggal" },
      { time: 1398, label: "Pengenalan Bunga Majemuk" },
      { time: 1607, label: "Bunga Majemuk di Python" },
      { time: 1941, label: "Tunggal vs Majemuk" }
    ],
    quizzes: [
      {
        time: 1392,
        resume: false,
        questions: [
          {
            type: "custom",
            title: "Latihan: Lengkapi Function 🧩",
            html: `
              <div style="text-align: left; font-family: 'Outfit', sans-serif;">
                <div style="display: inline-block; background-color: #ffe600; padding: 10px 24px; border-radius: 12px; border: 3px solid #1a1a1a; box-shadow: 4px 4px 0px #1a1a1a; margin-bottom: 24px; margin-top: 10px;">
                  <h3 style="margin: 0; font-size: 22px; font-weight: 800; color: #1a1a1a;">Latihan: Lengkapi Function 🧩</h3>
                </div>
                
                <p style="font-weight: 800; font-size: 18px; color: #1a1a1a; margin-bottom: 16px;">Lengkapi kode berikut.</p>
                <p style="font-weight: 700; font-size: 16px; color: #e74c3c; margin-bottom: 16px; background-color: #fadbd8; padding: 10px; border-radius: 8px; border: 2px solid #e74c3c;">💡 <strong>Clue:</strong> Rumusnya ada di video! Silakan tonton kembali video untuk mencari rumus menghitung Bunga Tunggal.</p>
                
                <div class="code-block" style="background-color: #1a1a1a; padding: 24px; border-radius: 16px; font-family: 'Courier New', Courier, monospace; font-size: 16px; margin-bottom: 24px; border: 3px solid #ffe600; box-shadow: 4px 4px 0px #ffe600; color: #f8f8f2; line-height: 1.6; font-weight: bold; text-align: left;">
<span style="color: #ff79c6;">def</span> <span style="color: #8be9fd;">simple_interest</span>(<span style="color: #f1fa8c;">principal</span>, <span style="color: #f1fa8c;">rate</span>, <span style="color: #f1fa8c;">years</span>):<br>
&nbsp;&nbsp;&nbsp;&nbsp;<input id="tab8-input-1" type="text" placeholder="rumus..." spellcheck="false" style="background: rgba(255, 230, 0, 0.1); color: #f8f8f2; border: 1px dashed #ffe600; border-radius: 4px; padding: 4px 8px; outline: none; font-family: 'Courier New', Courier, monospace; font-size: 16px; width: 320px;"><br>
&nbsp;&nbsp;&nbsp;&nbsp;<input id="tab8-input-2" type="text" placeholder="____" spellcheck="false" style="background: rgba(255, 230, 0, 0.1); color: #f8f8f2; border: 1px dashed #ffe600; border-radius: 4px; padding: 4px 8px; outline: none; font-family: 'Courier New', Courier, monospace; font-size: 16px; width: 80px;"> interest<br><br>
<span style="color: #ff79c6;">result</span> <span style="color: #ffb86c;">=</span> <span style="color: #8be9fd;">simple_interest</span>(<span style="color: #50fa7b;">200000</span>, <span style="color: #50fa7b;">0.05</span>, <span style="color: #50fa7b;">2</span>)<br>
<span style="color: #8be9fd;">print</span>(<span style="color: #f8f8f2;">result</span>)
                </div>
                
                <div>
                  <button onclick="window.checkTab8Guess(this)" style="background-color: #ffe600; color: #1a1a1a; font-weight: bold; padding: 12px 24px; border-radius: 8px; border: 2px solid #1a1a1a; cursor: pointer; font-family: 'Outfit', sans-serif; font-size: 16px; box-shadow: 3px 3px 0px #1a1a1a;">Cek Jawaban!</button>
                </div>
                <div class="feedback" style="display:none; margin-top:15px; padding:15px; border-radius:8px; border: 2px solid #1a1a1a; box-shadow: 3px 3px 0px #1a1a1a; font-weight:bold; font-family:'Outfit', sans-serif; font-size: 16px;"></div>
              </div>
            `
          }
        ]
      },
      {
        time: 2052,
        resume: false,
        questions: [
          {
            type: "custom",
            title: "Latihan: Tebak Hasil Tahun Pertama 🧠",
            html: `
              <div style="text-align: left; font-family: 'Outfit', sans-serif;">
                <div style="display: inline-block; background-color: #ffe600; padding: 10px 24px; border-radius: 12px; border: 3px solid #1a1a1a; box-shadow: 4px 4px 0px #1a1a1a; margin-bottom: 24px; margin-top: 10px;">
                  <h3 style="margin: 0; font-size: 22px; font-weight: 800; color: #1a1a1a;">Latihan: Tebak Hasil Tahun Pertama 🧠</h3>
                </div>
                
                <p style="font-weight: 800; font-size: 18px; color: #1a1a1a; margin-bottom: 16px;">Perhatikan potongan kode berikut:</p>
                
                <div class="code-block" style="background-color: #1a1a1a; padding: 24px; border-radius: 16px; font-family: 'Courier New', Courier, monospace; font-size: 16px; margin-bottom: 24px; border: 3px solid #ffe600; box-shadow: 4px 4px 0px #ffe600; color: #f8f8f2; line-height: 1.6; font-weight: bold; text-align: left;">
<span style="color: #f8f8f2;">money</span> <span style="color: #ffb86c;">=</span> <span style="color: #50fa7b;">200000</span><br>
<span style="color: #f8f8f2;">rate</span> <span style="color: #ffb86c;">=</span> <span style="color: #50fa7b;">0.05</span><br><br>
<span style="color: #f8f8f2;">interest</span> <span style="color: #ffb86c;">=</span> <span style="color: #f8f8f2;">money</span> <span style="color: #ffb86c;">*</span> <span style="color: #f8f8f2;">rate</span><br>
<span style="color: #f8f8f2;">money</span> <span style="color: #ffb86c;">=</span> <span style="color: #f8f8f2;">money</span> <span style="color: #ffb86c;">+</span> <span style="color: #f8f8f2;">interest</span><br><br>
<span style="color: #8be9fd;">print</span>(<span style="color: #f8f8f2;">money</span>)
                </div>
                
                <div style="display: inline-block; background-color: #00bfff; padding: 8px 16px; border-radius: 8px; border: 3px solid #1a1a1a; box-shadow: 3px 3px 0px #1a1a1a; margin-bottom: 16px;">
                  <h4 style="margin: 0; font-size: 18px; font-weight: 800; color: #1a1a1a;">Berapakah nilai yang akan tercetak di layar?</h4>
                </div>
                
                <div style="display: flex; gap: 10px; align-items: stretch;">
                  <input id="tab8-quiz2-input" type="text" placeholder="Ketik angka hasil output..." style="flex: 1; padding: 12px; font-size: 16px; font-family: 'Outfit', sans-serif; border: 2px solid #1a1a1a; border-radius: 8px; outline: none;">
                  <button onclick="window.checkTab8Quiz2Guess(this)" style="background-color: #ffe600; color: #1a1a1a; font-weight: bold; padding: 0 24px; border-radius: 8px; border: 2px solid #1a1a1a; cursor: pointer; font-family: 'Outfit', sans-serif; font-size: 16px; box-shadow: 3px 3px 0px #1a1a1a;">Cek Jawaban</button>
                </div>
                <div class="feedback" style="display:none; margin-top:15px; padding:15px; border-radius:8px; border: 2px solid #1a1a1a; box-shadow: 3px 3px 0px #1a1a1a; font-weight:bold; font-family:'Outfit', sans-serif; font-size: 16px;"></div>
              </div>
            `
          }
        ]
      }
    ]
  }
};
