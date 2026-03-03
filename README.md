<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# QuickReport - Hướng dẫn chạy app và deploy online

Repo hiện tại là app báo cáo (Report app).  
Bạn có app lương tại: `https://github.com/tunganh0786/luong`.

> Bản này đã bỏ phụ thuộc Gemini/API key.

## A. Chạy app này trên máy của bạn (Reportdailyday)

### 1) Cài Node.js
- Cài Node.js bản **18+** (khuyên dùng Node 20 LTS).
- Kiểm tra sau khi cài:

```bash
node -v
npm -v
```

### 2) Tải code và cài thư viện

```bash
git clone https://github.com/tunganh0786/Reportdailyday.git
cd Reportdailyday
npm install
```

### 3) Chạy app local

```bash
npm run dev
```

- Mở trình duyệt vào: `http://localhost:3000`
- Nếu cổng 3000 đang bận, Vite có thể tự đổi sang cổng khác (xem trong terminal).

### 4) Build bản production

```bash
npm run build
```

- File build nằm trong thư mục `dist/`.

### 5) Xem thử bản production trên local

```bash
npm run preview
```

---

## B. Chạy app lương (repo `luong`)

Thực hiện tương tự trong repo app lương:

```bash
git clone https://github.com/tunganh0786/luong.git
cd luong
npm install
npm run dev
```

- Sau đó mở URL hiển thị trong terminal (thường là `http://localhost:5173` hoặc cổng khác).

---

## C. Deploy online cho cả 2 app (khuyến nghị)

### Cách tối ưu: tách 2 project + 2 subdomain

- Report app: `report.tenmiencuaban.com`
- Luong app: `luong.tenmiencuaban.com`

Ưu điểm:
- Mỗi app deploy độc lập.
- App nào lỗi rollback app đó.
- Quản lý domain/log rõ ràng.

### Triển khai bằng Vercel

1. Push cả 2 repo lên GitHub.
2. Import 2 repo vào Vercel thành 2 project.
3. Build settings (cho cả 2 app Vite):
   - Build command: `npm run build`
   - Output directory: `dist`
4. Gắn domain:
   - Project Report -> `report.tenmiencuaban.com`
   - Project Luong -> `luong.tenmiencuaban.com`
5. Cập nhật DNS theo hướng dẫn Vercel.

### Triển khai bằng Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Mỗi app một site riêng, rồi map domain/subdomain tương ứng.

---

## D. Lỗi thường gặp khi chạy app

### 1) `npm` hoặc `node` không nhận lệnh
- Mở lại terminal sau khi cài Node.js.
- Kiểm tra lại `node -v` và `npm -v`.

### 2) Lỗi cài thư viện

```bash
rm -rf node_modules package-lock.json
npm install
```

### 3) Cổng bị trùng
- Dừng app đang chạy cổng đó hoặc chạy lại `npm run dev` để Vite tự đổi cổng.

### 4) Mở URL nhưng trắng trang
- Xem log terminal khi chạy `npm run dev`.
- Mở DevTools (F12) kiểm tra tab Console để xem lỗi runtime.

---

## E. Checklist trước khi public

- [ ] `npm run build` pass
- [ ] Test mobile + desktop
- [ ] Reload nhiều lần để kiểm tra localStorage
- [ ] Domain + SSL hoạt động
- [ ] Có theo dõi log lỗi runtime
