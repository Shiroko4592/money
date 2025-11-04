// script.js
(function(){
  // 기준 환율 / 비율
  const SD_TO_KRW = 0.92; // 소동화 1닢 = 0.92 KRW
  const SE_TO_SD = 1000;  // 소은화 1닢 = 1000 소동화
  const SG_TO_SD = 1000000; // 소금화 1닢 = 1,000,000 소동화

  // 요소
  const amountEl = document.getElementById('amount');
  const currencyEl = document.getElementById('currency');
  const outKRW = document.getElementById('out-krw');
  const outSD = document.getElementById('out-sd');
  const outSE = document.getElementById('out-se');
  const outSG = document.getElementById('out-sg');
  const convertBtn = document.getElementById('convertBtn');
  const resetBtn = document.getElementById('resetBtn');
  const autoConvert = document.getElementById('autoConvert');

  function fmt(n){
    if (!isFinite(n)) return '—';
    // 6자리 소수까지 표시, 불필요한 0 제거
    const s = Number(n).toLocaleString('ko-KR', {maximumFractionDigits:6});
    return s;
  }

  function toSD(value, from){
    // 모든 통화를 소동화 기준으로 변환
    switch(from){
      case 'krw': return value / SD_TO_KRW; // KRW -> 소동화
      case 'sd': return value; // already
      case 'se': return value * SE_TO_SD; // 소은화 -> 소동화
      case 'sg': return value * SG_TO_SD; // 소금화 -> 소동화
      default: return NaN;
    }
  }

  function fromSD(sdAmount, to){
    switch(to){
      case 'krw': return sdAmount * SD_TO_KRW;
      case 'sd': return sdAmount;
      case 'se': return sdAmount / SE_TO_SD;
      case 'sg': return sdAmount / SG_TO_SD;
      default: return NaN;
    }
  }

  function convert(){
    const raw = Number(amountEl.value);
    if (!isFinite(raw) || raw < 0) return;
    const cur = currencyEl.value;

    const sd = toSD(raw, cur);
    const krw = fromSD(sd, 'krw');
    const sdOut = fromSD(sd, 'sd');
    const seOut = fromSD(sd, 'se');
    const sgOut = fromSD(sd, 'sg');

    outKRW.textContent = fmt(krw) + ' 원';
    outSD.textContent = fmt(sdOut) + ' 닢';
    outSE.textContent = fmt(seOut) + ' 닢';
    outSG.textContent = fmt(sgOut) + ' 닢';
  }

  convertBtn.addEventListener('click', convert);
  resetBtn.addEventListener('click', ()=>{
    amountEl.value = 1000;
    currencyEl.value = 'krw';
    convert();
  });

  if (autoConvert.checked){
    amountEl.addEventListener('input', convert);
    currencyEl.addEventListener('change', convert);
  }

  autoConvert.addEventListener('change', ()=>{
    if (autoConvert.checked){
      amountEl.addEventListener('input', convert);
      currencyEl.addEventListener('change', convert);
    } else {
      amountEl.removeEventListener('input', convert);
      currencyEl.removeEventListener('change', convert);
    }
  });

  // 초기 실행
  convert();

})();
