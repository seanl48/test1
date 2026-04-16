export default async function handler(req, res) {
  try {
    const code = String(req.query.code || '').trim();

    if (!code) {
      return res.status(400).json({
        ok: false,
        error: '缺少查詢編號'
      });
    }

    const gasUrl = process.env.GAS_WEB_APP_URL;
    const gasToken = process.env.GAS_SHARED_TOKEN || '';

    if (!gasUrl) {
      return res.status(500).json({
        ok: false,
        error: '尚未設定 GAS_WEB_APP_URL'
      });
    }

    const url = new URL(gasUrl);
    url.searchParams.set('code', code);

    if (gasToken) {
      url.searchParams.set('token', gasToken);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      return res.status(502).json({
        ok: false,
        error: 'Apps Script 回傳格式不是 JSON',
        raw: text
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: String(err)
    });
  }
}
