const tg = window.Telegram?.WebApp;

/* === Telegram init === */
if (tg) {
  tg.ready();
  tg.expand();

  document.body.style.background =
    tg.themeParams.bg_color || "#d4d0c8";
  document.body.style.overflow = "hidden";

  tg.MainButton.setText("Добавить");
  tg.MainButton.show();
}

/* === МОДАЛКА === */
const modal = document.getElementById("expense-modal");
const amountInput = document.getElementById("amount-input");
const typeInput = document.getElementById("type-input");
const flowInput = document.getElementById("flow-input");
const saveBtn = document.getElementById("save-expense");

if (tg) {
  tg.MainButton.onClick(() => {
    modal.classList.remove("hidden");
  });
}

/* === СОХРАНЕНИЕ ОПЕРАЦИИ === */
saveBtn.addEventListener("click", () => {
  const amount = Number(amountInput.value);
  if (!amount) return;

  const operation = {
    amount,
    type: typeInput.value,
    flow: flowInput.value, // in | out
    date: new Date().toISOString()
  };

  const data =
    JSON.parse(localStorage.getItem("expenses") || "[]");

  data.push(operation);
  localStorage.setItem("expenses", JSON.stringify(data));

  amountInput.value = "";
  modal.classList.add("hidden");

  updateSummary();
  renderCalendar();

  if (tg) tg.showAlert("Сохранено 💾");
});

/* === СУММЫ + БАЛАНС === */
function updateSummary() {
  const data =
    JSON.parse(localStorage.getItem("expenses") || "[]");

  let daily = 0;
  let main = 0;
  let big = 0;
  let income = 0;

  data.forEach(e => {
    if (e.flow === "in") {
      income += e.amount;
    } else {
      if (e.type === "daily") daily += e.amount;
      if (e.type === "main") main += e.amount;
      if (e.type === "big") big += e.amount;
    }
  });

  const totalOut = daily + main + big;
  const balance = income - totalOut;

  document.getElementById("sum-daily").innerText = daily;
  document.getElementById("sum-main").innerText = main;
  document.getElementById("sum-big").innerText = big;
  document.getElementById("sum-income").innerText = income;
  document.getElementById("sum-total").innerText = totalOut;
  document.getElementById("sum-balance").innerText = balance;
}

/* === ЛИМИТ + КАЛЕНДАРЬ === */
const limitInput = document.getElementById("daily-limit");
const saveLimitBtn = document.getElementById("save-limit");
const calendar = document.getElementById("calendar");

limitInput.value =
  localStorage.getItem("dailyLimit") || "";

saveLimitBtn?.addEventListener("click", () => {
  localStorage.setItem("dailyLimit", limitInput.value);
  renderCalendar();
  if (tg) tg.showAlert("Лимит сохранён");
});

/* === МЕСЯЦЫ === */
let currentDate = new Date();

const monthTitle = document.getElementById("month-title");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");

const monthNames = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
];

prevBtn?.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

nextBtn?.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

/* === РЕНДЕР КАЛЕНДАРЯ === */
function renderCalendar() {
  calendar.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  if (monthTitle) {
    monthTitle.innerText =
      monthNames[month] + " " + year;
  }

  const data =
    JSON.parse(localStorage.getItem("expenses") || "[]");

  const limit = Number(limitInput.value);

  const daysInMonth =
    new Date(year, month + 1, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    dayDate.setHours(0, 0, 0, 0);

    const dayExpenses = data.filter(e => {
      const d = new Date(e.date);
      return (
        e.flow === "out" &&
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
      );
    });

    const sum = dayExpenses.reduce(
      (s, e) => s + e.amount, 0
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

/* === СТАРТ === */
updateSummary();
renderCalendar();

/* === ГРАФИКИ (XP STYLE) === */

const barCanvas = document.getElementById("barChart");
const lineCanvas = document.getElementById("lineChart");

const barCtx = barCanvas?.getContext("2d");
const lineCtx = lineCanvas?.getContext("2d");

/* === СТОЛБЦЫ: типы расходов === */
function drawBarChart() {
  if (!barCtx) return;

  barCtx.clearRect(0, 0, 300, 160);

  const data =
    JSON.parse(localStorage.getItem("expenses") || "[]");

  let daily = 0, main = 0, big = 0;

  data.forEach(e => {
    if (e.flow === "out") {
      if (e.type === "daily") daily += e.amount;
      if (e.type === "main") main += e.amount;
      if (e.type === "big") big += e.amount;
    }
  });

  const values = [daily, main, big];
  const labels = ["Повседн.", "Основные", "Крупные"];
  const colors = ["#6aa84f", "#6fa8dc", "#e06666"];
  const max = Math.max(...values, 1);

  values.forEach((v, i) => {
    const h = (v / max) * 100;

    barCtx.fillStyle = colors[i];
    barCtx.fillRect(40 + i * 80, 130 - h, 40, h);

    barCtx.fillStyle = "#000";
    barCtx.font = "11px Tahoma";
    barCtx.fillText(labels[i], 32 + i * 80, 145);
  });
}

/* === ЛИНИЯ: траты по дням === */
function drawLineChart() {
  if (!lineCtx) return;

  lineCtx.clearRect(0, 0, 300, 160);

  const data =
    JSON.parse(localStorage.getItem("expenses") || "[]");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days =
    new Date(year, month + 1, 0).getDate();

  const sums = Array(days).fill(0);

  data.forEach(e => {
    if (e.flow === "out") {
      const d = new Date(e.date);
      if (
        d.getFullYear() === year &&
        d.getMonth() === month
      ) {
        sums[d.getDate() - 1] += e.amount;
      }
    }
  });

  const max = Math.max(...sums, 1);

  lineCtx.strokeStyle = "#3c78d8";
  lineCtx.lineWidth = 2;
  lineCtx.beginPath();

  sums.forEach((v, i) => {
    const x = 10 + (i / (days - 1)) * 280;
    const y = 140 - (v / max) * 100;

    if (i === 0) lineCtx.moveTo(x, y);
    else lineCtx.lineTo(x, y);
  });

  lineCtx.stroke();
}

/* === ОБНОВЛЕНИЕ === */
function updateCharts() {
  drawBarChart();
  drawLineChart();
}

/* === ПОДКЛЮЧАЕМ К ОБНОВЛЕНИЯМ === */
const originalUpdateSummary = updateSummary;
updateSummary = function () {
  originalUpdateSummary();
  updateCharts();
};

/* первый рендер */
updateCharts();
