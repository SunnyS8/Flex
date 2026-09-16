export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, message, source, calculator_data } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone required' });
  }

  const bitrixUrl = process.env.BITRIX_WEBHOOK_URL;
  const tgBotToken = process.env.TG_BOT_TOKEN;
  const tgChatId = process.env.TG_CHAT_ID;

  const results = { bitrix: null, telegram: null };

  // --- Bitrix24: создать лид ---
  if (bitrixUrl) {
    try {
      const fields = {
        TITLE: `[Flexs] ${source || 'Заявка с сайта'}`,
        NAME: name || '',
        EMAIL: email ? [{ VALUE: email, VALUE_TYPE: 'WORK' }] : [],
        PHONE: phone ? [{ VALUE: phone, VALUE_TYPE: 'WORK' }] : [],
        COMMENTS: message || '',
        SOURCE_ID: 'WEB',
        ASSIGNED_BY_ID: 1,
        UF_CRM_SOURCE: source || 'website',
      };

      if (calculator_data) {
        fields.COMMENTS += `\n\n--- Данные калькулятора ---\n${calculator_data}`;
      }

      const bxRes = await fetch(`${bitrixUrl}/crm.lead.add.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });

      const bxData = await bxRes.json();
      results.bitrix = bxData.result || null;
    } catch (err) {
      console.error('Bitrix24 error:', err.message);
    }
  }

  // --- Telegram: уведомление ---
  if (tgBotToken && tgChatId) {
    try {
      const lines = [
        `🔔 *Новая заявка с Flexs*`,
        ``,
        `📋 *Источник:* ${source || 'website'}`,
      ];
      if (name) lines.push(`👤 *Имя:* ${name}`);
      if (email) lines.push(`📧 *Email:* ${email}`);
      if (phone) lines.push(`📱 *Телефон:* ${phone}`);
      if (message) lines.push(`💬 *Сообщение:* ${message}`);
      if (calculator_data) lines.push(`\n📊 *Калькулятор:*\n\`\`\`\n${calculator_data}\n\`\`\``);

      const tgRes = await fetch(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: lines.join('\n'),
          parse_mode: 'Markdown',
        }),
      });
      results.telegram = tgRes.ok;
    } catch (err) {
      console.error('Telegram error:', err.message);
    }
  }

  return res.status(200).json({ ok: true, ...results });
}
