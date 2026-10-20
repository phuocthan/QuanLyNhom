# Học Nhóm

Ứng dụng cho phụ huynh quản lý các nhóm học có thành viên thay đổi theo chuyên đề.

## Thiết kế

- Màu: xanh ngọc `#18796b`, xanh nhạt `#eaf5ee`, nền `#f6f8fa`, chữ `#243d42`, đường kẻ `#e6ecee`, vàng nhấn `#f4c66a`.
- Chữ: Be Vietnam Pro cho nội dung tiếng Việt, hệ thống sans-serif dự phòng. Tiêu đề 28–32px, nội dung 14px, nhãn 12px.
- Bố cục: điều hướng bên trái trên desktop, thanh điều hướng dưới trên mobile. Nội dung căn trái, lịch nhỏ bên phải và các buổi học ở trung tâm.
- Điểm riêng: sổ lớp học gần gũi, các chuyên đề mang màu môn học, thông tin chủ nhà và thời gian ưu tiên trên mỗi nhóm. Minh họa sách vở SVG nhỏ chỉ dùng ở phần chào.

```text
Điều hướng | Thanh tìm kiếm và lớp học
           | Tiêu đề + tạo chuyên đề
           | Lời chào, buổi học tiếp theo + minh họa sách vở
           | Số học sinh / chuyên đề / nhóm / buổi học
           | Buổi học sắp tới (2 cột) | Lịch tháng
           | Chuyên đề đang thực hiện | Hỗ trợ phụ huynh
```

Rà kế hoạch: tránh trang landing, tránh biểu đồ và ảnh trang trí không giúp quản lý học nhóm. Màu chuyên đề có ý nghĩa phân biệt môn; số liệu chỉ mô tả dữ liệu thực tế. Bản static cũ lưu localStorage. Bản Railway dùng đăng nhập và SQLite đồng bộ nhiều thiết bị; mỗi lớp có dữ liệu riêng và phụ huynh chỉ truy cập lớp được cấp. Có xuất/nhập JSON theo lớp.

## Skills đã tìm trên skills.sh

- https://skills.sh/vercel-labs/agent-skills/web-design-guidelines (đã có trong môi trường)
- https://skills.sh/anthropics/skills/webapp-testing (cài trong `.agents/skills/webapp-testing`)

Áp dụng biểu mẫu có nhãn, focus rõ, điều hướng bàn phím, thao tác cảm ứng, kiểm tra trình duyệt desktop/mobile và các luồng tạo, sửa, tìm, lưu dữ liệu.

## Tài khoản và nhiều lớp

Trang đăng nhập dùng tên Học Nhóm, số điện thoại/email admin, mật khẩu và liên hệ Zalo admin 0975 163 361. Phụ huynh được cấp mật khẩu lần đầu 12345678 và phải đổi trước khi vào lớp. Hồ sơ admin có thông tin cá nhân, đổi mật khẩu và lối vào quản lý lớp/phụ huynh. Lớp được chọn ở sidebar desktop hoặc tên lớp trong header mobile.

## Giao diện tiết chế

Hướng được chọn: nền trắng/xám sáng, xanh ngọc là màu nhấn chính; màu môn học chỉ hiện ở nhãn, biểu tượng chuyên đề và dấu sự kiện lịch. Menu dùng một trạng thái xanh ngọc nhạt khi đang chọn. Thẻ lớp, số liệu, hồ sơ, lịch và form giữ nền trung tính, đường viền nhẹ; không chia màu theo trang hoặc theo thứ tự thẻ.

Người dùng là phụ huynh cần tìm nhanh lịch, chủ nhà, liên hệ và danh sách con trong lớp. Bản sắc sổ lớp học thể hiện qua tên lớp luôn hiện, lịch tháng cạnh buổi học, thời gian và chủ nhà trên thẻ, lịch sử từng buổi và nhãn môn học. Giữ Be Vietnam Pro để đọc tiếng Việt rõ; phân cấp bằng cỡ/độ đậm chữ, khoảng cách và nền sắc độ gần nhau.

Token chính: giấy trắng #ffffff, nền #f6f7f8, chữ #253b3b, chữ phụ #5e7070, đường viền #e2e7e6, xanh ngọc #18796b. Khoảng cách theo đơn vị 4px; thẻ 12px bo góc, nút/input 8px. Phân lớp bằng đường viền mảnh, bóng nhẹ chỉ khi hover hoặc cửa sổ nổi.

Tham khảo đã đọc:
- https://skills.sh/dammyjay93/interface-design/interface-design
- https://skills.sh/pbakaus/impeccable/quieter
