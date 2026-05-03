'use strict';

const geminiService = require('../services/gemini.service');

/**
 * Анализирует данные сна пользователя с помощью Gemini AI.
 */
async function analyzeSleep(req, res, next) {
  try {
    const { sleepTime, wakeTime, quality, wokeUpAtNight } = req.body;

    const prompt = `Foydalanuvchi uyqu ma'lumotlari: 
    Uxlash vaqti: ${sleepTime}, Uyg'onish vaqti: ${wakeTime}, Sifati: ${quality}, Tunda uyg'ondi: ${wokeUpAtNight ? 'Ha' : 'Yo\'q'}.
    Ushbu ma'lumotlarni tahlil qiling va quyidagi formatda JSON qaytaring (faqat JSON):
    {
      "score": 85, 
      "status": "Yaxshi", 
      "description": "Sizning uyqungiz bugun o'rtachadan 12% yuqori natija ko'rsatdi.",
      "durationPercent": 90,
      "timingPercent": 85,
      "subjectivePercent": 100,
      "recommendation": "22:00–00:00 oralig'ida uxlash organizm uchun optimal hisoblanadi..."
    }
    Til: O'zbekcha.`;

    const aiResponse = await geminiService.generateContent(prompt);
    if (!aiResponse) {
      return res.status(500).json({ success: false, message: 'AI tahlilini amalga oshirib bo\'lmadi. API kalitini tekshiring.' });
    }

    let analysis;
    try {
      const cleaned = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse Gemini sleep analysis:', e);
      return res.status(500).json({ success: false, message: 'AI javobini o\'qib bo\'lmadi.' });
    }

    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeSleep,
};
