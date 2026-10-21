# Triển khai Quản Lý Học Nhóm

## Cấu hình hiện tại

- GitHub: https://github.com/phuocthan/QuanLyNhom, nhánh `main`.
- Railway project: `b606b723-d173-4b4d-9b35-a29481545d39` (`zippy-insight`).
- Railway service: `1bb6b0a3-8e7c-4fb7-bc0e-0b80c9c5caf1` (`QuanLyNhom`), environment `production`.
- Volume: `49329e99-28e3-4ed4-a24b-7e35fc08c049`, mount `/data`, tách khỏi SangKienKn.
- Build: `Dockerfile`, Node 24, không có thư viện runtime cần cài.
- Start: `node server/index.mjs`; port8080, healthcheck `/api/health`, một replica, không cho hai deployment ghi SQLite cùng lúc.
- Website: https://hoc-nhom.up.railway.app.

Đặt `APP_PUBLIC_URL=https://hoc-nhom.up.railway.app` khớp tên miền người dùng truy cập để tránh lỗi kiểm tra Origin. Nếu không đặt, server dùng `RAILWAY_PUBLIC_DOMAIN` của Railway; vẫn kiểm tra cùng nguồn và CSRF.

Các biến Railway được cấu hình riêng: `DATABASE_PATH=/data/cung-hoc.sqlite`, `NODE_ENV=production`, `PORT=8080`, `APP_PUBLIC_URL`, `SETUP_KEY`. Không ghi giá trị secret vào mã nguồn, đối số shell hoặc log. Database, WAL, `.env` và `.local` đều bị loại khỏi Git và Docker image.

## Tài khoản

Tạo quản trị lần đầu bằng mã từ biến Railway `SETUP_KEY`; nếu còn tệp `.local/thiet-lap-tai-khoan.html` trên máy triển khai cũ thì có thể dùng liên kết riêng trong đó. Không chia sẻ mã/tệp này. Người dùng tự đặt tên, email và mật khẩu ít nhất 12 ký tự. Sau khi đã có quản trị, endpoint thiết lập khóa lại.

Admin quản lý nhiều lớp tại **Quản lý lớp** và cập nhật thông tin cá nhân tại **Hồ sơ admin**. Admin tạo tài khoản phụ huynh ở Hồ sơ admin → Quản lý phụ huynh (hoặc Cài đặt → Quản lý tài khoản phụ huynh). Chọn lớp được truy cập và quyền chỉ xem hoặc cùng chỉnh sửa. Phụ huynh đăng nhập bằng số điện thoại, mật khẩu mặc định `12345678`; server chặn đọc/ghi dữ liệu cho đến khi đổi mật khẩu riêng ít nhất 8 ký tự. Admin có thể cấp hàng loạt từ danh sách học sinh hoặc đặt lại mật khẩu phụ huynh. Đổi/đặt lại mật khẩu kết thúc các phiên cũ. Không mở đăng ký công khai. Mật khẩu băm bằng scrypt; cookie phiên HttpOnly, SameSite, Secure ở production; server kiểm tra phiên, Origin và CSRF trước khi ghi.

## Dữ liệu

Các bảng: `students`, `topics`, `study_groups`, `group_members`, `study_sessions`, `classroom`, `users`, `auth_sessions`, `schema_migrations`, `audit_log`, `class_spaces`, `class_access`. Migration v3 bổ sung số điện thoại, cờ bắt buộc đổi mật khẩu và quyền lớp. Migration v5 bổ sung học sinh còn thiếu từ các tài khoản đơn lẻ đã tạo trước bản sửa; chỉ chạy một lần để không khôi phục học sinh được chủ động xóa về sau. Tạo tài khoản và cập nhật danh sách học sinh dùng chung transaction; revision được tăng để ngăn thiết bị cũ ghi đè. Migration v4 thêm họ tên học sinh, họ tên phụ huynh và mối quan hệ vào tài khoản; giữ nguyên mật khẩu, phiên đăng nhập và quyền lớp hiện có. Lớp cũ giữ các bảng hiện có với ID `default`; lớp mới lưu state JSON và revision riêng trong `class_spaces`. API kiểm tra quyền lớp ở server trước khi đọc/ghi. Tài khoản email và phiên cũ được giữ; phụ huynh cũ được cấp lớp `default`, không bị đặt lại mật khẩu.

