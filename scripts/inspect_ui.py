from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path('artifacts')
out.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1060}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    page.screenshot(path=str(out / 'desktop.png'), full_page=True)
    print({'title': page.title(), 'headings': page.locator('h1,h2').all_text_contents(), 'buttons': page.get_by_role('button').all_text_contents(), 'errors': errors})
    page.set_viewport_size({'width': 390, 'height': 844})
    page.screenshot(path=str(out / 'mobile.png'), full_page=True)
    print({'mobile_overflow': page.evaluate('document.documentElement.scrollWidth > innerWidth')})
    browser.close()
