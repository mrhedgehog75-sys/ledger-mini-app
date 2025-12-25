const tg = window.Telegram?.WebApp;

/* === Telegram init (без MainButton) === */
if (tg) {
  tg.ready();
  tg.expand();
  document.body.style.background = tg.themeParams.bg_color || "#d4d0c8";
  document.body.style.overflow = "hidden";
}

/* === ЭЛЕМЕНТЫ === */
const modal = document.getElementById("expense-modal");
const amountInput = document.getElementById("amount-input");
const typeInput = document.getElementById("type-input");
const flowInput = document.getElementById("flow-input");
const saveBtn = document.getElementById("save-expense");
const closeBtn = document.getElementById("close-modal");
const plusBtn = document.querySelector(".plus-btn");

const goalSelect = document.getElementById("goal-select");

const limitInput = document.getElementById("daily-limit");
const saveLimitBtn = document.getElementById("save-limit");
const calendar = document.getElementById("calendar");
const monthTitle = document.getElementById("month-title");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");
const currentDateLabel = document.getElementById("current-date-label");

const operationsList = document.getElementById("operations-list");
const selectedDayLabel = document.getElementById("selected-day-label");

const reportText = document.getElementById("report-text");

/* === ЭЛЕМЕНТЫ ЦЕЛЕЙ === */
const goalsList = document.getElementById("goals-list");
const goalNameInput = document.getElementById("goal-name");
const goalTargetInput = document.getElementById("goal-target");
const goalCurrentInput = document.getElementById("goal-current");
const goalNoteInput = document.getElementById("goal-note");
const addGoalBtn = document.getElementById("add-goal");

/* === ДАТА === */
let currentDate = new Date();
if (currentDateLabel) {
  currentDateLabel.textContent = new Date().toLocaleDateString("ru-RU");
}

// выбранный день для таблицы (по умолчанию сегодня)
let selectedDay = new Date();
selectedDay.setHours(0, 0, 0, 0);

// период для отчётов и графиков: "week" | "month" | "year"
let currentPeriod = "month";

/* === ОТКРЫТИЕ / ЗАКРЫТИЕ МОДАЛКИ === */

// кнопка + в нижней панели
if (plusBtn) {
  plusBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });
}

// закрытие по крестику
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
}

// клик по фону
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.add("hidden");
});

/* === СОХРАНЕНИЕ ОПЕРАЦИИ === */
saveBtn.addEventListener("click", () => {
  const amount = Number(amountInput.value);
  if (!amount) return;

  const operation = {
    amount,
    type: typeInput.value, // daily | main | big
    flow: flowInput.value, // in | out
    date: new Date().toISOString(),
  };

  // сохраняем операцию в expenses
  const data = JSON.parse(localStorage.getItem("expenses") || "[]");
  data.push(operation);
  localStorage.setItem("expenses", JSON.stringify(data));

  // если выбрана цель — обновляем её прогресс
  if (goalSelect && goalSelect.value !== "") {
    const goalIndex = Number(goalSelect.value);
    const goals = loadGoals();
    if (goals[goalIndex]) {
      goals[goalIndex].current =
        Number(goals[goalIndex].current || 0) + amount;
      saveGoals(goals);
      renderGoals();
    }
  }

  amountInput.value = "";
  if (goalSelect) goalSelect.value = "";
  modal.classList.add("hidden");

  updateSummary();
  renderCalendar();
  updateCharts();
  renderOperationsForSelectedDay();
});

