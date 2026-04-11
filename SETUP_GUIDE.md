# 📋 HƯỚNG DẪN THIẾT LẬP SAU CÀI ĐẶT

## 1. Cài đặt Dependencies

Mở Command Prompt hoặc Terminal và chạy:

```bash
cd server
npm install
```

## 2. Cấu hình Email SMTP (Tùy chọn)

Luồng duyệt/từ chối đăng ký giảng viên hiện đã hiển thị trạng thái trực tiếp trong hệ thống, không còn phụ thuộc email.
Bạn chỉ cần cấu hình SMTP nếu muốn dùng cho các tính năng gửi email khác.

### Sử dụng Gmail:

1. **Bật xác thực 2 bước** tại: https://myaccount.google.com/security
2. **Tạo App Password** tại: https://myaccount.google.com/apppasswords
   - Chọn "Mail" và "Windows Computer"
   - Copy mật khẩu được tạo
3. **Cập nhật file `.env`**:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  # App Password vừa tạo
   SMTP_FROM_NAME=LMS Platform
   ```

## 3. Cấu hình AI Features (Tùy chọn)

Hệ thống hỗ trợ các tính năng AI như:
- 🤖 **AI Chatbot**: Trợ lý học tập hỗ trợ hỏi đáp
- 📝 **Tóm tắt bài học**: Tự động tóm tắt nội dung
- 📋 **Sinh Quiz**: Tạo câu hỏi trắc nghiệm tự động
- 💡 **Gợi ý khóa học**: Đề xuất dựa trên lịch sử học
- ✍️ **Sinh mô tả khóa học**: Hỗ trợ giáo viên viết mô tả

### Lựa chọn 1: OpenAI (Khuyến nghị)

1. Đăng ký tại: https://platform.openai.com
2. Tạo API Key tại: https://platform.openai.com/api-keys
3. Thêm vào file `.env`:
   ```
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Lựa chọn 2: Google Gemini (Miễn phí)

1. Đăng ký tại: https://makersuite.google.com
2. Tạo API Key tại: https://makersuite.google.com/app/apikey
3. Thêm vào file `.env`:
   ```
   GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxx
   ```

> **Lưu ý:** Nếu không cấu hình API key, các tính năng AI sẽ hiển thị thông báo lỗi.

## 3.1 Cấu hình Cloudinary (Bắt buộc nếu upload ảnh/file)

Lỗi `Must supply api_key` nghĩa là Vercel/local đang thiếu biến môi trường Cloudinary.

Bạn có thể dùng 1 trong 2 chuẩn tên biến:

```env
# Chuẩn A (project hiện tại)
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_SECRET_KEY=...
```

hoặc

```env
# Chuẩn B (tên từ dashboard Cloudinary)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Sau khi thêm trên Vercel:
1. Vào Project Settings → Environment Variables
2. Add đủ 3 biến
3. Redeploy project (quan trọng)

## 4. Tạo Admin User Đầu Tiên

### Bước 1: Lấy User ID từ Clerk

1. Đăng nhập vào hệ thống LMS bằng tài khoản muốn làm Admin
2. Vào Clerk Dashboard: https://dashboard.clerk.dev
3. Mục **Users** → Click vào user
4. Copy **User ID** (dạng `user_2xxxxxxxxxxxxx`)

### Bước 2: Cập nhật trong MongoDB

Dùng MongoDB Compass hoặc mongosh:

```javascript
// Kết nối database
use lms

// Cập nhật user thành admin
db.users.updateOne(
  { _id: "user_2xxxxxxxxxxxxx" },  // Thay bằng User ID thực
  { $set: { role: "admin" } }
)
```

### Bước 3: Cập nhật trong Clerk

1. Vào Clerk Dashboard → Users → Chọn user
2. Scroll xuống **"Public metadata"**
3. Click **Edit** và thêm:
   ```json
   {
     "role": "admin"
   }
   ```
4. Nhấn **Save**

### Bước 4: Đăng xuất và đăng nhập lại

Sau khi hoàn thành, đăng xuất khỏi hệ thống và đăng nhập lại. 
Bạn sẽ thấy nút **"Admin"** trên thanh navigation.

## 5. Khởi động Server

```bash
# Development
cd server
npm run server

