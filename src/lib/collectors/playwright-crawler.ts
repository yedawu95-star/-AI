import { chromium, Browser } from 'playwright'

let _browser: Browser | null = null

export async function getBrowser(): Promise<Browser> {
  if (!_browser || !_browser.isConnected()) {
    _browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
  }
  return _browser
}

export async function closeBrowser() {
  if (_browser) {
    await _browser.close()
    _browser = null
  }
}

export type CrawledProduct = {
  product_name: string
  price: number | null
  rank: number
  image_url: string | null
  product_url: string | null
}

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9',
}
