const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();

  document.body.style.background =
    tg.themeParams.bg_color || "#d4d0c8";
  document.body.style.overflow = "hidden";

  tg.MainButton.setText("Добавить расход");
  tg.MainButton.show();

  tg.MainButton.onClick(() => {
    tg.showAlert("Расход добавлен 💸");
  });
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

  modal.classList.add("hidden");
  amountInput.value = "";

  if (tg) tg.showAlert("Расход сохранён 💾");
});
