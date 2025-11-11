// ============================================
// HABIT TRACKER CLI - CHALLENGE 3
// ============================================
// NAMA: Muhamad Faris Abrar
// KELAS: WPH Rep - 063
// TANGGAL: 11/11/25
// ============================================

// TODO: Import module yang diperlukan
// HINT: readline, fs, path
const readline = require("readline");
const fs = require("fs");
const path = require("path");

// TODO: Definisikan konstanta
// HINT: DATA_FILE, REMINDER_INTERVAL, DAYS_IN_WEEK
const DATA_FILE = path.join(__dirname, "habits-data.json");
const REMINDER_INTERVAL = 60000; // 1 menit
const DAYS_IN_WEEK = 7;

const startOfThisWeek = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Min
  const diffToMonday = (day + 6) % 7; // Senin = 0
  d.setDate(d.getDate() - diffToMonday);
  return d;
};

const fmtDate = (dtStr) => {
  const d = new Date(dtStr);
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const makeProgressBar = (percent, width = 10) => {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return `${"█".repeat(filled)}${"░".repeat(empty)} ${String(percent).padStart(
    3,
    " "
  )}%`;
};

// TODO: Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ============================================
// USER PROFILE OBJECT
// ============================================
// TODO: Buat object userProfile dengan properties:
// - name
// - joinDate
// - totalHabits
// - completedThisWeek
// TODO: Tambahkan method updateStats(habits)
// TODO: Tambahkan method getDaysJoined()
const userProfile = {
  name: "Guest",
  joinDate: new Date().toISOString(),
  totalHabits: 0,
  completedThisWeek: 0,

  updateStats(habits) {
    this.totalHabits = habits.length;
    this.completedThisWeek = habits
      .map((h) => h.getThisWeekCompletions())
      .reduce((a, b) => a + b, 0);
  },

  getDaysJoined() {
    const joined = new Date(this.joinDate);
    const now = new Date();
    const diffDays = Math.floor((now - joined) / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  },
};

// ============================================
// HABIT CLASS
// ============================================
// TODO: Buat class Habit dengan:
// - Constructor yang menerima name dan targetFrequency
// - Method markComplete()
// - Method getThisWeekCompletions()
// - Method isCompletedThisWeek()
// - Method getProgressPercentage()
// - Method getStatus()
class Habit {
  constructor(name, targetFrequency, category = "Umum") {
    this.id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.name = (name ?? "Kebiasaan Baru").trim(); // ?? #1
    this.targetFrequency = Number(targetFrequency ?? 7); // ?? #2
    this.completions = [];
    this.createdAt = new Date().toISOString();
    this.category = category ?? "Umum"; // ?? #3
  }

  markComplete(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const iso = d.toISOString();
    const already = this.completions.find(
      (c) => new Date(c).toDateString() === d.toDateString()
    ); // find()
    if (!already) this.completions.push(iso);
  }

  getThisWeekCompletions() {
    const start = startOfThisWeek();
    return this.completions.filter((c) => new Date(c) >= start).length; // filter()
  }

  isCompletedThisWeek() {
    return this.getThisWeekCompletions() >= this.targetFrequency;
  }

  getProgressPercentage() {
    const done = this.getThisWeekCompletions();
    return Math.min(100, Math.round((done / this.targetFrequency) * 100));
  }

  getStatus() {
    return this.isCompletedThisWeek() ? "Selesai" : "Aktif";
  }
}

// ============================================
// HABIT TRACKER CLASS
// ============================================
// TODO: Buat class HabitTracker dengan:
// - Constructor
// - Method addHabit(name, frequency)
// - Method completeHabit(habitIndex)
// - Method deleteHabit(habitIndex)
// - Method displayProfile()
// - Method displayHabits(filter)
// - Method displayHabitsWithWhile()
// - Method displayHabitsWithFor()
// - Method displayStats()
// - Method startReminder()
// - Method showReminder()
// - Method stopReminder()
// - Method saveToFile()
// - Method loadFromFile()
// - Method clearAllData()
class HabitTracker {
  constructor() {
    this.habits = [];
    this.profile = userProfile;
    this._reminderTimer = null;

    this.loadFromFile();
    this.profile.updateStats(this.habits);
  }

  addHabit(name, frequency, category) {
    const freq = Number(frequency ?? 7);
    const habit = new Habit(name ?? "Kebiasaan Baru", freq, category ?? "Umum");
    this.habits.push(habit);
    this.profile.updateStats(this.habits);
    this.saveToFile();
  }

  completeHabit(habitIndex) {
    const habit = this.habits[habitIndex - 1] ?? null; // ?? #4
    if (!habit) throw new Error("Index habit tidak valid.");
    habit.markComplete();
    this.profile.updateStats(this.habits);
    this.saveToFile();
  }

  deleteHabit(habitIndex) {
    const habit = this.habits[habitIndex - 1] ?? null; // ?? #5
    if (!habit) throw new Error("Index habit tidak valid.");
    this.habits.splice(habitIndex - 1, 1);
    this.profile.updateStats(this.habits);
    this.saveToFile();
  }

  displayProfile() {
    const lines = [];
    lines.push("==================================================");
    lines.push("PROFIL");
    lines.push("==================================================");
    lines.push(`Nama             : ${this.profile.name}`);
    lines.push(`Bergabung sejak  : ${fmtDate(this.profile.joinDate)}`);
    lines.push(`Hari bergabung   : ${this.profile.getDaysJoined()} hari`);
    lines.push(`Total habits     : ${this.profile.totalHabits}`);
    const active = this.habits.filter((h) => !h.isCompletedThisWeek()).length;
    const done = this.habits.filter((h) => h.isCompletedThisWeek()).length;
    lines.push(`Selesai minggu ini: ${this.profile.completedThisWeek} kali`);
    lines.push(`Aktif: ${active} | Selesai: ${done}`);
    lines.push("==================================================");
    console.log(lines.join("\n"));
  }

  displayHabits(filter = "all") {
    const header =
      {
        all: "SEMUA KEBIASAAN",
        active: "KEBIASAAN AKTIF",
        done: "KEBIASAAN SELESAI",
      }[filter] ?? "SEMUA KEBIASAAN";

    console.log("==================================================");
    console.log(header);
    console.log("==================================================");

    let list = this.habits;
    if (filter === "active")
      list = list.filter((h) => !h.isCompletedThisWeek());
    if (filter === "done") list = list.filter((h) => h.isCompletedThisWeek());

    if (list.length === 0) {
      console.log("(Belum ada data)");
    } else {
      list.forEach((h, i) => {
        const pct = h.getProgressPercentage();
        console.log(`${i + 1}. [${h.getStatus()}] ${h.name}`);
        console.log(`   Kategori: ${h.category}`);
        console.log(`   Target  : ${h.targetFrequency}x/minggu`);
        console.log(
          `   Progress: ${h.getThisWeekCompletions()}/${
            h.targetFrequency
          } (${pct}%)`
        );
        console.log(`   Bar     : ${makeProgressBar(pct, 10)}`);
        console.log("");
      });
    }
    console.log("==================================================");
  }

  displayHabitsWithWhile() {
    console.log("--- Demo While Loop ---");
    let i = 0;
    while (i < this.habits.length) {
      console.log(`${i + 1}. ${this.habits[i].name}`);
      i++;
    }
  }

  displayHabitsWithFor() {
    console.log("--- Demo For Loop ---");
    for (let i = 0; i < this.habits.length; i++) {
      console.log(`${i + 1}. ${this.habits[i].name}`);
    }
  }

  displayStats() {
    console.log("==================================================");
    console.log("STATISTIK");
    console.log("==================================================");

    const total = this.habits.length;
    const active = this.habits.filter((h) => !h.isCompletedThisWeek()).length;
    const done = total - active;

    console.log(`Total kebiasaan : ${total}`);
    console.log(`Aktif           : ${active}`);
    console.log(`Selesai         : ${done}`);

    const top = this.habits
      .map((h) => ({ name: h.name, total: h.completions.length }))
      .sort((a, b) => b.total - a.total)[0];

    if (top) console.log(`Paling rajin    : ${top.name} (${top.total}x total)`);

    const avgPct = total
      ? Math.round(
          this.habits
            .map((h) => h.getProgressPercentage())
            .reduce((a, b) => a + b, 0) / total
        )
      : 0;

    console.log(`Rata2 progres   : ${avgPct}%`);
    console.log("==================================================");
  }

  startReminder() {
    if (this._reminderTimer) return;
    this._reminderTimer = setInterval(
      () => this.showReminder(),
      REMINDER_INTERVAL
    ); // setInterval
  }

  showReminder() {
    const target = this.habits.find((h) => !h.isCompletedThisWeek()); // find()
    if (target) {
      console.log("==================================================");
      console.log(`REMINDER: Jangan lupa "${target.name}"!`);
      console.log("==================================================");
    }
  }

  stopReminder() {
    if (this._reminderTimer) clearInterval(this._reminderTimer);
    this._reminderTimer = null;
  }

  saveToFile() {
    const data = {
      profile: {
        name: this.profile.name,
        joinDate: this.profile.joinDate,
      },
      habits: this.habits.map((h) => ({
        id: h.id,
        name: h.name,
        targetFrequency: h.targetFrequency,
        completions: h.completions,
        createdAt: h.createdAt,
        category: h.category,
      })),
    };
    const json = JSON.stringify(data, null, 2); // JSON.stringify
    fs.writeFileSync(DATA_FILE, json);
  }

  loadFromFile() {
    if (!fs.existsSync(DATA_FILE)) return;
    try {
      const json = fs.readFileSync(DATA_FILE, "utf8");
      const data = JSON.parse(json); // JSON.parse

      const p = data.profile ?? {}; // ?? #6
      this.profile.name = p.name ?? "Guest";
      this.profile.joinDate = p.joinDate ?? new Date().toISOString();

      this.habits = (data.habits ?? []).map((obj) => {
        const h = new Habit(
          obj.name ?? "Kebiasaan",
          obj.targetFrequency ?? 7,
          obj.category ?? "Umum"
        );
        h.id = obj.id ?? h.id;
        h.completions = Array.isArray(obj.completions) ? obj.completions : [];
        h.createdAt = obj.createdAt ?? new Date().toISOString();
        return h;
      });
    } catch (e) {
      console.error("Gagal memuat data, membuat data baru.", e.message);
      this.habits = [];
      this.profile.name = "Guest";
      this.profile.joinDate = new Date().toISOString();
    }
  }

  clearAllData() {
    this.habits = [];
    this.profile.name = "Guest";
    this.profile.joinDate = new Date().toISOString();
    this.profile.updateStats(this.habits);
    this.saveToFile();
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
// TODO: Buat function askQuestion(question)
const askQuestion = (question) =>
  new Promise((resolve) => rl.question(question, (answer) => resolve(answer)));

// TODO: Buat function displayMenu()
function displayMenu() {
  console.log("==================================================");
  console.log("HABIT TRACKER - MAIN MENU");
  console.log("==================================================");
  console.log("1. Lihat Profil");
  console.log("2. Lihat Semua Kebiasaan");
  console.log("3. Lihat Kebiasaan Aktif");
  console.log("4. Lihat Kebiasaan Selesai");
  console.log("5. Tambah Kebiasaan Baru");
  console.log("6. Tandai Kebiasaan Selesai");
  console.log("7. Hapus Kebiasaan");
  console.log("8. Lihat Statistik");
  console.log("9. Demo Loop (while/for)");
  console.log("0. Keluar");
  console.log("==================================================");
}

// TODO: Buat async function handleMenu(tracker)
async function handleMenu(tracker) {
  tracker.startReminder();

  let running = true;
  while (running) {
    // while utama
    displayMenu();
    const choice = (await askQuestion("Pilih menu (0-9): ")).trim();

    try {
      switch (choice) {
        case "1":
          tracker.profile.updateStats(tracker.habits);
          tracker.displayProfile();
          break;
        case "2":
          tracker.displayHabits("all");
          break;
        case "3":
          tracker.displayHabits("active");
          break;
        case "4":
          tracker.displayHabits("done");
          break;
        case "5": {
          const name = (await askQuestion("Nama kebiasaan: ")).trim();
          const freqStr = (
            await askQuestion("Target per minggu (1-7): ")
          ).trim();
          const category = (await askQuestion("Kategori (opsional): ")).trim();
          const freq = Math.min(
            DAYS_IN_WEEK,
            Math.max(1, Number(freqStr) || 7)
          );
          tracker.addHabit(name || "Kebiasaan Baru", freq, category || "Umum");
          console.log("Berhasil menambah kebiasaan.");
          break;
        }
        case "6": {
          if (tracker.habits.length === 0) {
            console.log("Belum ada kebiasaan.");
            break;
          }
          tracker.displayHabits("active");
          const idxStr = (
            await askQuestion("Nomor kebiasaan yang selesai hari ini: ")
          ).trim();
          const idx = Number(idxStr);
          tracker.completeHabit(idx);
          console.log("Mantap! Dicatat sebagai selesai untuk hari ini.");
          break;
        }
        case "7": {
          if (tracker.habits.length === 0) {
            console.log("Belum ada kebiasaan.");
            break;
          }
          tracker.displayHabits("all");
          const idxStr = (
            await askQuestion("Nomor kebiasaan yang akan dihapus: ")
          ).trim();
          const idx = Number(idxStr);
          tracker.deleteHabit(idx);
          console.log("Kebiasaan dihapus.");
          break;
        }
        case "8":
          tracker.displayStats();
          break;
        case "9":
          tracker.displayHabitsWithWhile();
          tracker.displayHabitsWithFor();
          break;
        case "0":
          running = false;
          break;
        default:
          console.log("Pilihan tidak dikenal. Coba lagi.");
      }
    } catch (err) {
      console.log("Error:", err.message);
    }

    if (running) {
      await askQuestion("\nTekan ENTER untuk kembali ke menu...");
      console.clear?.();
    }
  }

  tracker.stopReminder();
  tracker.saveToFile();
  rl.close();
  console.log("Sampai jumpa!");
}

// ============================================
// MAIN FUNCTION
// ============================================
// TODO: Buat async function main()
async function main() {
  console.log("==================================================");
  console.log("HABIT TRACKER CLI");
  console.log("==================================================");

  const tracker = new HabitTracker();

  // Data demo opsional bila belum ada data
  if (tracker.habits.length === 0) {
    tracker.addHabit("Minum Air 8 Gelas", 7, "Kesehatan");
    tracker.addHabit("Baca Buku 30 Menit", 5, "Belajar");
  }

  await handleMenu(tracker);
}

// TODO: Jalankan main() dengan error handling
main().catch((e) => {
  console.error("Aplikasi gagal dijalankan:", e);
  process.exit(1);
});
