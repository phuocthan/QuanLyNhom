# Cùng học

Ứng dụng web tiếng Việt dùng trên điện thoại và máy tính để phụ huynh quản lý việc học nhóm của con.

## Chạy trên máy

Yêu cầu Node.js 18 trở lên. Không cần cài thư viện cho ứng dụng.

```sh
npm run dev
```

Mở http://localhost:5173. `npm run check` kiểm tra cú pháp JavaScript. Mã ứng dụng nằm trong `dist/`, phục vụ trực tiếp, không cần build.

## Có thể làm gì?

- Quản lý tên học sinh, số điện thoại nếu có, tên phụ huynh, quan hệ và số điện thoại phụ huynh.
- Tạo, sửa, hoàn thành và xóa chuyên đề; mỗi chuyên đề có nhiều nhóm độc lập.
- Tìm tên có hoặc không dấu để chọn học sinh. Một học sinh có thể thuộc nhiều nhóm ở nhiều chuyên đề.
- Đặt ngày, giờ bắt đầu/kết thúc; cảnh báo khi một thành viên bị trùng giờ giữa các nhóm.
- Buổi học không tự hoàn thành khi hết giờ. Nhóm quá giờ vẫn xuất hiện trong “Đang tiếp tục” trên Tổng quan. Chỉ nút **Hoàn thành** mới kết thúc; **Mở lại** để tiếp tục.
- Trong **Xem nhóm**, chọn **Hẹn buổi tiếp theo** để nhập ngày, giờ và ghi chú mới. Buổi trước lưu riêng lịch, ghi chú, chủ nhà và thành viên trong lịch sử. **Đổi lịch buổi này** sửa ngày/giờ hiện tại mà không tạo thêm buổi. **Sửa ghi chú** chỉnh riêng nội dung của buổi đang xem.
- Chọn nhà một thành viên để tự điền phụ huynh; có thể nhập người liên hệ chủ nhà khác, số điện thoại, địa chỉ và ghi chú.
- Xem lịch tháng, danh sách buổi học theo ngày, nhóm và chủ nhà.
- Mở trình gọi qua `tel:`, mở liên hệ Zalo qua `zalo.me`, mở địa chỉ bằng Google Maps. Thiết bị, ứng dụng đã cài và quyền tìm kiếm của tài khoản Zalo quyết định việc mở liên hệ; ứng dụng web không tự khởi động cuộc gọi Zalo.
- Xuất/nhập bản sao JSON; xác nhận trước khi thay thế dữ liệu hoặc xóa chuyên đề/nhóm.
- Nhập danh sách lớp bằng CSV: **Tên HS, Tên PH, Địa chỉ, SĐT HS, SĐT PH**. Tải tệp mẫu 20 học sinh ở **Học sinh → Tải CSV mẫu** hoặc dùng `dist/hoc-sinh-demo.csv`. Chọn **Nhập CSV**, kiểm tra bản xem trước rồi xác nhận. Học sinh trùng cả tên và tên phụ huynh được cập nhật, học sinh khác được thêm mới; ô trống cũng ghi đè giá trị cũ. Mọi nhóm và lịch sử vẫn được giữ. Tệp thiếu cột, sai số điện thoại, trùng dòng hoặc sai định dạng được từ chối toàn bộ trước khi lưu.

CSV mẫu dùng UTF-8 BOM để giữ dấu tiếng Việt, số điện thoại được ghi dạng chuỗi có số 0 đầu. Khi sửa qua Excel, đặt cột điện thoại ở dạng Văn bản khi nhập dữ liệu; không để Excel tự chuyển thành số. Địa chỉ chứa dấu phẩy hoặc xuống dòng phải nằm trong dấu ngoặc kép theo chuẩn CSV. Trình nhập cũng hỗ trợ dấu chấm phẩy ngăn cột.

## Dữ liệu mẫu và lưu trữ

Lần mở đầu có 20 học sinh và 20 phụ huynh giả lập, 4 chuyên đề, 6 nhóm. Ngày học mẫu được tính từ ngày mở đầu. Tên, số và địa chỉ không phải danh bạ thật. Số bắt đầu bằng `000` được chặn thao tác liên hệ; thay bằng số thật để thử liên kết gọi/Zalo.

Đây là cơ sở dữ liệu giả lập bằng **localStorage** (`cung-hoc-v1`). Dữ liệu nằm trên trình duyệt/thiết bị hiện tại và giữ lại khi tải lại trang. Các tab cùng nguồn cập nhật dữ liệu qua sự kiện storage. Bản này chưa có cơ sở dữ liệu máy chủ, tài khoản phụ huynh hay đồng bộ nhiều thiết bị. Liên kết website mở cùng ứng dụng nhưng không chia sẻ các thay đổi localStorage. Muốn chuyển dữ liệu, dùng **Dữ liệu & cài đặt → Xuất bản sao/Nhập bản sao**.

## Kiểm thử

Kiểm thử giao diện bằng Python Playwright, theo skill `webapp-testing` được tìm trực tiếp trên skills.sh và cài tại `.agents/skills/webapp-testing`.

```sh
python -m pip install playwright
python -m playwright install chromium
# Khi npm run dev đang chạy:
python -u -X utf8 scripts/test_ui.py
node scripts/test_data.mjs
python -u -X utf8 scripts/test_sessions.py
```

15 nhóm kiểm tra: dữ liệu mẫu; tìm không dấu; tạo/sửa học sinh; liên kết điện thoại/Zalo; chuyên đề; tạo/sửa nhóm; chọn thành viên qua nhiều lượt tìm; tự điền chủ nhà; kiểm tra giờ và trùng lịch; lưu sau reload; cập nhật liên hệ chủ nhà; lịch tháng; tìm toàn cục; sao lưu/khôi phục; xác nhận xóa; giao diện mobile 390px; bàn phím và không có lỗi JavaScript. Tệp kết quả và ảnh màn hình ở `artifacts/` (không đưa vào Git).

Kiểm tra bổ sung: nâng cấp dữ liệu v1 cũ giữ nguyên học sinh/nhóm; nhóm quá giờ không tự hoàn thành; buổi tiếp theo giữ lịch sử; đổi lịch không tạo buổi thừa; ghi chú từng buổi độc lập; hoàn thành/mở lại; lịch cũ và mới; CSV UTF-8, số 0 đầu, ô trống, dấu phẩy/xuống dòng trong ngoặc kép, lỗi nhập và cập nhật không tạo bản trùng; giao diện 1440/768/390/320px. Bản sao JSON cũ vẫn được nhập và bổ sung các trường địa chỉ/lịch sử khi mở.

## Skills tham khảo

- [Web Design Guidelines](https://skills.sh/vercel-labs/agent-skills/web-design-guidelines): biểu mẫu, bàn phím, focus, nội dung và responsive.
- [Webapp Testing](https://skills.sh/anthropics/skills/webapp-testing): kiểm tra ứng dụng bằng trình duyệt thực.
- Frontend Design và Sites có sẵn trong môi trường: thiết kế và xuất bản riêng tư.

Quyết định giao diện được ghi trong `DESIGN.md`. Cấu hình xuất bản tĩnh nằm trong `.openai/hosting.json`.
