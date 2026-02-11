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
                    '--window-size=1024,576',
                ],
                defaultViewport: { width: 1024, height: 576 }
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

    async startScreencast(callback: (buffer: Buffer) => void) {
        if (!this.page) return;

        try {
            const client = await this.page.createCDPSession();

            await client.send('Page.startScreencast', {
                format: 'jpeg',
                quality: 60,
                maxWidth: 1024,
                maxHeight: 576,
                everyNthFrame: 1
            });

            client.on('Page.screencastFrame', async (frame) => {
                const { data, sessionId } = frame;
                try {
                    await client.send('Page.screencastFrameAck', { sessionId });
                    const buffer = Buffer.from(data, 'base64');
                    callback(buffer);
                } catch (e) {
                    console.error("Frame ack failed", e);
                }
            });

            console.log("CDP Screencast started.");
        } catch (e) {
            console.error("Failed to start screencast", e);
        }
    }

    async stopScreencast() {
        if (!this.page) return;
        try {
            const client = await this.page.createCDPSession();
            await client.send('Page.stopScreencast');
        } catch (e) { }
    }

    // Deprecated: Old polling method (kept for fallback if needed, but unused)
    async getScreenshotBuffer(): Promise<Buffer | null> {
        return null;
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
        await this.stopScreencast();
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
}

export const browserManager = new BrowserManager();
