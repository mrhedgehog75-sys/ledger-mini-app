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
