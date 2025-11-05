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
    li.textContent = `1 ${currencyName(key)} = ${rates[key]} KRW`;
    list.appendChild(li);
  }

  const now = new Date();
  document.getElementById("updated").textContent = `갱신일: ${now.toLocaleString()}`;
}

function autoConvert() {
  const amount = parseFloat(document.getElementById("amount").value);
  const result = document.getElementById("result");

  if (isNaN(amount) || amount <= 0) {
    result.textContent = "금액을 입력하세요.";
    result.style.color = "red";
    return;
  }

  // 환율 자동 선택
  let currency, value;
  if (amount / rates.sogeum >= 1) {
    currency = "sogeum";
    value = amount / rates.sogeum;
  } else if (amount / rates.soeun >= 1) {
    currency = "soeun";
    value = amount / rates.soeun;
  } else {
    currency = "sodong";
    value = amount / rates.sodong;
  }

  result.style.color = "#333";
  result.textContent = `${amount.toLocaleString()} KRW = ${value.toFixed(2)} ${currencyName(currency)}`;
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
