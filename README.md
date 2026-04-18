# ConstructTrack

Ứng dụng quản lý tiến độ thi công xây dựng demo bằng React + Vite + TypeScript.

## Công nghệ

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion
- React Router DOM
- Zustand
- React Hook Form + Zod
- Lucide React
- date-fns
- LocalStorage demo
- GitHub Pages

## Chạy local

1. Mở terminal ở thư mục dự án
2. Chạy `npm install`
3. Chạy `npm run dev`

Ứng dụng sẽ chạy ở `http://localhost:5174`.

## Build và deploy

- Build: `npm run build`
- Preview: `npm run preview`
- Deploy GitHub Pages: `npm run deploy`

## GitHub Pages

Dự án cấu hình `vite.config.ts` với `base: '/CONSTRUCTION_PLANNING-/'` và workflow deploy tự động tại `.github/workflows/deploy.yml`.

## Tính năng

- Đăng nhập demo Quản lý hoặc Giám sát
- Dashboard tổng quan dự án cho Quản lý
- Danh sách dự án và thêm/xóa dự án
- Project detail với Kanban board 6 cột
- Drag & drop công việc giữa các cột
- Upload ảnh thực tế
- Webhook gửi sự kiện khi tạo công việc, chuyển trạng thái, upload ảnh
- Lưu dữ liệu demo trong localStorage
- Responsive mobile-first

## Lưu ý

- Đây là ứng dụng demo không có backend.
- Dữ liệu lưu trên trình duyệt và chỉ tồn tại trên máy hiện tại.
