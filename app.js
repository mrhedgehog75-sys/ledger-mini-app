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
