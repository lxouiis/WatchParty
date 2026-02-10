import puppeteer, { Browser, Page } from 'puppeteer';

export class BrowserManager {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private isInitializing = false;

    async init() {
        if (this.browser || this.isInitializing) return;
        this.isInitializing = true;

        try {
            console.log("Initializing Puppeteer...");
            console.log("Executable Path:", puppeteer.executablePath());
            this.browser = await puppeteer.launch({
                headless: true, // Run headless for stability
                dumpio: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--window-size=1280,720',
                ],
                defaultViewport: { width: 1280, height: 720 }
            });
            console.log("Browser launched successfully.");

            const pages = await this.browser.pages();
            this.page = pages[0] || await this.browser.newPage();

            console.log("Navigating to default page...");
            await this.page.goto('https://www.google.com');
            console.log("Navigated to default page.");

        } catch (error: any) {
            console.error("Failed to launch browser:", error);
        } finally {
            this.isInitializing = false;
        }
    }

    async getScreenshotBuffer(): Promise<Buffer | null> {
        if (!this.page) return null;
        try {
            // Take screenshot as binary buffer (jpeg is faster)
            return await this.page.screenshot({ type: 'jpeg', quality: 70, encoding: 'binary' }) as Buffer;
        } catch (e) {
            console.error("Screenshot failed", e);
            return null;
        }
    }

    async navigate(url: string) {
        if (!this.page) return;
        try {
            await this.page.goto(url, { waitUntil: 'domcontentloaded' });
        } catch (e) {
            console.error("Navigation failed", e);
        }
    }

    async handleInput(type: string, data: any) {
        if (!this.page) return;

        try {
            switch (type) {
                case 'mousemove':
                    await this.page.mouse.move(data.x, data.y);
                    break;
                case 'mousedown':
                    await this.page.mouse.down();
                    break;
                case 'mouseup':
                    await this.page.mouse.up();
                    break;
                case 'click':
                    await this.page.mouse.click(data.x, data.y);
                    break;
                case 'keydown':
                    if (data.key) await this.page.keyboard.down(data.key);
                    break;
                case 'keyup':
                    if (data.key) await this.page.keyboard.up(data.key);
                    break;
                case 'keypress':
                    if (data.text) await this.page.keyboard.type(data.text);
                    break;
                case 'scroll':
                    await this.page.mouse.wheel({ deltaY: data.deltaY });
                    break;
            }
        } catch (e) {
            console.error("Input failed", e);
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
}

export const browserManager = new BrowserManager();
