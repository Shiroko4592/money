/* 환율 및 자동 변환 + 회원가입 로직 (POST 전송, localStorage 폴백, SHA-256 해시)
   변경점: rates는 { rate, name } 구조. 화면 표시는 "화폐이름 1닢 = X KRW" / 변환도 "화폐이름 Y닢" 형태.
*/

const rates = {
  sodong: { rate: 0.92, name: '소동화' }, // 1닢당 KRW
  soeun:  { rate: 9.2,  name: '소은화' }, // 1닢당 KRW (예시)
  sogeum: { rate: 92,   name: '소금화' }  // 1닢당 KRW (예시)
};

// -- 초기화
window.onload = () => {
  updateRateList();
  setInterval(updateRateList, 60000); // 1분마다 갱신
  document.getElementById("amount").addEventListener("input", autoConvert);
  document.getElementById("add-currency-btn").addEventListener("click", addCurrency);
  document.getElementById("signup-btn").addEventListener("click", handleSignup);
  document.getElementById("mypage-open-btn").addEventListener("click", openMypage);
  document.getElementById("close-mp-btn").addEventListener("click", closeMypage);

  restoreSession(); // 이미 가입/로그인 상태면 UI 복원
};

function updateRateList() {
  const list = document.getElementById("rate-list");
  list.innerHTML = "";
  for (let key in rates) {
    const info = rates[key];
    const li = document.createElement("li");
    li.textContent = `${info.name} 1닢 = ${info.rate} KRW`;
    list.appendChild(li);
  }
  document.getElementById("updated").textContent = `갱신일: ${new Date().toLocaleString()}`;
  autoConvert();
}

/* 자동 변환: 입력한 KRW를 가장 '큰' 닢 단위로 표현 (value >=1 이고 value 최대) */
function autoConvert() {
  const amount = parseFloat(document.getElementById("amount").value);
  const result = document.getElementById("result");

  if (isNaN(amount) || amount <= 0) {
    result.textContent = "금액을 입력하세요.";
    result.style.color = "red";
    return;
  }

  let bestKey = null;
  let bestVal = 0;
  for (let key in rates) {
    const val = amount / rates[key].rate;
    if (val >= 1 && val > bestVal) {
      bestVal = val;
      bestKey = key;
    }
  }

  if (!bestKey) {
    bestKey = 'sodong';
    bestVal = amount / rates.sodong.rate;
  }

  result.style.color = "#333";
  result.textContent = `${amount.toLocaleString()} KRW = ${formatValue(bestVal)} ${rates[bestKey].name} 닢`;
}

/* 화폐 추가: 이름(표시명) + 1닢당 KRW값 */
function addCurrency() {
  const nm = document.getElementById("new-name").value.trim();
  const rate = parseFloat(document.getElementById("new-rate").value);
  if (!nm || isNaN(rate) || rate <= 0) { alert("이름과 유효한 환율을 입력하세요."); return; }
  const key = nm.toLowerCase().replace(/\s+/g, '_');
  if (rates[key]) { alert("이미 존재하는 화폐입니다."); return; }
  rates[key] = { rate: rate, name: nm };
  document.getElementById("new-name").value = "";
  document.getElementById("new-rate").value = "";
  updateRateList();
}

/* ---------------------------
   회원가입 / 자동 로그인 로직
   (이전 코드와 동일한 동작 유지)
   --------------------------- */

async function handleSignup() {
  const name = document.getElementById("user-name").value.trim();
  const email = document.getElementById("user-email").value.trim();
  const password = document.getElementById("user-password").value;

  if (!name || !email || !password) { alert("모든 항목을 입력하세요."); return; }

  if (!validateEmail(email)) { alert("유효한 이메일을 입력하세요."); return; }
  if (password.length < 6) { alert("비밀번호는 최소 6자 이상이어야 합니다."); return; }

  const pwHash = await sha256(password);

  const profile = {
    name,
    email,
    passwordHash: pwHash,
    createdAt: new Date().toISOString()
  };

  try {
    const resp = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
      credentials: 'include'
    });

    if (!resp.ok) {
      console.warn('서버 응답 오류, 로컬 폴백으로 저장합니다.', resp.status);
      localBackupSave(profile);
      finishSignup(profile);
      return;
    }

    const data = await resp.json().catch(()=>({}));
    if (data && data.token) {
      try { localStorage.setItem('session_token', data.token); } catch(e){}
    }

    finishSignup(profile);

  } catch (e) {
    console.warn('서버 전송 실패. 로컬 폴백으로 저장합니다.', e);
    localBackupSave(profile);
    finishSignup(profile);
  }
}

function finishSignup(profile) {
  try {
    localStorage.setItem('user_profile', JSON.stringify(profile));
    localStorage.setItem('is_logged_in', '1');
  } catch (e) { console.error('localStorage 저장 실패', e); }

  document.getElementById('signup-form').style.display = 'none';
  const mp = document.getElementById('mypage');
  mp.style.display = 'block';
}

function localBackupSave(profile) {
  try {
    localStorage.setItem('backup_profile', JSON.stringify(profile));
  } catch (e) { console.error('backup 저장 실패', e); }
}

function restoreSession() {
  const logged = localStorage.getItem('is_logged_in');
  const profileStr = localStorage.getItem('user_profile') || localStorage.getItem('backup_profile');
  if (logged && profileStr) {
    try {
      const profile = JSON.parse(profileStr);
      document.getElementById('signup-form').style.display = 'none';
      document.getElementById('mypage').style.display = 'block';
      document.getElementById('mp-name').textContent = profile.name;
      document.getElementById('mp-email').textContent = profile.email;
      document.getElementById('mp-date').textContent = new Date(profile.createdAt).toLocaleString();
    } catch (e) {
      console.error('세션 복원 실패', e);
    }
  }
}

function openMypage() {
  const profileStr = localStorage.getItem('user_profile') || localStorage.getItem('backup_profile');
  if (!profileStr) { alert('프로필이 없습니다.'); return; }
  const profile = JSON.parse(profileStr);
  document.getElementById('mp-name').textContent = profile.name;
  document.getElementById('mp-email').textContent = profile.email;
  document.getElementById('mp-date').textContent = new Date(profile.createdAt).toLocaleString();
  document.getElementById('mypage-modal').style.display = 'flex';
}
function closeMypage() { document.getElementById('mypage-modal').style.display = 'none'; }

/* 유틸: 이메일 검사 */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* 유틸: SHA-256 해시 (hex) */
async function sha256(message) {
  const enc = new TextEncoder();
  const data = enc.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/* 숫자 포맷: 소수 최대 2자리, 불필요한 0 제거 */
function formatValue(v) {
  const rounded = Math.round(v * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded);
}
