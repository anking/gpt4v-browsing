import { chromium } from 'playwright';
import OpenAI from 'openai';
import readline from 'readline';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();


async function highlight_links(page) {
    await page.evaluate(() => {
        document.querySelectorAll('[gpt-link-text]').forEach(e => {
            e.removeAttribute("gpt-link-text");
        });
    });

    const elements = await page.$$(
        "a, button, input, textarea, select, option, [role=button], [role=treeitem]"
    );

    elements.forEach(async e => {
        await page.evaluate(e => {
            function isElementVisible(el) {
                if (!el) return false; // Element does not exist

                function isStyleVisible(el) {
                    const style = window.getComputedStyle(el);
                    return style.width !== '0' &&
                        style.height !== '0' &&
                        style.opacity !== '0' &&
                        style.display !== 'none' &&
                        style.visibility !== 'hidden';
                }

                function isElementInViewport(el) {
                    const rect = el.getBoundingClientRect();
                    return (
                        rect.top >= 0 &&
                        rect.left >= 0 &&
                        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                    );
                }

                // Check if the element is visible style-wise
                if (!isStyleVisible(el)) {
                    return false;
                }

                // Traverse up the DOM and check if any ancestor element is hidden
                let parent = el;
                while (parent) {
                    if (!isStyleVisible(parent)) {
                        return false;
                    }
                    parent = parent.parentElement;
                }

                // Finally, check if the element is within the viewport
                return isElementInViewport(el);
            }

            e.style.border = "1px solid red";

            const position = e.getBoundingClientRect();

            console.log(e);

            if (position.width > 5 && position.height > 5 && isElementVisible(e)) {
                const link_text = e.textContent.replace(/[^a-zA-Z0-9 ]/g, '');
                e.setAttribute("gpt-link-text", link_text.toLowerCase());
            }
            // else if(e.tagName.toLowerCase() === 'option' && isElementVisible(e))
            // {
            //     const link_text = e.textContent.replace(/[^a-zA-Z0-9 ]/g, '');
            //     e.setAttribute( "gpt-link-text", link_text.toLowerCase() );
            // }
        }, e);
    });
}

const isSelectTag = async (elementHandle) => {
    return await elementHandle.evaluate(element => {
      return element.tagName.toLowerCase() === 'select';
    });
  };

(async () => {

    const browser = await chromium.launch({
        headless: false
    });

    const page = await browser.newPage();

    await page.goto('https://www.sewickleyaudipa.com/new-inventory/index.htm', { waitUntil: "domcontentloaded" });
    await page.setViewportSize({
        width: 1000,
        height: 1200,
        deviceScaleFactor: 1,
    });

    await page.waitForTimeout(4000); // Wait for 2 seconds

    await highlight_links(page);

    var link_text = 'sort by';

    try {
        const elements = await page.$$('[gpt-link-text]');

        let partial;
        let exact;

        for (const element of elements) {
            let attributeValue = await element.evaluate(element => element.getAttribute('gpt-link-text'));

            if (attributeValue && attributeValue.includes(link_text.toLowerCase())) {
                partial = element;
            }

            if (attributeValue === link_text) {
                exact = element;
            }
        }

        if (exact) {
            await exact.click();
        } else if (partial) {
            await partial.click();
        } else {
            throw new Error("Can't find link");
        }

        if(!isSelectTag(partial)){
            await page.waitForLoadState();
        } else {
            await highlight_links(page);
        }
        
        link_text = 'Price: High to Low';

        for (const element of elements) {
            let attributeValue = await element.evaluate(element => element.getAttribute('gpt-link-text'));

            if (attributeValue && attributeValue.includes(link_text.toLowerCase())) {
                partial = element;
            }

            if (attributeValue === link_text) {
                exact = element;
            }
        }

        if (exact) {
            await exact.click();
        } else if (partial) {
            await partial.click();
        } else {
            throw new Error("Can't find link");
        }

        

        await page.waitForLoadState();

        await highlight_links(page);

        await page.screenshot({
            path: "screenshot.jpg",
            quality: 100,
        });

        screenshot_taken = true;
    } catch (error) {
        console.log(`ERROR: Clicking failed. Error:${error.message}`);

    }
})();