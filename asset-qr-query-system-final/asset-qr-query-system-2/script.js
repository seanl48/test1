const startScanBtn = document.getElementById('startScanBtn');
const nextItemBtn = document.getElementById('nextItemBtn');
const stopScanBtn = document.getElementById('stopScanBtn');
const scannerSection = document.getElementById('scannerSection');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const resultTableWrap = document.getElementById('resultTableWrap');
const scannedValue = document.getElementById('scannedValue');
const sheetBadge = document.getElementById('sheetBadge');
const statusBanner = document.getElementById('statusBanner');
const loadingText = document.getElementById('loadingText');

let html5QrCode = null;
let isScannerRunning = false;
let hasHandledScan = false;

function setStatus(message, type = 'info') {
  statusBanner.textContent = message;
  statusBanner.className = `status-banner ${type}`;
}

function hideAllDynamicSections() {
  scannerSection.classList.add('hidden');
  loadingSection.classList.add('hidden');
  resultSection.classList.add('hidden');
}

async function stopScanner() {
  if (html5QrCode && isScannerRunning) {
    try {
      await html5QrCode.stop();
      await html5QrCode.clear();
    } catch (error) {
      console.warn('停止掃描時發生狀況：', error);
    }
  }

  html5QrCode = null;
  isScannerRunning = false;
}

function renderResultTable(rowData) {
  const rowsHtml = rowData
    .map((item) => {
      const value = item.value === '' ? '—' : escapeHtml(String(item.value));
      return `
        <tr>
          <th>${escapeHtml(item.field)}</th>
          <td>${value}</td>
        </tr>
      `;
    })
    .join('');

  resultTableWrap.innerHTML = `<table class="result-table"><tbody>${rowsHtml}</tbody></table>`;
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function lookupAsset(code) {
  hideAllDynamicSections();
  loadingSection.classList.remove('hidden');
  nextItemBtn.classList.remove('hidden');
  loadingText.textContent = `正在查詢編號：${code}`;
  setStatus('已掃描成功，正在查詢資料...', 'info');

  try {
    const response = await fetch(`/api/search?code=${encodeURIComponent(code)}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '查詢失敗');
    }

    scannedValue.textContent = result.lookupValue;
    sheetBadge.textContent = result.sheetName;
    renderResultTable(result.rowData);

    hideAllDynamicSections();
    resultSection.classList.remove('hidden');
    setStatus(`查詢成功，已於「${result.sheetName}」找到資料。`, 'success');
  } catch (error) {
    hideAllDynamicSections();
    setStatus(error.message || '查無資料或系統異常', 'error');
    resultTableWrap.innerHTML = '';
    scannedValue.textContent = code;
    sheetBadge.textContent = '';
  }
}

async function startScanner() {
  hasHandledScan = false;
  await stopScanner();
  hideAllDynamicSections();
  scannerSection.classList.remove('hidden');
  nextItemBtn.classList.add('hidden');
  setStatus('相機已開啟，請對準 QR Code。', 'info');

  html5QrCode = new Html5Qrcode('reader');

  try {
    const devices = await Html5Qrcode.getCameras();
    const cameraConfig = devices && devices.length > 0
      ? { facingMode: 'environment' }
      : { facingMode: 'environment' };

    await html5QrCode.start(
      cameraConfig,
      {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight) * 0.75;
          return { width: edge, height: edge };
        }
      },
      async (decodedText) => {
        if (hasHandledScan) return;

        hasHandledScan = true;
        const code = decodedText.trim();
        await stopScanner();
        await lookupAsset(code);
      },
      () => {
        // 掃描過程中的失敗不用特別顯示
      }
    );

    isScannerRunning = true;
  } catch (error) {
    console.error(error);
    await stopScanner();
    setStatus(
      '無法啟動相機。請確認已允許相機權限，並使用手機瀏覽器直接開啟本站。',
      'error'
    );
  }
}

startScanBtn.addEventListener('click', async () => {
  await startScanner();
});

stopScanBtn.addEventListener('click', async () => {
  await stopScanner();
  hideAllDynamicSections();
  setStatus('已停止掃描。', 'info');
});

nextItemBtn.addEventListener('click', () => {
  window.location.href = `/?scan=1&t=${Date.now()}`;
});

window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('scan') === '1') {
    await startScanner();
  }
});
