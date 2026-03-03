<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# QuickReport - Hướng dẫn chạy và deploy online

Repo hiện tại là app báo cáo (Report app). Bạn có thêm app lương tại:
- `https://github.com/tunganh0786/luong`

Tài liệu này đã được chỉnh để **không phụ thuộc Gemini/API key**.

## 1) Chạy local (Report app)

**Yêu cầu:** Node.js 18+

```bash
npm install
npm run dev
```

Mặc định app chạy ở `http://localhost:3000`.

## 2) Build production (Report app)

```bash
npm run build
```

Kết quả build nằm ở thư mục `dist/`.

---

## 3) Deploy online cho cả 2 app

### Cách tối ưu, dễ quản lý nhất: tách 2 project + 2 subdomain

- Report app (repo hiện tại): `report.tenmiencuaban.com`
- Luong app (`tunganh0786/luong`): `luong.tenmiencuaban.com`

Lợi ích:
- Deploy độc lập, app nào lỗi rollback app đó.
- Cấu hình env riêng (nếu sau này cần) không bị lẫn.
- Dễ theo dõi log, hiệu năng và lỗi theo từng app.

### Triển khai nhanh bằng Vercel

1. Push mỗi app lên GitHub (mỗi app một repo).
2. Vào Vercel, import 2 repo thành 2 project.
3. Build settings cho mỗi project (Vite):
   - Build command: `npm run build`
   - Output directory: `dist`
4. Gắn domain:
   - Project Report -> `report.tenmiencuaban.com`
   - Project Luong -> `luong.tenmiencuaban.com`
5. Cập nhật DNS theo hướng dẫn của Vercel.

### Triển khai bằng Netlify (tương tự)

- Build command: `npm run build`
- Publish directory: `dist`
- Mỗi app một site riêng, sau đó map domain/subdomain tương ứng.

---

## 4) Nếu muốn dùng chung 1 domain

Bạn có thể route theo path:
- `tenmiencuaban.com/report`
- `tenmiencuaban.com/luong`

Cách này cần reverse proxy/rules (Nginx hoặc Cloudflare) nên cấu hình phức tạp hơn subdomain.

---

## 5) Checklist tối ưu trước khi public

- [ ] `npm run build` pass
- [ ] Kiểm tra responsive trên mobile
- [ ] Kiểm tra localStorage hoạt động sau khi reload
- [ ] Gắn domain + SSL thành công
- [ ] Bật analytics/log theo dõi lỗi runtime
