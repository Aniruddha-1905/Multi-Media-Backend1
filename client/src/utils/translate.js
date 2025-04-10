import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const key = "CHTJxRUJEof8BX4PVFPQGB3IMvA02v5Nsq4cAbIJXjwntr9TtiDGJQQJ99BBAC3pKaRXJ3w3AAAbACOGg2s3";
const endpoint = "https://api.cognitive.microsofttranslator.com";
const location = "eastasia";

/**
 * Translates text into the selected language using Microsoft Translator API.
 * @param {string} text - The text to be translated.
 * @param {string} targetLang - The target language code (e.g., 'hi' for Hindi).
 * @returns {Promise<string>} - The translated text.
 */
export const translateText = async (text, targetLang) => {
    try {
        const response = await axios.post(
            `${endpoint}/translate`,
            [{ text }],
            {
                headers: {
                    "Ocp-Apim-Subscription-Key": key,
                    "Ocp-Apim-Subscription-Region": location,
                    "Content-Type": "application/json",
                    "X-ClientTraceId": uuidv4().toString(),
                },
                params: {
                    "api-version": "3.0",
                    from: "en",
                    to: targetLang,
                },
            }
        );
        
        return response.data[0].translations[0].text;
    } catch (error) {
        console.error("Translation error:", error.message);
        return "Translation failed.";
    }
};
