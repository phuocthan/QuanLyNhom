"""Run only against an isolated local SQLite server, never against Railway."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE='http://127.0.0.1:5188'
OUT=Path('artifacts');OUT.mkdir(exist_ok=True)
PASSWORD='Isolated-browser-test-password-123'

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    a=browser.new_context(viewport={'width':1440,'height':1050})
    page=a.new_page();errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(BASE);page.wait_for_load_state('networkidle')
    print('Auth headings:',page.locator('h1').all_text_contents())
    expect(page.get_by_role('heading',name='Tạo tài khoản quản trị')).to_be_visible()
    page.locator('#auth-name').fill('Phụ huynh thử nghiệm')
    page.locator('#auth-email').fill('owner@example.test')
    page.locator('#auth-password').fill(PASSWORD)
    page.get_by_role('button',name='Tạo tài khoản & bắt đầu').click()
    expect(page.get_by_role('heading',name='Tổng quan',exact=True)).to_be_visible()
    expect(page.locator('#top-class')).to_have_text('Lớp 7/14')
    expect(page.locator('#top-school')).to_have_text('THCS Tây Sơn - Đà Nẵng')
    text=page.locator('body').inner_text()
    for removed in ['Không gian lớp học','Mỗi kết nối, thêm gần gũi','Kết nối những buổi học ý nghĩa','Học cùng bạn,','Dữ liệu mẫu để trải nghiệm.']:
        assert removed not in text,removed
    assert page.locator('.app-footer,.parent-tip,.sidebar-note').count()==0
    print('PASS setup/login, private blank database, class/school and removed content')

    page.goto(BASE+'/#students')
    page.get_by_role('button',name='Nhập CSV',exact=True).click()
    page.locator('#csv-file').set_input_files('dist/hoc-sinh-demo.csv')
    page.get_by_role('button',name='Nhập danh sách',exact=True).click()
    expect(page.locator('.local-indicator')).to_contain_text('Đã đồng bộ')
    expect(page.locator('.students-table tbody tr')).to_have_count(20)
    assert page.evaluate('localStorage.getItem("cung-hoc-v1")') is None
    page.reload();page.wait_for_load_state('networkidle')
    expect(page.locator('.students-table tbody tr')).to_have_count(20)
    page.get_by_role('button',name='Dữ liệu & cài đặt',exact=True).click()
    page.get_by_role('button',name='Quản lý tài khoản phụ huynh',exact=True).click()
    form=page.locator('#user-form')
    form.locator('[name=name]').fill('Phụ huynh xem')
    form.locator('[name=email]').fill('parent@example.test')
    form.locator('[name=password]').fill(PASSWORD)
    form.locator('[name=role]').select_option('viewer')
    form.get_by_role('button',name='Tạo tài khoản',exact=True).click()
    expect(page.locator('.account-list')).to_contain_text('parent@example.test')
    page.get_by_role('button',name='Đóng',exact=True).first.click()
    print('PASS CSV persists in SQLite without localStorage; parent account creation')

    b=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    other=b.new_page();other.on('pageerror',lambda error:errors.append(str(error)))
    other.goto(BASE);other.wait_for_load_state('networkidle')
    other.locator('#auth-email').fill('parent@example.test')
    other.locator('#auth-password').fill(PASSWORD)
    other.get_by_role('button',name='Đăng nhập',exact=True).click()
    expect(other.get_by_role('heading',name='Tổng quan',exact=True)).to_be_visible()
    other.goto(BASE+'/#students')
    expect(other.locator('.students-table tbody tr')).to_have_count(20)
    other.get_by_role('button',name='Thêm học sinh',exact=True).click()
    expect(other.locator('#toast')).to_contain_text('chỉ có quyền xem')
    expect(other.locator('#student-form')).to_have_count(0)
    other.screenshot(path=str(OUT/'cloud-students-mobile.png'),full_page=True)
    assert not other.evaluate('document.documentElement.scrollWidth>innerWidth')
    print('PASS second browser reads same database; viewer cannot edit; mobile layout')

    # Independent owner login loads revision N. A changes the class; B then attempts stale revision N.
    c=browser.new_context(viewport={'width':1440,'height':1000});stale=c.new_page()
    stale.goto(BASE);stale.locator('#auth-email').fill('owner@example.test');stale.locator('#auth-password').fill(PASSWORD);stale.get_by_role('button',name='Đăng nhập',exact=True).click()
    expect(stale.get_by_role('heading',name='Tổng quan',exact=True)).to_be_visible()
    stale.get_by_role('button',name='Dữ liệu & cài đặt',exact=True).click()
    stale.locator('#f-className').fill('Lớp sửa trên thiết bị cũ')
    page.get_by_role('button',name='Dữ liệu & cài đặt',exact=True).click()
    page.locator('#f-schoolName').fill('THCS Tây Sơn - Đà Nẵng')
    page.locator('#class-form').get_by_role('button',name='Lưu',exact=True).click()
    expect(page.locator('.local-indicator')).to_contain_text('Đã đồng bộ')
    stale.locator('#class-form').get_by_role('button',name='Lưu',exact=True).click()
    expect(stale.locator('#modal-title')).to_have_text('Dữ liệu đã thay đổi')
    stale.get_by_role('button',name='Tải dữ liệu mới',exact=True).click()
    expect(stale.locator('#top-class')).to_have_text('Lớp 7/14')
    print('PASS concurrent edits detect revision conflicts and preserve latest server data')

    page.get_by_role('button',name='Đóng',exact=True).first.click()
    page.goto(BASE+'/#overview')
    for width in [1440,768,390,320]:
        page.set_viewport_size({'width':width,'height':900})
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),width
        expect(page.locator('#top-school')).to_be_visible()
        page.screenshot(path=str(OUT/f'cloud-overview-{width}.png'),full_page=True)
    assert not errors,errors
    print('PASS compact school header across 1440/768/390/320px; no uncaught JS errors')
    browser.close()
