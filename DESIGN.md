# Quản Lý Học Nhóm

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

Trang đăng nhập dùng tên Quản Lý Học Nhóm, số điện thoại/email admin, mật khẩu và liên hệ Zalo admin 0975 163 361. Phụ huynh được cấp mật khẩu lần đầu 12345678 và phải đổi trước khi vào lớp. Hồ sơ admin có thông tin cá nhân, đổi mật khẩu và lối vào quản lý lớp/phụ huynh. Lớp được chọn ở sidebar desktop hoặc tên lớp trong header mobile.

## Giao diện tiết chế

Hướng được chọn: nền trắng/xám sáng, xanh ngọc là màu nhấn chính; màu môn học xuất hiện nhẹ trên nền/viền thẻ chuyên đề, các buổi học thuộc chuyên đề đó, nhãn và dấu sự kiện lịch. Sidebar, header và thanh điều hướng mobile cùng nền xanh ngọc rất nhạt #edf5f1; menu đang chọn dùng sắc xanh rõ hơn. Thẻ lớp, số liệu, hồ sơ, lịch và form giữ nền trung tính, đường viền nhẹ; không chia màu theo trang hoặc theo thứ tự thẻ.

Người dùng là phụ huynh cần tìm nhanh lịch, chủ nhà, liên hệ và danh sách con trong lớp. Bản sắc sổ lớp học thể hiện qua tên lớp luôn hiện, lịch tháng cạnh buổi học, thời gian và chủ nhà trên thẻ, lịch sử từng buổi và nhãn môn học. Giữ Be Vietnam Pro để đọc tiếng Việt rõ; phân cấp bằng cỡ/độ đậm chữ, khoảng cách và nền sắc độ gần nhau.

Token chính: giấy trắng #ffffff, nền #f6f7f8, chữ #253b3b, chữ phụ #5e7070, đường viền #e2e7e6, xanh ngọc #18796b. Khoảng cách theo đơn vị 4px; thẻ 12px bo góc, nút/input 8px. Phân lớp bằng đường viền mảnh, bóng nhẹ chỉ khi hover hoặc cửa sổ nổi.

Tham khảo đã đọc:
- https://skills.sh/dammyjay93/interface-design/interface-design
- https://skills.sh/pbakaus/impeccable/quieter

Trang đăng nhập hiển thị ảnh THCS Tây Sơn do chủ dự án cung cấp: phía trên form trên cả desktop và mobile, cùng chiều rộng với form, giữ nguyên tỉ lệ và nội dung ảnh. Danh sách học sinh hiển thị tối đa hai phụ huynh đã kích hoạt, theo thứ tự khai báo, với tên hồ sơ, quan hệ và nút liên hệ riêng.

## Bảng màu tham khảo GreenEdu — 21/10/2026

Lấy màu từ src/garden.css, src/forest-theme.css và src/redesign.css của dự án SangKienKn; chỉ tham khảo, không thay đổi dự án đó. Xanh rêu #315d3e, xanh đậm #153f2c, nền kem #faf9f3, thẻ #fffefa, chữ #203f2c. Header/sidebar/mobile nav cùng màu xanh ô liu nhạt #eaf0df. Bốn màu phụ: lá #e8f4de, mật ong #fff1cf, trời #e5f3f8, hoa #f2eafa. Thống kê dùng nền lá/mật ong/đào/ô liu tương tự GreenEdu; chuyên đề vẫn giữ màu riêng, áp dụng nhẹ lên nền/viền và buổi học tương ứng. Giữ bố cục đăng nhập đã chọn, không sao chép bố cục/sidebar tối hoặc tài sản trường của GreenEdu.

Điều hướng bên trong dùng xanh rừng GreenEdu (#356044, #2c533c), nhãn sáng và mục đang chọn xanh lá nhạt. Thẻ nội dung, thống kê và lịch dùng nền sáng thống nhất; màu chuyên đề chỉ giữ ở nhãn/icon để giảm rối. Trang đăng nhập giữ nguyên.

Nút đóng hộp thoại có chữ Đóng và biểu tượng X, vùng bấm cao ít nhất 44px, cố định ở đầu hộp thoại khi cuộn.

Header dùng nền sáng khi có sidebar (từ 761px) hoặc màn hình nằm ngang; màn hình dọc nhỏ giữ header xanh. Nút đăng xuất trên header dùng biểu tượng, vùng bấm 44px và tên hỗ trợ Đăng xuất.

Danh sách học sinh: admin và tài khoản cùng chỉnh sửa có nút bản đồ bên cạnh Zalo, mở Google Maps theo địa chỉ học sinh. Mỗi học sinh có một nút, chỉ hiện khi có địa chỉ; tài khoản chỉ xem không có nút này.

Thông tin từng phụ huynh và nút gọi/Zalo nằm chung một hàng (tự xuống dòng trên màn hình hẹp), tránh tách các nút liên hệ khỏi cha/mẹ tương ứng.

Quyền danh sách học sinh: chỉ admin thêm/xóa/nhập và đổi liên kết phụ huynh. Mọi tài khoản phụ huynh sau kích hoạt được sửa tên, SĐT học sinh, địa chỉ và ghi chú của đúng các con có số phụ huynh trùng số đăng nhập. Ẩn nút sửa gia đình khác và toàn bộ nút xóa với phụ huynh. Máy chủ kiểm tra liên kết hiện tại, quyền lớp và revision ở PATCH /api/students; không cho phụ huynh đổi danh sách học sinh qua PUT state.

Tạo chuyên đề/nhóm: giữ biểu mẫu trong khi lưu, chỉ đóng sau khi máy chủ xác nhận thành công; thông báo ghi rõ tên vừa tạo. Tạo nhóm không tự mở lại popup chi tiết.

Vai trò học tập: admin gán Lớp Phó học tập 1/2 trong biểu mẫu sửa học sinh; mỗi vị trí chỉ có một em. Tài khoản liên kết với học sinh nhận quyền theo số phụ huynh. Hai lớp phó tạo/sửa chuyên đề, tạo nhóm và chuyển trưởng/phó nhóm. Nhóm có leaderId và deputyLeaderId, là hai thành viên khác nhau; trưởng/phó nhóm chỉ sửa nhóm mình, thành viên khác chỉ xem. Admin luôn có toàn quyền. Nhóm cũ chưa phân công được giữ nguyên để admin/lớp phó chọn người phụ trách.

SĐT của cả hai phụ huynh và địa chỉ đã khai báo luôn được chia sẻ trong lớp, kèm nút gọi/Zalo/bản đồ cho mọi tài khoản có quyền vào lớp; tên tài khoản phụ huynh vẫn chỉ hiển thị khi kích hoạt. Hồ sơ cá nhân có Thông tin gia đình theo từng con: hai SĐT chỉ đọc, địa chỉ sửa và lưu riêng qua PATCH students.
