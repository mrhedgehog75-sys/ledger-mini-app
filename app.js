const tg = window.Telegram.WebApp;
tg.ready();
// Подстраиваем цвет под тему Telegram
document.body.style.background = tg.themeParams.bg_color || "#d4d0c8";

// Расширяем на весь экран
tg.expand();

document.body.style.overflow = "hidden";
tg.MainButton.show();

tg.MainButton.onClick(() => {
  alert("Расход добавлен 💸");
});

const log = document.getElementById("log");
const btn = document.getElementById("testBtn");

btn.onclick = () => {
  log.innerText = "💸 Расход добавлен (повседневный)";

};
const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();

  tg.MainButton.setText("Добавить расход");
  tg.MainButton.show();
}