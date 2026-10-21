# Quản Lý Học Nhóm

Ứng dụng web tiếng Việt quản lý nhiều lớp và nhóm học trên điện thoại, máy tính. Lớp hiện có **7/14, THCS Tây Sơn - Đà Nẵng** được giữ nguyên khi nâng cấp.

Bản chính dùng **Node.js 24 + SQLite riêng trên Railway**, có đăng nhập và đồng bộ nhiều thiết bị. Hướng dẫn triển khai, tài khoản và chuyển dữ liệu cũ: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Chạy trên máy

Yêu cầu Node.js 24 trở lên. Không cần cài thư viện runtime: backend dùng HTTP, crypto và SQLite tích hợp trong Node.

```sh
npm run dev
```

Mở http://localhost:5173 và tạo tài khoản quản trị lần đầu. Database local ở `.local/cung-hoc.sqlite`, tách biệt với Railway. `npm start` chạy server thông thường; `npm run check` kiểm tra cú pháp, `npm test` kiểm thử API/database. `npm run dev:static` chỉ chạy bản localStorage cũ.

## Tài khoản và lớp học

- Admin đăng nhập bằng email; vào **Hồ sơ admin** để cập nhật tên, email, số điện thoại hoặc đổi mật khẩu. Sau khi lưu số điện thoại, admin cũng có thể đăng nhập bằng số đó.
- **Quản lý lớp → Thêm lớp** tạo lớp rỗng, có danh sách học sinh, chuyên đề, nhóm và lịch riêng. Chọn lớp ở thanh bên hoặc nhấn tên lớp trên đầu trang điện thoại. Thêm học sinh thủ công hoặc nhập CSV trong lớp đã chọn.
- **Hồ sơ admin → Quản lý phụ huynh** để thêm phụ huynh, chọn các lớp được truy cập và quyền chỉ xem/cùng chỉnh sửa. **Cấp tài khoản từ danh sách lớp** đọc số điện thoại phụ huynh trong danh sách học sinh, bỏ qua số trống/sai/số giả lập. Trùng số đã có thì cấp thêm lớp và giữ nguyên mật khẩu.
- Phụ huynh đăng nhập bằng số điện thoại (hỗ trợ chuẩn hóa +84), mật khẩu đầu tiên **12345678**. Bắt buộc đổi sang mật khẩu riêng ít nhất 8 ký tự trước khi đọc hoặc sửa dữ liệu; tải lại trang vẫn phải đổi. Admin có thể đặt lại mật khẩu, thao tác này kết thúc mọi phiên của phụ huynh.
- Admin toàn quyền trên mọi lớp. Phụ huynh chỉ vào được lớp đã cấp; quyền chỉnh sửa không bao gồm quản lý tài khoản, tạo lớp hoặc đổi tên lớp/trường. Quyền xem/chỉnh sửa áp dụng cho tất cả lớp đã cấp của một tài khoản.
- Trang đăng nhập có liên hệ [Zalo admin · 0975 163 361](https://zalo.me/0975163361).
- Tài khoản email cũ và phiên đăng nhập được giữ khi migration; tài khoản phụ huynh mới dùng số điện thoại. Bản static cũ chỉ phục vụ xuất dữ liệu, không có quản lý nhiều lớp/tài khoản.

## Hai phụ huynh cho một học sinh

Admin mở Học sinh → Sửa, nhập tối đa hai số ở Phụ huynh 1/Phụ huynh 2, tên và quan hệ. Có thể bỏ trống tên phụ huynh khi chưa có; số đăng nhập không được trùng nhau. Sau đó dùng Hồ sơ admin → Quản lý phụ huynh → Cấp tài khoản từ danh sách lớp để cấp cho cả hai số. Cũng có thể tạo tài khoản từng người bằng đúng số đã khai báo.

Chỉ khi tài khoản đăng nhập và đổi mật khẩu mặc định, tên trong hồ sơ tài khoản cùng số điện thoại mới hiển thị cạnh học sinh, trong thành viên nhóm và lựa chọn chủ nhà. Mỗi phụ huynh kích hoạt độc lập; một số có thể liên kết nhiều con. Cần quyền vào đúng lớp. Đặt lại mật khẩu sẽ ẩn liên kết cho đến khi phụ huynh đổi lại mật khẩu. Liên kết cập nhật tối đa sau 15 giây khi không mở biểu mẫu.

CSV cũ 5 cột vẫn dùng được. Có thể thêm Tên PH 2, SĐT PH 2, Quan hệ PH 1, Quan hệ PH 2. Tiêu đề Số Điện Thoại Phụ Huynh 1/2 cũng được nhận diện. Nếu CSV không có cột phụ huynh 2 thì giữ dữ liệu thứ hai đã lưu. Bản JSON giữ đủ hai phụ huynh.

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

Bản server mới khởi tạo lớp rỗng; chỉ nạp CSV, JSON hoặc dữ liệu mẫu khi người quản trị chọn. Bộ mẫu gồm 20 học sinh và phụ huynh, 4 chuyên đề, 6 nhóm. Số bắt đầu `000` bị chặn gọi/Zalo.

SQLite trên Railway lưu tại `/data/cung-hoc.sqlite`, thuộc volume riêng. Các thiết bị đăng nhập đọc chung database; API kiểm tra revision và từ chối ghi đè dữ liệu mới từ thiết bị khác. Bản ChatGPT Sites cũ vẫn giữ localStorage để xuất dữ liệu: chọn **Xuất bản sao** ở bản cũ rồi **Nhập bản sao** ở bản Railway. Không thể tự đọc localStorage khác tên miền. Dùng JSON để giữ cả chuyên đề, nhóm và lịch sử; CSV chỉ chuyển danh sách học sinh.

## Kiểm thử

Kiểm tra tài khoản/nhiều lớp bằng `npm test`; kiểm tra trình duyệt bằng `node scripts/test_accounts_ui.mjs` (cần Playwright và Chromium, có thể đặt `PLAYWRIGHT_CHANNEL=msedge` và `PLAYWRIGHT_MODULE` là đường dẫn module). Script tự chạy server với SQLite trong bộ nhớ, không truy cập Railway. Bao gồm tạo lớp, nhập CSV, cấp phụ huynh, đổi mật khẩu bắt buộc, profile, đăng nhập lại và giao diện 1440/768/390/320px.

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
