# 資產 QR Code 查詢系統

這是一個可直接上傳到 GitHub、再用 Vercel 部署的手機版查詢系統。

## 功能

- 首頁只有一個按鈕：**開始掃描 QR Code**
- 掃描成功後，直接用 QR Code 內容去比對 Google Sheet 的 **編號** 欄位
- 會依序搜尋以下兩張工作表：
  - `3C-個人`
  - `3C-公用&Demo`
- 找到後直接顯示整列資料
- 結果頁下方有 **查詢下一項**，按下後會重新整理並直接準備掃描下一筆
- 沒有任何寫入功能，只有查詢

---

## 專案結構

```bash
asset-qr-query-system/
├─ api/
│  └─ search.js
├─ index.html
├─ script.js
├─ style.css
├─ package.json
├─ vercel.json
├─ .env.example
└─ README.md
```

---

## 你的 Google Sheet 條件

### 1. 兩張工作表名稱
請確認工作表名稱與下面完全一致：

- `3C-個人`
- `3C-公用&Demo`

### 2. 必須有 `編號` 欄位
系統查詢時只會用 **編號** 這一欄比對。

### 3. 編號不可重複
你已經說過編號不重複，這樣目前程式邏輯就可以直接使用。

---

## Google Cloud 設定

### 步驟 1：建立 Google Cloud 專案
到 Google Cloud Console 建一個專案。

### 步驟 2：啟用 Google Sheets API
在 API 與服務中啟用 **Google Sheets API**。

### 步驟 3：建立 Service Account
建立一個 service account，並產生 JSON 金鑰。

你會拿到類似這些資料：

- `client_email`
- `private_key`

### 步驟 4：把 Google Sheet 共用給 service account
把你的 Google Sheet 分享給 service account 的 email，權限給「檢視者」即可。

---

## 環境變數設定

在 Vercel 專案中加入以下環境變數：

### `GOOGLE_CLIENT_EMAIL`
填入 service account 的 `client_email`

### `GOOGLE_PRIVATE_KEY`
填入 service account 的 `private_key`

注意：
- 直接整段貼上即可
- 若是在 Vercel 上貼，通常保留原本換行即可
- 若你自己手動整理成單行，程式也會自動把 `\n` 還原成真正換行

### `GOOGLE_SHEET_ID`
填入 Google Sheet 的 ID。

例如這種網址：

```text
https://docs.google.com/spreadsheets/d/這一段就是ID/edit#gid=0
```

---

## 本機測試

### 1. 安裝套件

```bash
npm install
```

### 2. 建立 `.env`
可以複製 `.env.example` 後改成 `.env`

```bash
cp .env.example .env
```

然後填入你的 Google 資料。

### 3. 啟動本機開發

```bash
npm run dev
```

如果你要用手機測相機，建議直接部署到 Vercel 後再測，因為手機相機通常需要 HTTPS。

---

## 部署到 GitHub + Vercel

## 1. 上傳到 GitHub

```bash
git init
git add .
git commit -m "init asset qr lookup system"
git branch -M main
git remote add origin 你的GitHub專案網址
git push -u origin main
```

## 2. 在 Vercel 匯入 GitHub 專案
在 Vercel 建立新專案，選你的 GitHub repo。

## 3. 設定環境變數
把以下三個都加進去：

- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_ID`

## 4. Deploy
部署完成後，用手機直接打開網址即可。

---

## 使用流程

1. 打開首頁
2. 按 **開始掃描 QR Code**
3. 允許相機權限
4. 掃描資產上的 QR Code
5. 系統自動查詢 Google Sheet
6. 顯示該筆資料
7. 按 **查詢下一項** 繼續下一筆

---

## 若查不到資料

請檢查：

- QR Code 掃出來的內容是否真的就是 `編號`
- Google Sheet 的欄位名稱是否有 `編號`
- 工作表名稱是否完全一致
- service account 是否已被加入共用
- `GOOGLE_SHEET_ID` 是否正確

---

## 若相機打不開

請檢查：

- 是否有允許相機權限
- 是否使用手機瀏覽器直接開啟
- 是否是在 HTTPS 網址下使用
- 是否不是在某些受限的內嵌瀏覽器中開啟

---

## 之後若你要再改

你可以再調整：

- 顯示哪些欄位
- 查詢結果排序
- 卡片風格
- 加入搜尋框手動輸入編號
- 增加更多工作表

目前這版已經符合你現在的需求：

- 掃 QR Code
- 查 Google Sheet
- 手機版介面
- GitHub + Vercel 部署
- 不寫入，只查詢
