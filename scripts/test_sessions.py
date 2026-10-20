"""Session continuation and CSV import acceptance tests against an isolated browser."""
import json
import subprocess
from datetime import date, timedelta
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE='http://localhost:5173'
KEY='cung-hoc-v1'
OUT=Path('artifacts')
seed=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import{createDemo}from'./dist/data.js';console.log(JSON.stringify(createDemo()))"],text=True,encoding='utf-8'))
for s in seed['students']:
    del s['address']
for g in seed['groups']:
    del g['sessionId'];del g['history']
old_date=(date.today()-timedelta(days=1)).isoformat()
new_date=(date.today()+timedelta(days=2)).isoformat()
later_date=(date.today()+timedelta(days=3)).isoformat()
seed['groups'][0]['date']=old_date
seed['groups'][0]['note']='Ghi chú cũ của buổi 1'

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1050},accept_downloads=True)
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE)
    page.evaluate('(d)=>localStorage.setItem("cung-hoc-v1",JSON.stringify(d))',seed)
    page.reload();page.wait_for_load_state('networkidle')
    expect(page.locator('.pending-sessions')).to_contain_text('Những nhà du hành')
    expect(page.locator('.pending-sessions')).to_contain_text('Chưa hoàn thành')
    page.locator('.pending-sessions').get_by_role('button',name='Xem nhóm',exact=True).click()
    expect(page.locator('#modal-title')).to_have_text('Những nhà du hành')
    page.get_by_role('button',name='Sửa ghi chú',exact=True).click()
    form=page.locator('#session-form')
    form.locator('[name=note]').fill('Ghi chú đã sửa của buổi 1')
    form.get_by_role('button',name='Lưu ghi chú',exact=True).click()
    expect(page.locator('.detail-note')).to_have_text('Ghi chú đã sửa của buổi 1')
    print('PASS legacy data migrates; expired groups remain active; direct note edit')

    page.get_by_role('button',name='Hẹn buổi tiếp theo',exact=True).click()
    form=page.locator('#session-form')
    expect(form.locator('[name=note]')).to_have_value('')
    form.locator('[name=date]').fill(new_date)
    form.locator('[name=start]').fill('19:00')
    form.locator('[name=end]').fill('18:00')
    form.get_by_role('button',name='Lưu buổi tiếp theo',exact=True).click()
    expect(form.locator('.form-error')).to_contain_text('Giờ kết thúc')
    form.locator('[name=end]').fill('20:30')
    form.locator('[name=note]').fill('Buổi 2: hoàn thiện mô hình')
    form.get_by_role('button',name='Lưu buổi tiếp theo',exact=True).click()
    expect(page.locator('.session-heading')).to_contain_text('Buổi 2')
    data=page.evaluate('JSON.parse(localStorage.getItem("cung-hoc-v1"))')
    g=data['groups'][0]
    assert len(g['history'])==1 and not g['done']
    assert g['history'][0]['date']==old_date and g['history'][0]['note']=='Ghi chú đã sửa của buổi 1'
    assert not g['history'][0]['done']
    page.get_by_role('button',name='Đổi lịch buổi này',exact=True).click()
    form=page.locator('#session-form')
    expect(form.locator('[name=note]')).to_have_value('Buổi 2: hoàn thiện mô hình')
    form.locator('[name=date]').fill(later_date)
    form.locator('[name=start]').fill('17:00')
    form.locator('[name=end]').fill('18:30')
    form.get_by_role('button',name='Lưu lịch học',exact=True).click()
    data=page.evaluate('JSON.parse(localStorage.getItem("cung-hoc-v1"))')
    assert len(data['groups'][0]['history'])==1 and data['groups'][0]['date']==later_date
    print('PASS next session archives original time/note; rescheduling edits current session only')

    page.get_by_role('button',name='Sửa ghi chú',exact=True).click()
    page.locator('#session-form [name=note]').fill('Ghi chú riêng mới nhất của buổi 2')
    page.get_by_role('button',name='Lưu ghi chú',exact=True).click()
    page.locator('.session-history-row').click()
    expect(page.locator('.detail-note')).to_have_text('Ghi chú đã sửa của buổi 1')
    expect(page.locator('.session-heading')).to_contain_text('Buổi 1')
    page.get_by_role('button',name='Về buổi hiện tại',exact=True).first.click()
    expect(page.locator('.detail-note')).to_have_text('Ghi chú riêng mới nhất của buổi 2')
    page.get_by_role('button',name='Hoàn thành',exact=True).click()
    expect(page.locator('.card-top .status')).to_contain_text('Đã hoàn thành')
    page.get_by_role('button',name='Mở lại',exact=True).click()
    expect(page.locator('.card-top .status')).to_contain_text('Đang tiếp tục')
    expect(page.get_by_role('button',name='Sửa ghi chú',exact=True)).to_be_in_viewport()
    data=page.evaluate('JSON.parse(localStorage.getItem("cung-hoc-v1"))')
    assert not data['groups'][0]['done']
    page.screenshot(path=str(OUT/'session-detail-desktop.png'))
    page.get_by_role('button',name='Đóng',exact=True).first.click()
    page.goto(BASE+'/#calendar?date='+old_date)
    old_card=page.locator('.day-agenda .session-card').filter(has_text='Những nhà du hành')
    old_card.get_by_role('button',name='Xem nhóm',exact=True).click()
    expect(page.locator('.session-heading')).to_contain_text('Buổi 1')
    expect(page.locator('.detail-note')).to_have_text('Ghi chú đã sửa của buổi 1')
    page.get_by_role('button',name='Đóng',exact=True).first.click()
    page.goto(BASE+'/#calendar?date='+later_date)
    expect(page.locator('.day-agenda')).to_contain_text('Những nhà du hành')
    page.reload();page.wait_for_load_state('networkidle')
    expect(page.locator('.day-agenda')).to_contain_text('Những nhà du hành')
    print('PASS manual complete/reopen, history view, old and rescheduled dates in calendar, persistence')

    page.goto(BASE+'/#students')
    page.get_by_role('button',name='Nhập CSV',exact=True).click()
    with page.expect_download() as download:
        page.get_by_role('link',name='Tải CSV mẫu 20 học sinh',exact=True).click()
    download.value.save_as(OUT/'csv-downloaded.csv')
    assert (OUT/'csv-downloaded.csv').read_bytes()==Path('dist/hoc-sinh-demo.csv').read_bytes()
    page.locator('#csv-file').set_input_files('dist/hoc-sinh-demo.csv')
    expect(page.locator('#csv-preview')).to_contain_text('0 học sinh mới · 20 học sinh sẽ cập nhật')
    assert len(page.evaluate('JSON.parse(localStorage.getItem("cung-hoc-v1")).students'))==20
    page.screenshot(path=str(OUT/'csv-import-desktop.png'))
    page.get_by_role('button',name='Nhập danh sách',exact=True).click()
    assert len(page.evaluate('JSON.parse(localStorage.getItem("cung-hoc-v1")).students'))==20
    page.locator('#list-search').fill('minh anh')
    expect(page.locator('.student-address')).to_contain_text('Nguyễn Văn Cừ')
    print('PASS downloadable CSV is exact file; confirmation preview; matching students update without duplicates')

    page.get_by_role('button',name='Nhập CSV',exact=True).click()
    page.locator('#csv-file').set_input_files({'name':'bad.csv','mimeType':'text/csv','buffer':'Tên HS,Tên PH\nAn,Bình'.encode('utf-8')})
    expect(page.locator('#csv-error')).to_contain_text('5 cột')
    expect(page.get_by_role('button',name='Nhập danh sách',exact=True)).to_be_disabled()
    value='\ufeffTên HS,Tên PH,Địa chỉ,SĐT HS,SĐT PH\r\n"An \"\"Hoa\"\"","Bình","Tầng 2, đường A",,0912345678\r\n'
    page.locator('#csv-file').set_input_files({'name':'new.csv','mimeType':'text/csv','buffer':value.encode('utf-8')})
    expect(page.locator('#csv-preview')).to_contain_text('1 học sinh mới · 0 học sinh sẽ cập nhật')
    page.get_by_role('button',name='Nhập danh sách',exact=True).click()
    page.locator('#list-search').fill('An "Hoa"')
    expect(page.locator('.student-address')).to_have_text('Tầng 2, đường A')
    assert len(page.evaluate('JSON.parse(localStorage.getItem("cung-hoc-v1")).students'))==21
    print('PASS malformed CSV blocked atomically; quoted names/addresses and blank student phone accepted')

    for width in [1440,768,390,320]:
        page.set_viewport_size({'width':width,'height':900})
        for route in ['overview','students','calendar']:
            page.goto(BASE+'/#'+route)
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'),f'{route} {width}'
        page.goto(BASE+'/#groups/g1')
        expect(page.locator('#modal-title')).to_have_text('Những nhà du hành')
        assert not page.evaluate('document.querySelector("dialog").scrollWidth>document.querySelector("dialog").clientWidth')
        if width==390:page.screenshot(path=str(OUT/'session-detail-mobile.png'))
        page.get_by_role('button',name='Hẹn buổi tiếp theo',exact=True).click()
        assert not page.evaluate('document.querySelector("dialog").scrollWidth>document.querySelector("dialog").clientWidth')
        page.get_by_role('button',name='Đóng',exact=True).first.click()
        page.goto(BASE+'/#students')
        page.get_by_role('button',name='Nhập CSV',exact=True).click()
        page.locator('#csv-file').set_input_files('dist/hoc-sinh-demo.csv')
        expect(page.locator('#csv-preview .csv-preview-table')).to_be_visible()
        assert not page.evaluate('document.querySelector("dialog").scrollWidth>document.querySelector("dialog").clientWidth')
        if width==390:page.screenshot(path=str(OUT/'csv-import-mobile.png'))
        page.get_by_role('button',name='Đóng',exact=True).first.click()
    assert not errors,errors
    print('PASS desktop/mobile layouts at 1440/768/390/320px, including session and CSV dialogs; no JS errors')
    browser.close()
