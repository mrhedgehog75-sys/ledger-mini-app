const tg = window.Telegram?.WebApp;

/* === Telegram init (БЕЗ MainButton) === */
if (tg) {
  tg.ready();
  tg.expand();

  document.body.style.background =
    tg.themeParams.bg_color || "#d4d0c8";
  document.body.style.overflow = "hidden";
}

/* === МОДАЛЬНОЕ ОКНО (+) === */
const modal = document.getElementById("expense-modal");
const amountInput = document.getElementById("amount-input");
const typeInput = document.getElementById("type-input");
const flowInput = document.getElementById("flow-input");
const saveBtn = document.getElementById("save-expense");

/* кнопка + */
document.querySelectorAll(".add-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });
});

/* === СОХРАНЕНИЕ === */
saveBtn.addEventListener("click", () => {
  const amount = Number(amountInput.value);
  if (!amount) return;

  const operation = {
    amount,
    type: typeInput.value,
    flow: flowInput.value,
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
});

/* === СУММЫ === */
function updateSummary() {
  const data =
    JSON.parse(localStorage.getItem("expenses") || "[]");

  let daily = 0, main = 0, big = 0, income = 0;

  data.forEach(e => {
    if (e.flow === "in") income += e.amount;
    else {
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

prevBtn.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
};

nextBtn.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
};

/* === КАЛЕНДАРЬ === */
function renderCalendar() {
  calendar.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthTitle.innerText =
    monthNames[month] + " " + year;

  const data =
    JSON.parse(localStorage.getItem("expenses") || "[]");

  const limit = Number(limitInput.value);
  const daysInMonth =
    new Date(year, month + 1, 0).getDate();

  const today = new Date();
  today.setHours(0,0,0,0);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    date.setHours(0,0,0,0);

    const sum = data
      .filter(e => {
        const d = new Date(e.date);
        return e.flow === "out" &&
          d.getFullYear() === year &&
          d.getMonth() === month &&
          d.getDate() === day;
      })
      .reduce((s,e)=>s+e.amount,0);

    const div = document.createElement("div");
    div.className = "day";
    div.innerText = day;

    if (limit && date <= today) {
      div.classList.add(sum <= limit ? "ok" : "bad");
    }

    calendar.appendChild(div);
  }
}

/* === ВКЛАДКИ === */
function showTab(id) {
  document
    .querySelectorAll(".tab-content")
    .forEach(t => t.classList.add("hidden"));

  document.getElementById("tab-" + id)
    .classList.remove("hidden");

  if (id === "charts") {
    setTimeout(updateCharts, 50);
  }
}

/* === ГРАФИКИ === */
const barCtx =
  document.getElementById("barChart")?.getContext("2d");
const lineCtx =
  document.getElementById("lineChart")?.getContext("2d");

function drawBarChart() {
  if (!barCtx) return;
  barCtx.clearRect(0,0,300,160);

  const data =
    JSON.parse(localStorage.getItem("expenses") || "[]");

  let d=0,m=0,b=0;
  data.forEach(e=>{
    if(e.flow==="out"){
      if(e.type==="daily") d+=e.amount;
      if(e.type==="main") m+=e.amount;
      if(e.type==="big") b+=e.amount;
    }
  });

  const vals=[d,m,b];
  const max=Math.max(...vals,1);
  const colors=["#6aa84f","#6fa8dc","#e06666"];

  vals.forEach((v,i)=>{
    const h=v/max*100;
    barCtx.fillStyle=colors[i];
    barCtx.fillRect(40+i*80,130-h,40,h);
  });
}

function drawLineChart() {
  if (!lineCtx) return;
  lineCtx.clearRect(0,0,300,160);

  const data =
    JSON.parse(localStorage.getItem("expenses") || "[]");

  const y=currentDate.getFullYear();
  const m=currentDate.getMonth();
  const days=new Date(y,m+1,0).getDate();
  const sums=Array(days).fill(0);

  data.forEach(e=>{
    if(e.flow==="out"){
      const d=new Date(e.date);
      if(d.getFullYear()===y&&d.getMonth()===m){
        sums[d.getDate()-1]+=e.amount;
      }
    }
  });

  const max=Math.max(...sums,1);
  lineCtx.strokeStyle="#3c78d8";
  lineCtx.beginPath();

  sums.forEach((v,i)=>{
    const x=10+(i/(days-1))*280;
    const y=140-(v/max)*100;
    i===0?lineCtx.moveTo(x,y):lineCtx.lineTo(x,y);
  });

  lineCtx.stroke();
}

function updateCharts() {
  drawBarChart();
  drawLineChart();
}

/* === СТАРТ === */
updateSummary();
renderCalendar();