/* === СУММЫ === */
function updateSummary() {
  const data = JSON.parse(localStorage.getItem("expenses") || "[]");

  let daily = 0,
    main = 0,
    big = 0,
    income = 0;

  data.forEach((e) => {
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

  document.getElementById("sum-daily").innerText = daily.toFixed(0);
  document.getElementById("sum-main").innerText = main.toFixed(0);
  document.getElementById("sum-big").innerText = big.toFixed(0);
  document.getElementById("sum-income").innerText = income.toFixed(0);
  document.getElementById("sum-total").innerText = totalOut.toFixed(0);
  document.getElementById("sum-balance").innerText = balance.toFixed(0);
}

/* === ТАБЛИЦА ОПЕРАЦИЙ ЗА ВЫБРАННЫЙ ДЕНЬ === */

function renderOperationsForSelectedDay() {
  if (!operationsList) return;

  const data = JSON.parse(localStorage.getItem("expenses") || "[]");
  const y = selectedDay.getFullYear();
  const m = selectedDay.getMonth();
  const dNum = selectedDay.getDate();

  const dayOps = data.filter((e) => {
    const d = new Date(e.date);
    return (
      d.getFullYear() === y &&
      d.getMonth() === m &&
      d.getDate() === dNum
    );
  });

  operationsList.innerHTML = "";

  if (selectedDayLabel) {
    selectedDayLabel.textContent = selectedDay.toLocaleDateString("ru-RU");
  }

  if (!dayOps.length) {
    const empty = document.createElement("div");
    empty.className = "operation-row";
    empty.textContent = "За этот день пока нет операций";
    operationsList.appendChild(empty);
    return;
  }

  dayOps.forEach((op) => {
    const row = document.createElement("div");
    row.className = "operation-row";

    const main = document.createElement("div");
    main.className = "operation-main";

    const amount = document.createElement("div");
    amount.className = "operation-amount";
    const sign = op.flow === "out" ? "-" : "+";
    amount.textContent = `${sign} ${op.amount}`;

    const meta = document.createElement("div");
    meta.className = "operation-meta";
    const typeMap = {
      daily: "Повседневное",
      main: "Основное",
      big: "Крупное",
    };
    const typeName = typeMap[op.type] || "Другое";
    meta.textContent = `${typeName}, ${op.flow === "out" ? "расход" : "доход"}`;

    main.appendChild(amount);
    main.appendChild(meta);

    row.appendChild(main);
    operationsList.appendChild(row);
  });
}

/* === ЛИМИТ + КАЛЕНДАРЬ === */

limitInput.value = localStorage.getItem("dailyLimit") || "";

saveLimitBtn?.addEventListener("click", () => {
  localStorage.setItem("dailyLimit", limitInput.value);
  renderCalendar();
});

const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

prevBtn.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
  updateCharts();
};

nextBtn.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
  updateCharts();
};

function renderCalendar() {
  if (!calendar) return;

  calendar.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  monthTitle.innerText = monthNames[month] + " " + year;

  const data = JSON.parse(localStorage.getItem("expenses") || "[]");
  const limit = Number(limitInput.value);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);

    const sum = data
      .filter((e) => {
        const d = new Date(e.date);
        return (
          e.flow === "out" &&
          d.getFullYear() === year &&
          d.getMonth() === month &&
          d.getDate() === day
        );
      })
      .reduce((s, e) => s + e.amount, 0);

    const div = document.createElement("div");
    div.className = "day";
    div.innerText = day;

    if (limit && date <= today) {
      div.classList.add(sum <= limit ? "ok" : "bad");
    }

    // клик по дню: выбираем день и показываем таблицу
    div.addEventListener("click", () => {
      selectedDay = new Date(year, month, day);
      selectedDay.setHours(0, 0, 0, 0);
      renderOperationsForSelectedDay();
      showTab("tables");
    });

    calendar.appendChild(div);
  }
}

/* === ЦЕЛИ (localStorage: "goals") === */

function loadGoals() {
  return JSON.parse(localStorage.getItem("goals") || "[]");
}

function saveGoals(goals) {
  localStorage.setItem("goals", JSON.stringify(goals));
}

function updateGoalSelect(goals) {
  if (!goalSelect) return;
  goalSelect.innerHTML = "";
  const emptyOpt = document.createElement("option");
  emptyOpt.value = "";
  emptyOpt.textContent = "Без цели";
  goalSelect.appendChild(emptyOpt);

  goals.forEach((g, index) => {
    const opt = document.createElement("option");
    opt.value = String(index);
    opt.textContent = g.name || `Цель ${index + 1}`;
    goalSelect.appendChild(opt);
  });
}

