import { chromium } from 'playwright';
import OpenAI from 'openai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.API_KEY });

async function image_to_base64(image_file) {
    return await new Promise(resolve => {
        fs.readFile(image_file, (err, data) => {
            const base64Data = data.toString('base64');
            const dataURI = `data:image/jpeg;base64,${base64Data}`;
            resolve(dataURI);
        });
    });
}

const browser = await chromium.launch({
    headless: false
});

const page = await browser.newPage();
await page.setViewportSize({width: 1280, height: 800,})

await page.goto('https://www.youtube.com/channel/UC9RWzC2UBO2EeRaJMpsnYfg');

await page.screenshot( {
    path: "screenshot-pw.jpg",
    quality: 100,
    fullPage: true,
} );

const base64_image = await image_to_base64("screenshot-pw.jpg");

const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    max_tokens: 1024,
    messages: [{
        "role": "user",
        "content": [
            {
                "type": "image_url",
                "image_url": base64_image,
            },
            {
                "type": "text",
                "text": "Given a webpage showing a youtube channel explain in one sentence what this channel is about, who makes its content and what language is it in",
            }
        ]
    }],
});

const message = response.choices[0].message;
const message_text = message.content;

console.log("GPT: " + message_text);