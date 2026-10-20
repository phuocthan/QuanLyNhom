# Triển khai Cùng học

## Cấu hình hiện tại

- GitHub: https://github.com/phuocthan/QuanLyNhom, nhánh `main`.
- Railway project: `b606b723-d173-4b4d-9b35-a29481545d39` (`zippy-insight`).
- Railway service: `1bb6b0a3-8e7c-4fb7-bc0e-0b80c9c5caf1` (`QuanLyNhom`), environment `production`.
- Volume: `49329e99-28e3-4ed4-a24b-7e35fc08c049`, mount `/data`, tách khỏi SangKienKn.
- Build: `Dockerfile`, Node 24, không có thư viện runtime cần cài.
- Start: `node server/index.mjs`; port8080, healthcheck `/api/health`, một replica, không cho hai deployment ghi SQLite cùng lúc.
- Website: https://quanlynhom-production.up.railway.app.

Các biến Railway được cấu hình riêng: `DATABASE_PATH=/data/cung-hoc.sqlite`, `NODE_ENV=production`, `PORT=8080`, `APP_PUBLIC_URL`, `SETUP_KEY`. Không ghi giá trị secret vào mã nguồn, đối số shell hoặc log. Database, WAL, `.env` và `.local` đều bị loại khỏi Git và Docker image.

## Tài khoản

Liên kết tạo quản trị đầu tiên nằm trong `.local/thiet-lap-tai-khoan.html` trên máy của chủ dự án. Không chia sẻ tệp này. Người dùng tự đặt tên, email và mật khẩu ít nhất12 ký tự. Sau khi đã có quản trị, endpoint thiết lập khóa lại.

Quản trị tạo tài khoản phụ huynh tại Cài đặt → Quản lý tài khoản phụ huynh. Hai quyền: chỉ xem hoặc cùng chỉnh sửa. Không mở đăng ký công khai. Mật khẩu băm bằng scrypt; cookie phiên HttpOnly, SameSite, Secure ở production; server kiểm tra phiên, Origin và CSRF trước khi ghi.

## Dữ liệu

Các bảng: `students`, `topics`, `study_groups`, `group_members`, `study_sessions`, `classroom`, `users`, `auth_sessions`, `schema_migrations`, `audit_log`.

Migration bổ sung schema, không reset dữ liệu. Database mới rỗng, không tự seed demo trên production. API dùng transaction và revision: nếu một thiết bị đã lưu trước, thiết bị còn lại nhận xung đột, giữ bản tạm trong tab để xuất JSON hoặc tải dữ liệu mới. Chỉ báo lưu thành công sau phản hồi server. Khi mất mạng có nút thử lại; đóng tab khi chưa lưu sẽ cảnh báo.

Trang kiểm tra cập nhật mỗi15 giây khi không mở biểu mẫu/đang nhập. Các thiết bị dùng cùng tài khoản hoặc tài khoản phụ huynh được cấp sẽ đọc chung dữ liệu.

## Chuyển bản cũ

1. Mở https://cung-hoc-nhom-lop.than-sata.chatgpt.site trên đúng trình duyệt đã nhập dữ liệu.
2. Cài đặt → Xuất bản sao JSON.
3. Đăng nhập bản Railway → Cài đặt → Nhập bản sao, kiểm tra và xác nhận.

Trình duyệt không cho đọc localStorage khác tên miền. CSV chỉ chuyển học sinh; JSON giữ đủ chuyên đề, nhóm và lịch sử. Bản server không tự tải dữ liệu trình duyệt lên.

## Kiểm tra trước phát hành

Chạy `npm run check`, `npm test`, `node scripts/test_data.mjs` và kiểm thử trình duyệt trên database tạm riêng. Không chạy seed/E2E trên Railway. Push nhánh main cho Railway nhận mã; chỉ báo đã phát hành khi deployment thành công và healthcheck xác nhận. Sao lưu dữ liệu bằng JSON trong Cài đặt; bản sao file SQLite cần dùng SQLite backup nhất quán để giữ cả WAL.

Chạy local bằng `npm run dev` với database `.local/cung-hoc.sqlite`; đây là dữ liệu riêng, không phải database Railway. `.openai/hosting.json` thuộc bản static ChatGPT Sites cũ; Railway dùng Dockerfile.

`scripts/test_cloud_ui.py` kiểm tra đăng nhập, lưu CSV vào database, hai trình duyệt, quyền chỉ xem, xung đột revision và giao diện gọn tại1440/768/390/320px. Chỉ chạy với server local ở cổng5188 và `DATABASE_PATH` trỏ đến tệp thử mới. Các bộ `scripts/test_ui.py` và `scripts/test_sessions.py` kiểm tra tương thích bản static tại5173.
