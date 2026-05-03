'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ВАЖНО: Добавьте ваш API ключ в .env файл как GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY');
if (!process.env.GEMINI_API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY is missing in .env file. AI features will not work.');
}
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Генерирует ответ от Gemini на основе промпта.
 * @param {string} prompt 
 * @returns {Promise<string>}
 */
async function generateContent(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error details:', JSON.stringify(error, null, 2));
    return null;
  }
}

module.exports = {
  generateContent,
};
