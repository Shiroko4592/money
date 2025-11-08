const rates = {
  sodong: 0.92, // 소동화
  soeun: 9.2,   // 소은화 = 10 소동화
  sogeum: 92    // 소금화 = 100 소동화
};

window.onload = function () {
  updateRateList();
  setInterval(updateRateList, 60000); // 1분마다 환율 갱신
  document.getElementById("amount").addEventListener("input", autoConvert);
};

function updateRateList() {
  const list = document.getElementById("rate-list");
  list.innerHTML = "";
  for (let key in rates) {
    const li = document.createElement("li");
    li.textContent = `${currencyName(key)} 1닢 = ${rates[key]} KRW`;
    list.appendChild(li);
  }

  const now = new Date();
  document.getElementById("updated").textContent = `갱신일: ${now.toLocaleString()}`;
  autoConvert(); // 갱신될 때마다 자동 재계산
}

function autoConvert() {
  const amount = parseFloat(document.getElementById("amount").value);
  const result = document.getElementById("result");

  if (isNaN(amount) || amount <= 0) {
    result.textContent = "금액을 입력하세요.";
    result.style.color = "red";
    return;
  }

  // 단위 배열을 1닢 기준으로 내림차순 정렬
  const units = Object.keys(rates).sort((a, b) => rates[b] - rates[a]);

  let bestCurrency = units[units.length - 1]; // 가장 작은 단위로 초기화
  for (let key of units) {
    if (amount >= rates[key]) {
      bestCurrency = key;
      break; // 입력 금액보다 작은 단위가 나오면 바로 선택
    }
  }

  const value = amount / rates[bestCurrency];
  result.style.color = "#333";
  result.textContent = `${amount.toLocaleString()} KRW = ${currencyName(bestCurrency)} ${value.toFixed(2)}닢`;
}

function addCurrency() {
  const newName = document.getElementById("new-name").value.trim();
  const newRate = parseFloat(document.getElementById("new-rate").value);

  if (!newName || isNaN(newRate) || newRate <= 0) {
    alert("화폐 이름과 환율 값을 올바르게 입력하세요.");
    return;
  }

  const key = newName.toLowerCase();

  if (rates[key]) {
    alert("이미 존재하는 화폐입니다.");
    return;
  }

  rates[key] = newRate;
  alert(`${newName} 화폐가 추가되었습니다!`);

  document.getElementById("new-name").value = "";
  document.getElementById("new-rate").value = "";

  updateRateList();
}

function currencyName(code) {
  switch (code) {
    case "sodong":
      return "소동화";
    case "soeun":
      return "소은화";
    case "sogeum":
      return "소금화";
    default:
      return code;
  }
}
