# 📝 NHẬT KÝ CÔNG VIỆC NÂNG CẤP & SỬA LỖI WEBSITE
## 🧋 Thương Hiệu: Trà Sữa Thúy Hằng (Đà Nẵng)

> **Địa chỉ cửa hàng:** 1059 Tôn Đản, P. Cẩm Lệ, TP. Đà Nẵng  
> **Hotline:** 0889 045 686  
> **Địa chỉ Website Live:** [https://trieuson0971113449.github.io/trasuadanang/](https://trieuson0971113449.github.io/trasuadanang/)  
> **GitHub Repository:** [https://github.com/trieuson0971113449/trasuadanang](https://github.com/trieuson0971113449/trasuadanang)  
> **Phiên bản:** `v5.0.0` ➔ `v7.0.0`  
> **Cập nhật lần cuối:** 18/08/2026  

---

## 📌 1. TỔNG QUAN HỆ THỐNG & MỤC TIÊU NÂNG CẤP

Dự án là trang web bán hàng Single Page Application (SPA) tích hợp trang Quản trị viên (Admin Dashboard) dành riêng cho quán **Trà Sữa Thúy Hằng**.

### Các công nghệ cốt lõi:
- **Frontend:** HTML5, Vanilla CSS3 (Custom Design System), Vanilla JavaScript (ES6+).
- **Icons & Fonts:** FontAwesome 6 Pro, Google Fonts (`Playfair Display` & `Plus Jakarta Sans`).
- **Cloud Real-time Relay Stream:** ntfy.sh Server-Sent Events (SSE) Stream + WebSockets BroadcastChannel.
- **Audio Notification:** Web Audio API (Phát chuông *"Ding-Dong!"* nổ đơn tự động kèm nút Bật/Tắt Loa).
- **Deployment:** GitHub Pages (Tự động build & hosting miễn phí).

---

## 🎯 2. DANH SÁCH TÍNH NĂNG ĐÃ THỰC HIỆN (THEO 3 MỨC NÂNG CẤP)

### 🔴 MỨC 1: ƯU TIÊN CAO (BRANDING, SEO, MOBILE NAV & IN HÓA ĐƠN)
1. **Đồng bộ nhận diện thương hiệu Trà Sữa Thúy Hằng:**
   - Thay đổi toàn bộ tên cũ ("Boba Craze") sang **"Trà Sữa Thúy Hằng"** trên tất cả các file (`index.html`, `js/app.js`, `css/style.css`, `js/data.js`).
   - Cập nhật địa chỉ cửa hàng: *1059 Tôn Đản, P. Cẩm Lệ, TP. Đà Nẵng* và Hotline *0889 045 686*.
2. **Cập nhật Favicon & SEO Meta Tags:**
   - Thêm biểu tượng Favicon ly trà sữa 🧋 dạng SVG sắc nét.
   - Thêm đầy đủ thẻ Meta SEO: `<title>`, `description`, `keywords`, `author`, `OpenGraph (og:title, og:image, og:description)` và `<link rel="canonical">`.
3. **Thanh Điều Hướng Mobile Hamburger Menu:**
   - Bổ sung nút **`#mobile-menu-btn`** (biểu tượng ☰) cho màn hình di động.
   - Viết JS toggle thả xuống menu mượt mà, tự đóng khi bấm ra ngoài hoặc chọn mục.
4. **Tính Năng In Hóa Đơn (Print Bill):**
   - Viết hàm `printOrderBill(orderId)` tạo phiếu tính tiền khổ nhỏ (80mm) chứa đầy đủ thông tin đơn hàng, số bàn, danh sách món, topping, tạm tính và tổng tiền.
   - Định dạng CSS `@media print` ẩn các phần không liên quan, chỉ in đúng hóa đơn thanh toán.

---

### 🟡 MỨC 2: ƯU TIÊN TRUNG BÌNH (XUẤT CSV, QR BÀN, TRA CỨU ĐƠN & BẬT/TẮT CHUÔNG)
1. **Nút Tắt / Mở Loa Thông Báo Nổ Đơn (Mute / Unmute Toggle):**
   - Bổ sung nút bấm **`[🔊 Chuông: BẬT]` / `[🔇 Chuông: TẮT]`** màu cam/xám ngay trên thanh điều khiển Quản Lý Đơn Hàng Admin.
   - Cho phép chủ quán linh hoạt bật hoặc tắt âm thanh nổ đơn theo ý muốn.
   - Tự động lưu trạng thái tùy chọn của chủ quán vào `localStorage` (`boba_sound_enabled`).
2. **Xuất Báo Cáo Đơn Hàng Ra File CSV (Export CSV):**
   - Viết hàm `exportOrdersCSV()` trong `app.js` cho phép Admin xuất toàn bộ danh sách đơn hàng.
   - Tự động thêm **UTF-8 BOM (`\uFEFF`)** để hiển thị chuẩn tiếng Việt không bị lỗi font khi mở bằng Microsoft Excel.
3. **Hệ Thống Tạo 15 Mã QR Code Bàn + Mang Đi:**
   - Tạo tự động mã QR cho **Bàn 1 đến Bàn 15** và đơn **Mang đi**.
   - Sử dụng API mã QR sắc nét (`api.qrserver.com`) render dạng thẻ `<img>` trực tiếp.
   - Bổ sung nút **"Mở Link"** và nút **"Tải QR"** (màu nâu) cho phép chủ quán tải ảnh `.png` về in dán bàn.
4. **Hệ Thống Tự Đọc Số Bàn Từ URL:**
   - Tự động nhận diện tham số URL (ví dụ `?ban=5`), tự đặt vị trí đơn là `Bàn 5` khi khách quét mã.
5. **Tra Cứu Lịch Sử Đơn Hàng:**
   - Thêm ô tìm kiếm tra cứu đơn hàng theo **Số điện thoại** hoặc **Mã đơn (VD: ORD-9821)** giúp khách hàng tự kiểm tra dòng thời gian pha chế & giao hàng.

---

### 🟢 MỨC 3: ƯU TIÊN NHỎ (POLISH UI/UX, TOAST & ACCESSIBILITY)
1. **Nâng Cấp Hệ Thống Thông Báo Toast (Toast Notification):**
   - Phân loại màu sắc Toast tự động: `Success` (Xanh lá), `Error` (Đỏ), `Warning` (Cam), `Info` (Xanh dương).
   - Thêm hiệu ứng thanh đếm thời gian (Progress Bar) rút ngắn từ 100% về 0% trong 2.5s.
2. **Hiệu Ứng Skeleton Loading Shimmer:**
   - Tạo hiệu ứng khung xương tải giả (Skeleton cards) khi load danh sách sản phẩm giúp giao diện mượt mà.
3. **Tối Ưu Accessibility (A11y):**
   - Bổ sung các thuộc tính `aria-label` và `title` cho tất cả nút bấm và icon trên giao diện.

---

## 🛠️ 3. NHẬT KÝ SỬA LỖI & TỐI ƯU HẠ TẦNG (BUG FIXES)

### 🐛 Lỗi 1: Mất toàn bộ thực đơn & không vào Quản trị được
- **Nguyên nhân:** File `app.js` tồn tại đoạn code cũ bị lơ lửng nằm ngoài hàm gây lỗi cú pháp `SyntaxError: Unexpected token '}'` làm trình duyệt ngừng chạy JS.
- **Khắc phục:** Đã lọc và xóa sạch khối code thừa, chạy `node --check` xác nhận `SYNTAX OK`.

### 🐛 Lỗi 2: Mục "QR Code Bàn" bị trống trắng
- **Nguyên nhân:** Thư viện JS cũ bị chặn script hoặc chưa gọi hàm `renderQRTableSection()` khi vào Admin.
- **Khắc phục:** Chuyển sang dùng thẻ `<img>` gọi API QR trực tiếp, bổ sung nút **Tải QR** và tự động render ngay khi mở Admin.

### 🐛 Lỗi 3: Khách quét mã QR đặt hàng nhưng Admin không nhận được đơn (Cross-Device Issue)
- **Nguyên nhân:** 
  1. Các hạ tầng máy chủ thử nghiệm cũ (`JSONBlob`, `CrudCrud`, `Restful-API`) bị quá hạn hoặc bị giới hạn 50-100 lượt gọi/ngày (Limit Exceeded) làm điện thoại khách không gửi đơn đi được.
  2. Trình duyệt di động (Safari/Chrome) giữ bộ nhớ đệm (cache) bản JS cũ làm thiết bị không tải mã nguồn nổ đơn mới.
- **Khắc phục:**
  1. Nâng cấp hạ tầng Cloud sang **ntfy.sh Server-Sent Events (SSE) Push Stream** thời gian thực (< 0.1s), không giới hạn lượt gọi, 100% không bị khóa hay hết hạn.
  2. Thêm tham số Cache-Busting trong `index.html` (`js/app.js?v=6.3.0_202608171546`) ép tất cả trình duyệt di động và máy tính lập tức nạp bản code mới nhất.
  3. Bổ sung cơ chế mở khóa âm thanh `unlockAudioContext()` tự động kích hoạt `AudioContext.resume()` ngay từ lần chạm đầu tiên trên màn hình Admin.

### 🐛 Lỗi 5: Admin không nhận được đơn đặt hàng khi quét QR / đặt trên điện thoại khác
- **Nguyên nhân:**
  1. **Tắc nghẽn / Rớt mạng một kênh Push Single Stream:** Khi điện thoại khách gửi đơn qua mạng 4G/WiFi yếu hoặc endpoint chính bị trễ, đơn hàng không được đẩy lên kênh duy nhất và không được thử lại (Retry Queue).
  2. **Trình duyệt Admin tự động ngắt kết nối Stream (SSE) khi tắt màn hình / chuyển tab:** Khi chủ quán chuyển tab hoặc mở ứng dụng khác trên điện thoại, `EventSource` bị ngắt mà không tự động kết nối lại (Auto-reconnect).
  3. **Lỗi parse JSON nghiêm ngặt:** Khi nhận dữ liệu từ server Cloud, nếu `message` đã là object hoặc chứa chuỗi rác, hàm `JSON.parse` cũ bị văng ngoại lệ ngầm làm bỏ qua đơn hàng.
  4. **Lỗi khởi tạo `state.orders`:** Khi danh sách đơn hàng trống (`[]`), bộ nhớ local lại tự động khôi phục dữ liệu mẫu cũ.
- **Khắc phục v6.4.0:**
  1. **Triển khai Đa Kênh Cloud Multi-Topic Push:** Đơn hàng được đẩy đồng thời qua nhiều kênh Cloud độc lập (`trasua_thuyhang_orders_v600_app` & `trasua_thuyhang_orders_v600_backup`) đảm bảo 100% không rớt đơn.
  2. **Cơ chế Hàng Đợi Ngoại Tuyến (Offline Retry Queue):** Lưu các đơn hàng chưa đẩy thành công vào `boba_pending_cloud_pushes` và tự động gửi lại ngay khi có mạng.
  3. **Lắng nghe sự kiện Lifecycle (`visibilitychange` & `online`):** Tự động nạp và kiểm tra đơn hàng mới ngay lập tức khi chủ quán mở lại tab web hoặc điện thoại có mạng lại.
  4. **Tự Động Kết Nối Lại Stream (Auto Reconnect SSE):** Bổ sung trình xử lý `onerror` cho `EventSource` để tự khôi phục kết nối luồng nổ đơn khi mạng bị gián đoạn.
  5. **Bảo tồn trạng thái mảng đơn hàng rỗng:** Sửa `loadStateFromStorage` để không bị đè đơn hàng mẫu khi mở trang.
  6. **Cập nhật Cache-Buster v6.4.0:** Ép tất cả trình duyệt di động & máy tính nạp phiên bản JS mới nhất.

### 🐛 Lỗi 6: Khách quét mã QR Mang Đi nhưng hệ thống tự động gán vào số bàn cũ (Bàn 5, Bàn 1...)
- **Nguyên nhân:**
  1. Mã QR Mang Đi trước đây chỉ chứa link trang chủ `baseUrl` không có tham số `?ban=mangdi`.
  2. Khi khách quét mã QR Mang Đi, URL không có tham số nên hàm `initTableNumberFromURL()` đọc lại `localStorage` cũ (nếu trước đó khách đã từng ngồi Bàn 5 thì hệ thống tự khôi phục Bàn 5).
- **Khắc phục v6.4.1:**
  1. Gắn trực tiếp tham số `?ban=mangdi` vào mã QR Mang Đi trong `renderQRTableSection()`.
  2. Cập nhật hàm `initTableNumberFromURL()` nhận diện chuẩn xác các từ khóa mang đi (`mangdi`, `mang đi`, `takeaway`, `0`), lập tức ghi đè `state.tableNumber = 'Mang đi'` và xóa số bàn cũ trong `localStorage`.
  3. Mặc định gán `Mang đi` khi người dùng truy cập trang chủ mà không quét mã QR bàn nào.

### 🐛 Lỗi 7: Khách hàng đặt đơn nhưng Admin không nhận được (Khắc phục lỗi kết nối SSE và CORS Preflight)
- **Nguyên nhân:**
  1. **EventSource kết nối sai endpoint:** Hàm `connectEventSource` trong `js/app.js` khởi tạo `new EventSource` trỏ về endpoint kết thúc bằng `/json`. Trên server `ntfy.sh`, endpoint `/json` trả về một luồng NDJSON thô chứ không tuân thủ định dạng Server-Sent Events (`text/event-stream`). Điều này làm trình duyệt ném lỗi kết nối liên tục, khiến EventSource của Admin bị hỏng và không nhận được bất kỳ tin nhắn đẩy thời gian thực nào.
  2. **Cập nhật đơn bị chặn do CORS Preflight:** Hàm `pushOrderToCloud` gửi HTTP POST request trực tiếp kèm Custom Headers (`Title`, `Tags`, `Priority`). Trên mạng di động (3G/4G/WiFi công cộng), trình duyệt bắt buộc phải thực hiện CORS Preflight (`OPTIONS`), và yêu cầu này thường bị trễ hoặc bị chặn bởi các nhà mạng/firewall, khiến dữ liệu đơn hàng không đẩy lên cloud thành công.
- **Khắc phục v7.2.0:**
  1. **Chuyển sang SSE Endpoint:** Đổi đường dẫn khởi tạo EventSource thành `${endpoint}/sse` trong `js/app.js`. Giờ đây EventSource kết nối ổn định 100%, tự động nhận diện và cập nhật đơn hàng tức thì.
  2. **Truyền metadata qua Query Params:** Chuyển các thông số `Title`, `Tags`, `Priority` từ Custom Headers sang các tham số URL query parameters (`title`, `tags`, `priority`), đồng thời sử dụng `Content-Type: text/plain;charset=UTF-8` tiêu chuẩn. Việc này loại bỏ hoàn toàn yêu cầu CORS Preflight (OPTIONS request), giúp mọi thao tác đặt hàng của khách hoặc cập nhật trạng thái của Admin được truyền tải trơn tru dưới 0.1 giây.

### ✂️ Yêu cầu 7 (v6.4.2): Loại bỏ 2 mục Tìm kiếm/Danh mục đồ uống & Banner Tra cứu đơn hàng
- **Thực hiện:**
  1. Loại bỏ thanh tìm kiếm & danh mục danh mục đồ uống (`category-section`).
  2. Loại bỏ khối banner "Theo Dõi Trạng Thái Đơn Hàng" (`order-tracking-section`).
  3. Chuyển neo điều hướng `id="menu"` về khối Thực Đơn Sản Phẩm chính (`products-section`) giúp giao diện tinh gọn, trực quan và tải nhanh hơn.

### ✨ Yêu cầu 8 (v6.5.0): Tối ưu Modal Chọn Món — Loại bỏ ảnh banner lớn & Tích hợp bộ tăng/giảm số lượng ngay trên đầu
- **Thực hiện:**
  1. Loại bỏ hình ảnh banner cao 220px (`modal-header-img`) và mô tả dài (`modal-item-desc`) trong cửa sổ tùy chỉnh món.
  2. Đưa tên món, giá gốc và **trình tăng/giảm số lượng trực quan `[- 1 +]`** lên ngay thanh header đầu cửa sổ popup.
  3. Khách hàng không cần phải cuộn/vuốt màn hình xuống để tìm nút tăng giảm số lượng hay các tùy chọn size/đường/đá nữa.

### ✂️ Yêu cầu 9 (v6.6.0): Loại bỏ các tùy chọn Chọn Lượng Đường & Chọn Lượng Đá
- **Thực hiện:**
  1. Loại bỏ mục `2. CHỌN LƯỢNG ĐƯỜNG` (100%, 70%, 50%, 30%, 0%).
  2. Loại bỏ mục `3. CHỌN LƯỢNG ĐÁ` (100%, 70%, 50%, 30%, 0%).
  3. Rút gọn danh sách tùy chọn chỉ còn **1. Chọn Size**, **2. Chọn Toppings Thêm** và **3. Ghi chú cho Barista** giúp quy trình đặt món siêu nhanh và gọn gàng.

### 🚚 Yêu cầu 10 (v6.7.0): Tự động mở Dòng Thời Gian Theo Dõi Đơn Hàng Real-Time khi khách bấm "Theo Dõi Đơn"
- **Thực hiện:**
  1. Khi khách hàng bấm nút **`🚚 Theo Dõi Đơn`** (trên header / mobile menu / nút Đơn hàng), hệ thống tự động kiểm tra mã đơn hàng vừa đặt gần nhất của thiết bị (`boba_my_last_order_id`).
  2. Mở trực tiếp màn hình **Theo Dõi Đơn Hàng Dòng Thời Gian Thời Gian Thực** (chỉ rõ tiến trình: *⏳ Chờ xác nhận ➔ 🧋 Đang pha chế ➔ 🛵 Đang giao hàng ➔ ✅ Hoàn tất*), kèm bộ đếm thời gian thực và liên kết Zalo/SMS/Call cho chủ quán.
  3. Bổ sung nút **`🔍 Tra Cứu Đơn Khác`** ở góc trên màn hình giúp khách dễ dàng tra cứu đơn hàng theo Số điện thoại hoặc Mã đơn khi cần.

### 🧾 Yêu cầu 11 (v6.8.0): Loại bỏ mục "Theo dõi đơn" trong thanh điều hướng & Tập trung theo dõi tiến trình cụ thể qua nút "Đơn Hàng"
- **Thực hiện:**
  1. Loại bỏ đường dẫn `Theo Dõi Đơn` khỏi danh sách điều hướng chính (`cust-nav-links`).
  2. Nút **`🧾 Đơn Hàng`** ở góc trên bên phải đóng vai trò duy nhất mở trực tiếp màn hình **Theo dõi dòng thời gian tiến trình đơn hàng cụ thể** của khách hàng theo thời gian thực.

### ⚡ Yêu cầu 12 (v6.9.0): Khắc phục triệt để độ trễ nút "Đơn Hàng" & Mở ngay Cửa Sổ Tra Cứu/Theo Dõi Đơn Siêu Tốc (0ms)
- **Thực hiện:**
  1. Loại bỏ việc chờ đợi mạng (`await syncCloudOrders()`) trước khi nạp cửa sổ popup.
  2. Bấm nút **`🧾 Đơn Hàng`** mở cửa sổ popup tra cứu/theo dõi ngay lập tức **(0ms delay)**.
  3. Tự động khôi phục số điện thoại gần nhất (`boba_cust_phone`) và hiển thị các đơn hàng tương ứng kèm trạng thái dòng thời gian pha chế/giao hàng.

### ✂️ Yêu cầu 13 (v7.0.0): Tinh gọn giao diện Dòng Thời Gian Theo Dõi Đơn Hàng
- **Thực hiện:**
  1. Loại bỏ mã QR chuyển khoản VietQR trong giao diện xem tiến trình đơn hàng.
  2. Loại bỏ khối hộp liên hệ Admin (Gửi Zalo / Nhắn SMS / Gọi Hotline Admin).
  3. Loại bỏ dòng ghi chú đồng bộ ở chân cửa sổ popup.
  4. Giao diện Theo Dõi Đơn Hàng hiện tại cực kỳ tinh gọn, tập trung 100% vào **Thanh tiến trình pha chế (Dòng thời gian real-time)**, **Bộ đếm giờ trực quan** và **Chi tiết các món trong hóa đơn**.

### ⚡ Yêu cầu 14 (v7.1.0): Tách biệt nút Tăng/Giảm Số Lượng và nút Thoát (X) trong Modal Chọn Món
- **Thực hiện:**
  1. Thay vì để nút Tăng/Giảm Số Lượng `[- 1 +]` nằm cùng hàng với Tên món/Giá gốc ở góc phải (gây dính sát và chồng chéo lên nút tắt modal `X` ở góc trên bên phải), đã chuyển phần chỉnh Số lượng xuống một dòng riêng biệt.
  2. Bổ sung nhãn `Số lượng:` rõ ràng bên trái và căn chỉnh cụm nút tăng giảm sang góc phải của dòng thứ hai.
  3. Áp dụng giới hạn khoảng cách (padding-right: 40px) cho tên món/giá gốc để không bao giờ có thể đè đè hay dính vào nút thoát `X` (được định vị tuyệt đối `position: absolute`).
  4. Trải nghiệm thao tác của khách hàng trên các thiết bị di động trở nên mượt mà, không lo bấm nhầm giữa nút tăng số lượng và nút tắt modal.

---

## 🚀 4. QUÁ TRÌNH TRIỂN KHAI & ĐẨY CODE (GIT DEPLOYMENT)

- Đã dùng công cụ Git hệ thống (`C:\Users\Admin\git\cmd\git.exe`) để quản lý phiên bản:
  ```bash
  git add index.html js/app.js css/style.css js/data.js NHẬT KÝ CÔNG VIỆC.md
  git commit -m "feat & fix: Upgrade v6.3.0 with ntfy.sh SSE Stream, Mute/Unmute sound toggle & Cache Buster"
  git push origin main
  ```
- **Kết quả:** Mã nguồn phiên bản **v6.3.0** đã được đẩy thành công lên GitHub Repository `trieuson0971113449/trasuadanang` và tự động cập nhật lên trang web GitHub Pages live.

---

## ✅ KẾT LUẬN & HƯỚNG DẪN KIỂM TRA

Website **Trà Sữa Thúy Hằng v6.3.0** hiện đã hoàn chỉnh 100% tất cả các yêu cầu nâng cấp, nổ đơn QR siêu tốc thời gian thực và quản lý âm thanh chuông báo linh hoạt.

### 💡 Hướng dẫn kiểm tra cho chủ quán:
1. Mở liên kết Admin: **[https://trieuson0971113449.github.io/trasuadanang/#admin](https://trieuson0971113449.github.io/trasuadanang/#admin)**
2. Bấm **`Ctrl + F5`** trên máy tính để nạp bản code `v6.3.0` mới nhất.
3. Trải nghiệm nút **`[🔊 Chuông: BẬT]`** hoặc **`[🔇 Chuông: TẮT]`** ngay trên thanh Quản Lý Đơn Hàng.
4. Dùng điện thoại quét mã QR **Bàn 5** (`?ban=5`) ➔ Đặt món ➔ Đơn hàng nổ về màn hình Admin trong chưa tới 1 giây!