function renderGoals() {
  if (!goalsList) return;
  const goals = loadGoals();
  goalsList.innerHTML = "";

  goals.forEach((g) => {
    const card = document.createElement("div");
    card.className = "goal-card";

    const header = document.createElement("div");
    header.className = "goal-header";

    const nameSpan = document.createElement("span");
    nameSpan.className = "goal-name";
    nameSpan.textContent = g.name || "Цель";

    const percent =
      g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;

    const percentSpan = document.createElement("span");
    percentSpan.textContent = percent + "%";

    header.appendChild(nameSpan);
    header.appendChild(percentSpan);

    const amounts = document.createElement("div");
    amounts.className = "goal-amounts";
    amounts.textContent = `Накоплено ${g.current} из ${g.target}`;

    const progress = document.createElement("div");
    progress.className = "goal-progress";

    const inner = document.createElement("div");
    inner.className = "goal-progress-inner";
    inner.style.width = percent + "%";
    progress.appendChild(inner);

    const note = document.createElement("div");
    note.className = "goal-note";
    note.textContent = g.note || "";

    card.appendChild(header);
    card.appendChild(amounts);
    card.appendChild(progress);
    if (g.note) card.appendChild(note);

    goalsList.appendChild(card);
  });

  updateGoalSelect(goals);
}

if (addGoalBtn) {
  addGoalBtn.addEventListener("click", () => {
    const name = (goalNameInput.value || "").trim();
    const target = Number(goalTargetInput.value) || 0;
    const current = Number(goalCurrentInput.value) || 0;
    const note = (goalNoteInput.value || "").trim();

    if (!name || !target) return;

    const goals = loadGoals();
    goals.push({ name, target, current, note });
    saveGoals(goals);
    updateGoalSelect(goals);
    renderGoals();

    goalNameInput.value = "";
    goalTargetInput.value = "";
    goalCurrentInput.value = "";
    goalNoteInput.value = "";
  });
}

/* === ВКЛАДКИ (нижняя панель) === */

window.showTab = function (id) {
  document.querySelectorAll(".tab-content").forEach((t) => {
    t.classList.add("hidden");
  });
  const el = document.getElementById("tab-" + id);
  if (el) el.classList.remove("hidden");

  if (id === "charts") {
    setTimeout(updateCharts, 50);
  }
};

/* === ВСПОМОГАТЕЛЬНОЕ ДЛЯ ПЕРИОДОВ === */

function getPeriodFilter(period) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "week") {
    const day = start.getDay(); // 0-6
    const diff = day === 0 ? 6 : day - 1; // понедельник
    start.setDate(start.getDate() - diff);
  } else if (period === "month") {
    start.setDate(1);
  } else if (period === "year") {
    start.setMonth(0, 1);
  }

  return { start, end: now };
}

/* === ГРАФИКИ === */

const barCtx = document.getElementById("barChart")?.getContext("2d");
const lineCtx = document.getElementById("lineChart")?.getContext("2d");

function drawBarChart() {
  if (!barCtx) return;

  barCtx.clearRect(0, 0, 320, 160);

  const data = JSON.parse(localStorage.getItem("expenses") || "[]");
  const { start, end } = getPeriodFilter(currentPeriod);

  let d = 0,
    m = 0,
    b = 0;

  data.forEach((e) => {
    const t = new Date(e.date);
    if (e.flow === "out" && t >= start && t <= end) {
      if (e.type === "daily") d += e.amount;
      if (e.type === "main") m += e.amount;
      if (e.type === "big") b += e.amount;
    }
  });

  const vals = [d, m, b];
  const max = Math.max(...vals, 1);
  const colors = ["#34c759", "#3478f6", "#ff9f0a"];

  vals.forEach((v, i) => {
    const h = (v / max) * 100;
    barCtx.fillStyle = colors[i];
    barCtx.fillRect(40 + i * 80, 130 - h, 40, h);
  });
}

