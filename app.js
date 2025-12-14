const tg = window.Telegram?.WebApp;

/* === Telegram init === */
if (tg) {
  tg.ready();
  tg.expand();

  document.body.style.background =
    tg.themeParams.bg_color || "#d4d0c8";
  document.body.style.overflow = "hidden";

  tg.MainButton.setText("Добавить расход");
  tg.MainButton.show();
}

/* === ШАГ 10: быстрый ввод расхода === */
const modal = document.getElementById("expense-modal");
const amountInput = document.getElementById("amount-input");
const typeInput = document.getElementById("type-input");
const saveBtn = document.getElementById("save-expense");

if (tg) {
  tg.MainButton.onClick(() => {
    modal.classList.remove("hidden");
  });
}

saveBtn.addEventListener("click", () => {
  const amount = Number(amountInput.value);
  if (!amount) return;

  const expense = {
    amount,
    type: typeInput.value,
    date: new Date().toISOString()
  };

  const expenses =
    JSON.parse(localStorage.getItem("expenses") || "[]");

  expenses.push(expense);
  localStorage.setItem("expenses", JSON.stringify(expenses));

  updateSummary();
  renderCalendar();

  modal.classList.add("hidden");
  amountInput.value = "";

  if (tg) tg.showAlert("Расход сохранён 💾");
});

/* === ШАГ 11: суммы === */
function updateSummary() {
  const expenses =
    JSON.parse(localStorage.getItem("expenses") || "[]");

  let daily = 0, main = 0, big = 0;

  expenses.forEach(e => {
    if (e.type === "daily") daily += e.amount;
    if (e.type === "main") main += e.amount;
    if (e.type === "big") big += e.amount;
  });

  document.getElementById("sum-daily").innerText = daily;
  document.getElementById("sum-main").innerText = main;
  document.getElementById("sum-big").innerText = big;
  document.getElementById("sum-total").innerText =
    daily + main + big;
}

/* === ШАГ 12–13: лимит + календарь === */
const limitInput = document.getElementById("daily-limit");
const saveLimitBtn = document.getElementById("save-limit");
const calendar = document.getElementById("calendar");

limitInput.value =
  localStorage.getItem("dailyLimit") || "";

saveLimitBtn.addEventListener("click", () => {
  localStorage.setItem("dailyLimit", limitInput.value);
  renderCalendar();
  if (tg) tg.showAlert("Дневной лимит сохранён 💾");
});

/* === Месяцы === */
let currentDate = new Date();

const monthTitle = document.getElementById("month-title");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");

const monthNames = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
];

prevBtn.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
};

nextBtn.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
};

/* === Рендер календаря === */
function renderCalendar() {
  calendar.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthTitle.innerText =
    monthNames[month] + " " + year;

  const expenses =
    JSON.parse(localStorage.getItem("expenses") || "[]");
  const limit = Number(limitInput.value);

  const daysInMonth =
    new Date(year, month + 1, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    dayDate.setHours(0, 0, 0, 0);

    const dayExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
      );
    });

    const sum = dayExpenses.reduce(
      (s, e) => s + e.amount,
      0
    );

    const div = document.createElement("div");
    div.className = "day";
    div.innerText = day;

    if (!isNaN(limit) && limit > 0 && dayDate <= today) {
      if (sum <= limit) div.classList.add("ok");
      else div.classList.add("bad");
    }

    calendar.appendChild(div);
  }
}

/* === старт === */
updateSummary();
renderCalendar();

/* === ШАГ 14: XP-графики === */

const barCanvas = document.getElementById("barChart");
const barCtx = barCanvas.getContext("2d");

const lineCanvas = document.getElementById("lineChart");
const lineCtx = lineCanvas.getContext("2d");

/* === Столбцы === */
function drawBarChart() {
  barCtx.clearRect(0, 0, 300, 160);

  const expenses =
    JSON.parse(localStorage.getItem("expenses") || "[]");

  let daily = 0, main = 0, big = 0;

  expenses.forEach(e => {
    if (e.type === "daily") daily += e.amount;
    if (e.type === "main") main += e.amount;
    if (e.type === "big") big += e.amount;
  });

  const values = [daily, main, big];
  const colors = ["#4caf50", "#2196f3", "#b71c1c"];
  const labels = ["Daily", "Main", "Big"];

  const max = Math.max(...values, 1);

  values.forEach((v, i) => {
    const h = (v / max) * 100;

    barCtx.fillStyle = colors[i];
    barCtx.fillRect(40 + i * 80, 130 - h, 40, h);

    barCtx.fillStyle = "#000";
    barCtx.fillText(labels[i], 40 + i * 80, 145);
  });
}

/* === Линия === */
function drawLineChart() {
  lineCtx.clearRect(0, 0, 300, 160);

  const expenses =
    JSON.parse(localStorage.getItem("expenses") || "[]");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days =
    new Date(year, month + 1, 0).getDate();

  const sums = Array(days).fill(0);

  expenses.forEach(e => {
    const d = new Date(e.date);
    if (
      d.getFullYear() === year &&
      d.getMonth() === month
    ) {
      sums[d.getDate() - 1] += e.amount;
    }
  });

  const max = Math.max(...sums, 1);

  lineCtx.strokeStyle = "#0066cc";
  lineCtx.beginPath();

  sums.forEach((v, i) => {
    const x = 10 + (i / days) * 280;
    const y = 140 - (v / max) * 100;

    if (i === 0) lineCtx.moveTo(x, y);
    else lineCtx.lineTo(x, y);
  });

  lineCtx.stroke();
}

/* === автообновление === */
function updateCharts() {
  drawBarChart();
  drawLineChart();
}

/* === хуки === */
const originalUpdateSummary = updateSummary;
updateSummary = function () {
  originalUpdateSummary();
  updateCharts();
};

updateCharts();
