let html5QrCode = null;
let isScanning = false;

document.addEventListener('DOMContentLoaded', () => {
  const startScanBtn = document.getElementById('startScanBtn');
  startScanBtn.addEventListener('click', startScanner);
});

async function startScanner() {
  const readerEl = document.getElementById('reader');
  const statusEl = document.getElementById('status');
  const startBtn = document.getElementById('startScanBtn');

  clearResult();
  statusEl.textContent = '';
  readerEl.classList.remove('hidden');

  if (isScanning) return;

  try {
    startBtn.disabled = true;
    startBtn.textContent = '掃描中...';

    html5QrCode = new Html5Qrcode('reader');
    isScanning = true;

    await html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 220, height: 220 }
      },
      async (decodedText) => {
        await onScanSuccess(decodedText);
      },
      () => {}
    );
  } catch (error) {
    statusEl.textContent = '無法啟動鏡頭，請確認已允許相機權限。';
    resetScanButton();
    isScanning = false;
  }
}

async function onScanSuccess(decodedText) {
  const code = String(decodedText || '').trim();
  if (!code) return;

  await stopScanner();

  const statusEl = document.getElementById('status');
  statusEl.textContent = `已掃描：${code}，查詢中...`;

  await searchByCode(code);
}

async function stopScanner() {
  if (html5QrCode && isScanning) {
    try {
      await html5QrCode.stop();
      await html5QrCode.clear();
    } catch (err) {
      console.error(err);
    }
  }

  html5QrCode = null;
  isScanning = false;
  resetScanButton();
}

function resetScanButton() {
  const startBtn = document.getElementById('startScanBtn');
  startBtn.disabled = false;
  startBtn.textContent = '開始掃描 QR Code';
}

async function searchByCode(code) {
  const resultSection = document.getElementById('resultSection');
  const scanSection = document.getElementById('scanSection');
  const statusEl = document.getElementById('status');

  try {
    const response = await fetch(`/api/search?code=${encodeURIComponent(code)}`);
    const data = await response.json();

    if (!data.ok) {
      statusEl.textContent = '';
      scanSection.classList.add('hidden');
      resultSection.classList.remove('hidden');

      renderNotFound(data.error || '查詢失敗', code);
      return;
    }

    statusEl.textContent = '';
    scanSection.classList.add('hidden');
    resultSection.classList.remove('hidden');

    showResult(data);
  } catch (error) {
    statusEl.textContent = '';
    scanSection.classList.add('hidden');
    resultSection.classList.remove('hidden');

    renderNotFound('系統連線失敗，請稍後再試', code);
  }
}

function showResult(data) {
  const resultArea = document.getElementById('result');

  let html = `
    <div class="result-card">
      <div class="result-header">
        <div class="result-title">查詢結果</div>
        <div class="result-meta">工作表：${escapeHtml(data.sheetName)}</div>
        <div class="result-meta">編號：${escapeHtml(data.code)}</div>
        <div class="result-meta">列號：${escapeHtml(String(data.rowIndex))}</div>
      </div>

      <div class="result-table">
  `;

  data.rowData.forEach((item) => {
    html += `
      <div class="result-row">
        <div class="result-key">${escapeHtml(item.key)}</div>
        <div class="result-value">${escapeHtml(item.value)}</div>
      </div>
    `;
  });

  html += `
      </div>

      <div class="actions">
        <button id="nextBtn" class="primary-btn">查詢下一項</button>
      </div>
    </div>
  `;

  resultArea.innerHTML = html;

  document.getElementById('nextBtn').addEventListener('click', resetToScan);
}

function renderNotFound(message, code = '') {
  const resultArea = document.getElementById('result');

  resultArea.innerHTML = `
    <div class="result-card">
      <div class="not-found-title">查無資料</div>
      <div class="result-meta">${escapeHtml(message)}</div>
      ${code ? `<div class="result-meta">查詢編號：${escapeHtml(code)}</div>` : ''}

      <div class="actions">
        <button id="nextBtn" class="primary-btn">查詢下一項</button>
      </div>
    </div>
  `;

  document.getElementById('nextBtn').addEventListener('click', resetToScan);
}

function resetToScan() {
  const scanSection = document.getElementById('scanSection');
  const resultSection = document.getElementById('resultSection');
  const resultArea = document.getElementById('result');
  const statusEl = document.getElementById('status');
  const readerEl = document.getElementById('reader');

  resultArea.innerHTML = '';
  statusEl.textContent = '';
  readerEl.innerHTML = '';
  readerEl.classList.add('hidden');

  resultSection.classList.add('hidden');
  scanSection.classList.remove('hidden');

  resetScanButton();
  startScanner();
}

function clearResult() {
  const resultArea = document.getElementById('result');
  const resultSection = document.getElementById('resultSection');

  resultArea.innerHTML = '';
  resultSection.classList.add('hidden');
}

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
