const rates = {
  sodong: 0.92,    // 소동화
  soeun: 9.2,      // 소은화 = 10 소동화
  sogeum: 92       // 소금화 = 100 소동화
};

window.onload = function () {
  updateRateList();
};

function updateRateList() {
  const list = document.getElementById("rate-list");
  list.innerHTML = "";
  for (let key in rates) {
    const li = document.createElement("li");
    li.textContent = `1 ${currencyName(key)} = ${rates[key]} KRW`;
    list.appendChild(li);
  }

  const now = new Date();
  document.getElementById("updated").textContent = `갱신일: ${now.toLocaleString()}`;
}

function convertToKRW() {
  const currency = document.getElementById("currency").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const result = document.getElementById("result");

  if (isNaN(amount) || amount <= 0) {
    result.textContent = "⚠️ 금액을 입력하세요.";
    result.style.color = "red";
    return;
  }

  const krw = amount * rates[currency];
  result.style.color = "#333";
  result.textContent = `${amount} ${currencyName(currency)} = ${krw.toLocaleString()} KRW`;
}

function convertFromKRW() {
  const currency = document.getElementById("currency").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const result = document.getElementById("result");

  if (isNaN(amount) || amount <= 0) {
    result.textContent = "⚠️ 금액을 입력하세요.";
    result.style.color = "red";
    return;
  }

  const value = amount / rates[currency];
  result.style.color = "#333";
  result.textContent = `${amount.toLocaleString()} KRW = ${value.toFixed(2)} ${currencyName(currency)}`;
}

function addCurrency() {
  const newName = document.getElementById("new-name").value.trim();
  const newRate = parseFloat(document.getElementById("new-rate").value);
  const currencySelect = document.getElementById("currency");

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
  const option = document.createElement("option");
  option.value = key;
  option.textContent = `${newName}`;
  currencySelect.appendChild(option);

  updateRateList();

  document.getElementById("new-name").value = "";
  document.getElementById("new-rate").value = "";
  alert(`${newName} 화폐가 추가되었습니다!`);
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
      return code.charAt(0).toUpperCase() + code.slice(1);
  }
}
