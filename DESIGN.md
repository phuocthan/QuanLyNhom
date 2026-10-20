# Cùng học

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

Rà kế hoạch: tránh trang landing, tránh biểu đồ và ảnh trang trí không giúp quản lý học nhóm. Màu chuyên đề có ý nghĩa phân biệt môn; số liệu chỉ mô tả dữ liệu thực tế. Bản giả lập lưu localStorage, có xuất/nhập JSON, không ngụ ý đồng bộ giữa phụ huynh hoặc thiết bị.

## Skills đã tìm trên skills.sh

- https://skills.sh/vercel-labs/agent-skills/web-design-guidelines (đã có trong môi trường)
- https://skills.sh/anthropics/skills/webapp-testing (cài trong `.agents/skills/webapp-testing`)

Áp dụng biểu mẫu có nhãn, focus rõ, điều hướng bàn phím, thao tác cảm ứng, kiểm tra trình duyệt desktop/mobile và các luồng tạo, sửa, tìm, lưu dữ liệu.
