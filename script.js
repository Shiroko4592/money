const rates = {
  sodong: 0.92,     // 소동화
  soeun: 10,        // 예: 1 소은화 = 10 소동화
  sogeum: 100,      // 예: 1 소금화 = 100 소동화
};

window.onload = function () {
  updateRateList();
};

function updateRateList() {
  const list = document.getElementById("rate-list");
  list.innerHTML = `
    <li>1 소동화 = ${rates.sodong} KRW</li>
    <li>1 소은화 = ${rates.soeun * rates.sodong} KRW</li>
    <li>1 소금화 = ${rates.sogeum * rates.sodong} KRW</li>
  `;
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

  const krw = amount * (rates[currency] * (currency === "sodong" ? 1 : 1));
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

  const value = amount / (rates[currency] * (currency === "sodong" ? 1 : 1));
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
      return "";
  }
}