Migration bổ sung schema, không reset dữ liệu. Database mới rỗng, không tự seed demo trên production. API dùng transaction và revision: nếu một thiết bị đã lưu trước, thiết bị còn lại nhận xung đột, giữ bản tạm trong tab để xuất JSON hoặc tải dữ liệu mới. Chỉ báo lưu thành công sau phản hồi server. Khi mất mạng có nút thử lại; đóng tab khi chưa lưu sẽ cảnh báo.

Trang kiểm tra cập nhật mỗi15 giây khi không mở biểu mẫu/đang nhập. Các thiết bị dùng cùng tài khoản hoặc tài khoản phụ huynh được cấp sẽ đọc chung dữ liệu.

## Chuyển bản cũ

1. Mở https://cung-hoc-nhom-lop.than-sata.chatgpt.site trên đúng trình duyệt đã nhập dữ liệu.
2. Cài đặt → Xuất bản sao JSON.
3. Đăng nhập bản Railway → Cài đặt → Nhập bản sao, kiểm tra và xác nhận.

Trình duyệt không cho đọc localStorage khác tên miền. CSV chỉ chuyển học sinh; JSON giữ đủ chuyên đề, nhóm và lịch sử. Bản server không tự tải dữ liệu trình duyệt lên.

## Kiểm tra trước phát hành

Chạy `npm run check`, `npm test`, `node scripts/test_data.mjs` và kiểm thử trình duyệt trên database tạm riêng. Không chạy seed/E2E trên Railway. Push nhánh main cho Railway nhận mã; chỉ báo đã phát hành khi deployment thành công và healthcheck xác nhận. Sao lưu JSON trong Cài đặt cho từng lớp (không gồm tài khoản/phân quyền); bản sao file SQLite cần dùng SQLite backup nhất quán để giữ cả WAL.

Chạy local bằng `npm run dev` với database `.local/cung-hoc.sqlite`; đây là dữ liệu riêng, không phải database Railway. `.openai/hosting.json` thuộc bản static ChatGPT Sites cũ; Railway dùng Dockerfile.

`scripts/test_cloud_ui.py` kiểm tra đăng nhập, lưu CSV vào database, hai trình duyệt, quyền chỉ xem, xung đột revision và giao diện gọn tại1440/768/390/320px. Chỉ chạy với server local ở cổng5188 và `DATABASE_PATH` trỏ đến tệp thử mới. Các bộ `scripts/test_ui.py` và `scripts/test_sessions.py` kiểm tra tương thích bản static tại5173.

Kiểm tra bổ sung `node scripts/test_accounts_ui.mjs`: server tự tạo SQLite trong bộ nhớ và port tạm, kiểm thử luồng admin/nhiều lớp/CSV/phụ huynh/đổi mật khẩu và responsive. `PLAYWRIGHT_CHANNEL` có thể chọn trình duyệt đã cài; `PLAYWRIGHT_MODULE` có thể trỏ tới module Playwright ngoài dự án.

Migration v6 bổ sung users.parent_activated_at, không xóa/reset dữ liệu. Tài khoản phụ huynh theo số điện thoại đã đổi mật khẩu trước nâng cấp được giữ trạng thái kích hoạt. API /api/parent-links?classId=... chỉ trả tối đa hai phụ huynh đã kích hoạt và có quyền vào lớp; trạng thái này không lưu trong JSON lớp và không phụ thuộc revision lớp. Hai liên hệ học sinh lưu ở parent/parentPhone/relation và parent2/parentPhone2/relation2. Chỉ admin được đổi số liên kết.

Trang đăng nhập dùng ảnh trường trong dist/tay-son-school.png.