# Production
npm start
```

## 6. Khởi động Client

```bash
cd client
npm run dev
```

---

## 🔗 Các URL quan trọng

- **Trang chủ:** http://localhost:5173
- **Admin Panel:** http://localhost:5173/admin
- **Đăng ký giảng viên:** http://localhost:5173/become-educator
- **Trang giảng viên:** http://localhost:5173/educator

---

## 🤖 Sử dụng tính năng AI

### Cho học viên (Student):
1. Vào trang xem video bài học (Player)
2. Sử dụng các nút:
   - **Tóm tắt bài học**: Xem tóm tắt nội dung
   - **Làm Quiz**: Tự kiểm tra kiến thức
   - **Hỏi AI**: Mở chatbot hỏi đáp
3. Nút tròn góc phải: Mở nhanh AI Chatbot

### Cho giảng viên (Educator):
1. Khi tạo khóa học mới
2. Click nút **"Tạo mô tả bằng AI"** bên cạnh mô tả khóa học
3. Điền thông tin và để AI tự động sinh mô tả hấp dẫn

---

## ❓ Troubleshooting

### Email không gửi được?
- Kiểm tra App Password có đúng không
- Đảm bảo đã bật 2FA cho Gmail
- Kiểm tra log server để xem lỗi chi tiết

### Admin không hiển thị?
- Đảm bảo đã cập nhật cả MongoDB và Clerk
- Đăng xuất và đăng nhập lại
- Clear cache browser

### Lỗi kết nối MongoDB?
- Kiểm tra MONGODB_URI trong .env
- Đảm bảo IP của bạn được whitelist trong MongoDB Atlas

### AI không hoạt động?
- Kiểm tra đã thêm OPENAI_API_KEY hoặc GEMINI_API_KEY vào .env
- Restart server sau khi thêm API key
- Kiểm tra API key còn credit/quota


Để test thanh toán Stripe cho project LMS của bạn, làm theo đúng luồng này là chắc nhất:

Dùng key test, không dùng key live
Trong file env server:
STRIPE_PUBLISHABLE_KEY = pk_test_...
STRIPE_SECRET_KEY = sk_test_...
Đảm bảo frontend cũng đang dùng publishable key test.
Chạy server và client
Server: npm run server
Client: npm run dev
Bắt buộc có webhook thì mới ghi nhận đã mua
Vì code hiện tại chỉ cộng khóa học cho user khi nhận sự kiện payment_intent.succeeded ở endpoint /stripe.
Cách dễ nhất khi chạy local:

Cài Stripe CLI
Chạy:
stripe listen --forward-to localhost:5000/stripe
Lấy webhook signing secret mới mà Stripe CLI in ra (dạng whsec_...) và gán vào:
STRIPE_WEBHOOK_SECRET = whsec_...
Restart server sau khi đổi env.
Tạo giao dịch test từ UI
Đăng nhập user học viên
Mở trang chi tiết khóa học
Bấm Đăng ký ngay
Stripe Checkout mở ra như ảnh bạn gửi.
Dùng thẻ test để mô phỏng
Thành công:
4242 4242 4242 4242
MM/YY bất kỳ tương lai, CVC bất kỳ, ZIP bất kỳ
Thất bại:
4000 0000 0000 0002
3D Secure:
4000 0025 0000 3155
Kiểm tra kết quả sau thanh toán
Thành công thì phải tự về trang my-enrollments
Trong DB:
purchase.status chuyển thành completed
user.enrolledCourses có course mới
course.enrolledStudents có user mới
Nếu thanh toán thành công nhưng chưa vào khóa học
90% là webhook chưa nhận được hoặc sai STRIPE_WEBHOOK_SECRET.
Kiểm tra log server có dòng Payment succeeded for purchase không.
Nếu không có, kiểm tra lại bước stripe listen và secret whsec.