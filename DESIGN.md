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

Các khung dùng nền có sắc độ khác nhau: sidebar và hồ sơ xanh ngọc, header và đổi mật khẩu vàng kem, bảng học sinh xanh lam. Thẻ lớp xen các tông xanh ngọc/xanh lam/vàng để phân biệt; luôn có tên lớp và nhãn đang xem. Giữ màu môn học trên chuyên đề/nhóm/lịch.

## Màu sắc bổ sung

Mỗi trang có màu nhận diện trên tiêu đề, thanh công cụ và nút chính: tổng quan/lớp xanh ngọc, chuyên đề tím, nhóm cam, học sinh xanh lam, lịch hồng. Thanh điều hướng dùng cùng màu và nền đậm khi đang chọn. Các khung số liệu, lịch, hồ sơ, đổi mật khẩu và thẻ lớp dùng nền pastel rõ hơn; nội dung luôn có nhãn để không phụ thuộc riêng vào màu. Thẻ chuyên đề và buổi học giữ màu môn học trên toàn khung.
