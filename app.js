const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();

  document.body.style.background =
    tg.themeParams.bg_color || "#d4d0c8";
  document.body.style.overflow = "hidden";

  tg.MainButton.setText("Добавить расход");
  tg.MainButton.show();


}
// === ШАГ 10: быстрый ввод расхода ===
const modal = document.getElementById("expense-modal");
const amountInput = document.getElementById("amount-input");
const typeInput = document.getElementById("type-input");
const saveBtn = document.getElementById("save-expense");

// Открытие окна по Telegram-кнопке
if (tg) {
  tg.MainButton.onClick(() => {
    modal.classList.remove("hidden");
  });
}

// Сохранение расхода
saveBtn.addEventListener("click", () => {
  const amount = amountInput.value;
  const type = typeInput.value;

  if (!amount) return;

  const expense = {
    amount: Number(amount),
    type,
    date: new Date().toISOString()
  };

  const expenses =
    JSON.parse(localStorage.getItem("expenses") || "[]");

  expenses.push(expense);
  localStorage.setItem("expenses", JSON.stringify(expenses));
  updateSummary();


  modal.classList.add("hidden");
  amountInput.value = "";

  if (tg) tg.showAlert("Расход сохранён 💾");
});
// === ШАГ 11: подсчёт сумм ===
function updateSummary() {
  const expenses =
    JSON.parse(localStorage.getItem("expenses") || "[]");

  let daily = 0;
  let main = 0;
  let big = 0;

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

// обновляем при запуске
updateSummary();
// === ШАГ 12: лимит и календарь ===
const limitInput = document.getElementById("daily-limit");
const calendar = document.getElementById("calendar");
// загрузка лимита
limitInput.value =
  localStorage.getItem("dailyLimit") || "";

// сохранение лимита
limitInput.addEventListener("change", () => {
  localStorage.setItem("dailyLimit", limitInput.value);
  renderCalendar();
});

function renderCalendar() {
  calendar.innerHTML = "";

  // === ВАЖНО: используем currentDate ===
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // заголовок месяца
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

    if (!isNaN(limit) && limit > 0) {
      if (sum <= limit) div.classList.add("ok");
      else div.classList.add("bad");
    }

    calendar.appendChild(div);
  }
}


// первый рендер
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

renderCalendar();