function drawLineChart() {
  if (!lineCtx) return;

  lineCtx.clearRect(0, 0, 320, 160);

  const data = JSON.parse(localStorage.getItem("expenses") || "[]");
  const { start, end } = getPeriodFilter(currentPeriod);

  let points = [];
  if (currentPeriod === "week") {
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      points.push(d);
    }
  } else if (currentPeriod === "month") {
    const days = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      points.push(d);
    }
  } else if (currentPeriod === "year") {
    for (let i = 0; i < 12; i++) {
      const d = new Date(start.getFullYear(), i, 1);
      points.push(d);
    }
  }

  const sums = Array(points.length).fill(0);

  data.forEach((e) => {
    if (e.flow !== "out") return;
    const t = new Date(e.date);
    if (t < start || t > end) return;

    if (currentPeriod === "year") {
      const idx = t.getMonth();
      sums[idx] += e.amount;
    } else {
      const idx = Math.floor((t - start) / (24 * 60 * 60 * 1000));
      if (idx >= 0 && idx < sums.length) sums[idx] += e.amount;
    }
  });

  const max = Math.max(...sums, 1);

  lineCtx.strokeStyle = "#3478f6";
  lineCtx.beginPath();

  sums.forEach((v, i) => {
    const x = 10 + (i / Math.max(sums.length - 1, 1)) * 280;
    const yPix = 140 - (v / max) * 100;
    if (i === 0) lineCtx.moveTo(x, yPix);
    else lineCtx.lineTo(x, yPix);
  });

  lineCtx.stroke();
}

/* === ТЕКСТОВЫЙ ОТЧЁТ === */

function updateReport() {
  if (!reportText) return;

  const data = JSON.parse(localStorage.getItem("expenses") || "[]");
  const { start, end } = getPeriodFilter(currentPeriod);

  let income = 0;
  let out = 0;
  let daily = 0,
    main = 0,
    big = 0;

  data.forEach((e) => {
    const t = new Date(e.date);
    if (t < start || t > end) return;

    if (e.flow === "in") {
      income += e.amount;
    } else if (e.flow === "out") {
      out += e.amount;
      if (e.type === "daily") daily += e.amount;
      if (e.type === "main") main += e.amount;
      if (e.type === "big") big += e.amount;
    }
  });

  const balance = income - out;
  const periodName =
    currentPeriod === "week"
      ? "за неделю"
      : currentPeriod === "month"
        ? "за месяц"
        : "за год";

  let topCat = "повседневные расходы";
  let topVal = daily;
  if (main >= topVal) {
    topCat = "основные обязательства";
    topVal = main;
  }
  if (big >= topVal) {
    topCat = "крупные траты";
    topVal = big;
  }

  const mood =
    balance > 0
      ? "Ты живёшь ниже доходов — это очень здорово."
      : balance > -0.1 * (income || 1)
        ? "Баланс около нуля — можно чуть поджать расходы."
        : "Расходы сильно превышают доходы — стоит пересмотреть повседневные траты.";

  reportText.textContent =
    `Итог ${periodName}: доходы ${income.toFixed(
      0
    )}, расходы ${out.toFixed(0)}, баланс ${balance.toFixed(
      0
    )}. Больше всего уходит на ${topCat}. ` + mood;
}

/* === ПЕРЕКЛЮЧАТЕЛЬ ПЕРИОДА === */

document.querySelectorAll(".period-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const period = btn.getAttribute("data-period");
    if (!period) return;
    currentPeriod = period;

    document.querySelectorAll(".period-btn").forEach((b) =>
      b.classList.remove("active-period")
    );
    btn.classList.add("active-period");

    updateCharts();
  });
});

/* === ОБНОВЛЕНИЕ ГРАФИКОВ + ОТЧЁТ === */

function updateCharts() {
  drawBarChart();
  drawLineChart();
  updateReport();
}

/* === СТАРТ === */
updateSummary();
renderCalendar();
updateCharts();
renderGoals();
renderOperationsForSelectedDay();

// по умолчанию открываем календарь
showTab("calendar");
