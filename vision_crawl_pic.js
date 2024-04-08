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

await page.goto('https://unsplash.com/s/photos/outdoor');

await page.screenshot( {
    path: "screenshot-pw.jpg",
    quality: 100,
    fullPage: false,
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
                "text": "Given a webpage showing a picture of the day. Describe in single sentence what is displayed on the first large picture of the outdoors.",
            }
        ]
    }],
});

const message = response.choices[0].message;
const message_text = message.content;

console.log("GPT: " + message_text);