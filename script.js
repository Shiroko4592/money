/* 환율 및 자동 변환 + 회원가입 로직 (POST 전송, localStorage 폴백, SHA-256 해시) */

const rates = {
  sodong: 0.92, // 소동화
  soeun: 9.2,   // 소은화 = 10 소동화
  sogeum: 92    // 소금화 = 100 소동화
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
    const li = document.createElement("li");
    li.textContent = `1 ${currencyName(key)} = ${rates[key]} KRW`;
    list.appendChild(li);
  }
  document.getElementById("updated").textContent = `갱신일: ${new Date().toLocaleString()}`;
  autoConvert();
}

/* 자동 변환 */
function autoConvert() {
  const amount = parseFloat(document.getElementById("amount").value);
  const result = document.getElementById("result");

  if (isNaN(amount) || amount <= 0) {
    result.textContent = "금액을 입력하세요.";
    result.style.color = "red";
    return;
  }

  // 가장 큰 단위(사용 가능한 단위 중에서 value >= 1 이면서 value가 가장 큰 것)를 고른다
  let bestCurrency = null;
  let bestValue = 0;
  for (let key in rates) {
    const val = amount / rates[key];
    if (val >= 1 && val > bestValue) {
      bestValue = val;
      bestCurrency = key;
    }
  }
  if (!bestCurrency) {
    bestCurrency = "sodong";
    bestValue = amount / rates.sodong;
  }

  result.style.color = "#333";
  result.textContent = `${amount.toLocaleString()} KRW = ${bestValue.toFixed(2)} ${currencyName(bestCurrency)}`;
}

/* 화폐 추가 */
function addCurrency() {
  const nm = document.getElementById("new-name").value.trim();
  const rate = parseFloat(document.getElementById("new-rate").value);
  if (!nm || isNaN(rate) || rate <= 0) { alert("이름과 유효한 환율을 입력하세요."); return; }
  const key = nm.toLowerCase().replace(/\s+/g, "_");
  if (rates[key]) { alert("이미 존재하는 화폐입니다."); return; }
  rates[key] = rate;
  document.getElementById("new-name").value = "";
  document.getElementById("new-rate").value = "";
  updateRateList();
}

/* ---------------------------
   회원가입 / 자동 로그인 로직
   --------------------------- */

/*
 동작 요약:
 - 비밀번호는 클라이언트에서 SHA-256 해시한 뒤 전송 (서버에서도 반드시 salt+hash 처리 필요)
 - 서버에 POST로 보냄. (절대 GET으로 쿼리스트링에 넣지 않음)
 - 서버 응답이 실패하면 localStorage에 "backup_profile"로 암호화(해시 포함)해서 저장(폴백)
 - 가입 완료 후 자동으로 '로그인 상태' 처리 — 이후 로그아웃 기능 없음(사용자 요구).
 - 마이페이지는 읽기 전용.
*/

async function handleSignup() {
  const name = document.getElementById("user-name").value.trim();
  const email = document.getElementById("user-email").value.trim();
  const password = document.getElementById("user-password").value;

  if (!name || !email || !password) { alert("모든 항목을 입력하세요."); return; }

  // 클라이언트 측 입력 기본 검사
  if (!validateEmail(email)) { alert("유효한 이메일을 입력하세요."); return; }
  if (password.length < 6) { alert("비밀번호는 최소 6자 이상이어야 합니다."); return; }

  // 비밀번호 해시화 (SHA-256)
  const pwHash = await sha256(password);

  const profile = {
    name,
    email,
    passwordHash: pwHash, // 서버에서도 추가 보안 필요 (salt + bcrypt 등)
    createdAt: new Date().toISOString()
  };

  // 서버에 전송 (POST JSON). 서버가 없으면 fetch는 실패 -> 폴백 로컬저장
  try {
    const resp = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
      credentials: 'include' // 필요 시 쿠키 포함
    });

    if (!resp.ok) {
      // 서버가 4xx/5xx을 반환하면 폴백 저장
      console.warn('서버 응답 오류, 로컬 폴백으로 저장합니다.', resp.status);
      localBackupSave(profile);
      finishSignup(profile);
      return;
    }

    // 서버 성공 응답 처리: 서버가 토큰/세션을 준다면 여기서 저장
    const data = await resp.json().catch(()=>({}));
    // 예: data = { success: true, token: '...' }
    if (data && data.token) {
      // 안전하게 토큰 저장(브라우저 정책에 따라 httpOnly 쿠키로 하는 것을 권장)
      try { localStorage.setItem('session_token', data.token); } catch(e){}
    }

    finishSignup(profile);

  } catch (e) {
    console.warn('서버 전송 실패 (네트워크 없음 등). 로컬 폴백으로 저장합니다.', e);
    localBackupSave(profile);
    finishSignup(profile);
  }
}

function finishSignup(profile) {
  // 가입 후 자동 로그인 상태로 처리: 세션 정보 저장
  try {
    localStorage.setItem('user_profile', JSON.stringify(profile));
    localStorage.setItem('is_logged_in', '1');
  } catch (e) { console.error('localStorage 저장 실패', e); }

  // UI 전환: 가입 폼 숨기고 마이페이지 버튼 표시
  document.getElementById('signup-form').style.display = 'none';
  const mp = document.getElementById('mypage');
  mp.style.display = 'block';
}

// 서버 실패 시 로컬에 백업 저장 (암호화 수준은 클라이언트 해시 + 로컬스토리지. 실제 서비스면 서버측 저장 권장)
function localBackupSave(profile) {
  try {
    localStorage.setItem('backup_profile', JSON.stringify(profile));
  } catch (e) { console.error('backup 저장 실패', e); }
}

// 세션 복구: 이미 가입 상태면 UI 복원
function restoreSession() {
  const logged = localStorage.getItem('is_logged_in');
  const profileStr = localStorage.getItem('user_profile') || localStorage.getItem('backup_profile');
  if (logged && profileStr) {
    try {
      const profile = JSON.parse(profileStr);
      document.getElementById('signup-form').style.display = 'none';
      document.getElementById('mypage').style.display = 'block';
      // 마이페이지 내용 준비
      document.getElementById('mp-name').textContent = profile.name;
      document.getElementById('mp-email').textContent = profile.email;
      document.getElementById('mp-date').textContent = new Date(profile.createdAt).toLocaleString();
    } catch (e) {
      console.error('세션 복원 실패', e);
    }
  }
}

// 마이페이지 열기 (읽기 전용)
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

/* 화폐 이름 helper */
function currencyName(code) {
  switch (code) {
    case "sodong": return "소동화";
    case "soeun": return "소은화";
    case "sogeum": return "소금화";
    default: return code;
  }
}
