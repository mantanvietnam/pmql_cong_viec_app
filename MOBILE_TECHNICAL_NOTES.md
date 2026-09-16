# Mobile Technical Notes - Phan mem quan ly cong viec

## 1. Tong quan phien ban website

Website Next.js trong `/Users/root1/GitHub/pmql_cong_viec/` la ung dung FODO/Phoenix Doing quan ly cong viec. Man hinh marketing nam o `app/page.tsx`; cac chuc nang ung dung that nam trong `app/login`, `app/to-chuc`, `app/phong-ban`, `app/du-an`, `app/cong-viec`, `app/bao-cao`, `app/cai-dat`, `app/change-password`.

Website khong chua Prisma, database schema, route handler Next.js hoac server action noi bo. Frontend goi REST API ngoai qua bien moi truong `NEXT_PUBLIC_API_URL`.

## 2. Cong nghe website dang su dung

- Next.js App Router 16.2.4, React 19.2.4, TypeScript.
- Tailwind CSS, lucide-react, react-toastify, react-datepicker, jodit-react, recharts.
- Xac thuc va du lieu phien luu o `localStorage` key `user_info`.
- API backend REST nam duoi `/apis/*`, base URL tu `NEXT_PUBLIC_API_URL`.
- Mobile bo sung Firebase Messaging de lay `token_device` phuc vu notification.

## 3. Chuc nang da phat hien

- Dang nhap bang so dien thoai va mat khau.
- Dang ky tai khoan, quen mat khau bang OTP, doi mat khau, dang xuat.
- Quan ly to chuc: danh sach, tim kiem, them, sua, xoa, thong ke so phong ban/du an/nhan su/cong viec.
- Chi tiet to chuc gom tab phong ban, vai tro, nhan su, du an, cong viec.
- Quan ly phong ban: danh sach trong to chuc, them, sua, xoa, chi tiet phong ban.
- Quan ly du an: danh sach, them, sua, xoa, trang thai, ngay bat dau/ket thuc, chi tiet du an.
- Quan ly nhan su: them/xoa nhan su vao to chuc/phong ban/du an, gan vai tro trong to chuc.
- Quan ly vai tro/quyen: danh sach vai tro, danh sach permission, them/sua/xoa vai tro, chon permission.
- Quan ly cong viec: danh sach phan trang, tim kiem, loc trang thai, loc du an, loc loai viec, them/sua/xoa, giao viec nhieu nguoi, file dinh kem, ngay gio, trang thai.
- Chi tiet cong viec: thong tin task, file/anh dinh kem, nhat ky bao cao tien do, them/sua/xoa log.
- Bao cao: personal dashboard, manager dashboard theo to chuc, department dashboard, loc ngay.
- Ho so: cap nhat fullname/email/description/avatar, lay link Telegram, doi mat khau.

## 4. Xac thuc va phan quyen

- Website dang nhap: `POST /apis/login`, body `{ phone, password }`.
- Mobile dang nhap: `POST /apis/login`, body `{ phone, password, type_device: "mobile", token_device }`; `token_device` duoc lay tu Firebase Messaging.
- Response thanh cong duoc website ky vong co `code: 200`, `data` chua `token`, `id` hoac `user_id`, `fullname`, `phone`, `email`, co the co `permissions`.
- Response mobile can uu tien `data.token_mobile`. Cac API sau van gui truong ten `token`, nhung gia tri lay tu `token_mobile`; neu backend chua tra `token_mobile` thi app fallback sang `token`.
- Token duoc gui bang header `Authorization: Bearer <token_mobile>`. Mot so API cu gui them `access_token` trong body/form, app cung lay gia tri tu `token_mobile`.
- Het phien: backend tra `code === 203`; website chuyen `/logout`.
- Dang xuat: `POST /apis/logout`, header Bearer va body `{ access_token }`.
- Quen mat khau: `POST /apis/request_forgot_password_otp`, sau do `POST /apis/forgot_password`.
- Phan quyen lay qua `POST /apis/get_role_permission` voi `{ organization_id }`, response list permission co truong `code`.
- UI web an/hien nut bang cac code: `department_add`, `department_edit`, `department_delete`, `project_add`, `project_edit`, `project_delete`, `task_add`, `task_edit`, `task_edit_end_date`, `task_delete`, `role_add`, `role_edit`, `role_delete`, `org_member_add`, `org_member_delete`.

## 5. Danh sach API hien co

| Endpoint | Method | Input chinh | Output web ky vong | File web goi |
| --- | --- | --- | --- | --- |
| `/apis/login` | POST | Web: `phone`, `password`; Mobile: them `type_device`, `token_device` | `data` user + `token`/`token_mobile` | `app/login/page.tsx` |
| `/apis/register` | POST | `fullname`, `phone`, `email`, `password`, `password_confirmation` | `data` user + token | `app/register/page.tsx` |
| `/apis/logout` | POST | `access_token` | `code` | `app/logout/page.tsx` |
| `/apis/request_forgot_password_otp` | POST | `phone` | `code` | `app/forgot-password/page.tsx` |
| `/apis/forgot_password` | POST | `phone`, `otp`, `new_password` | `code` | `app/forgot-password/page.tsx` |
| `/apis/change_password` | POST | `access_token`, `old_password`, `new_password`, `new_password_again` | `code` | `app/change-password/page.tsx` |
| `/apis/get_organizations` | POST | `name` | `data: Organization[]` | `app/to-chuc/page.tsx` |
| `/apis/add_organization` | POST | `name`, `description` | `code 201` | `app/to-chuc/page.tsx` |
| `/apis/edit_organization` | POST | `organization_id`, `name`, `description` | `code 200` | `app/to-chuc/page.tsx` |
| `/apis/delete_organization` | POST | `organization_id` | `code 200` | `app/to-chuc/page.tsx` |
| `/apis/get_organization` | POST | `organization_id` | detail + counts | `app/to-chuc/[id]/page.tsx` |
| `/apis/get_role_permission` | POST | `organization_id` | `Permission[]` của người hiện tại | `app/to-chuc/[id]/page.tsx`, các trang chi tiết |
| `/apis/get_departments` | POST | `organization_id`, `limit`, `page` | `data.listData` | `tabs/PhongBanTab.tsx` |
| `/apis/add_department` | POST | `organization_id`, `name`, `description` | `code 201` | `tabs/PhongBanTab.tsx` |
| `/apis/edit_department` | POST | `department_id`, `name`, `description` | `code 200` | `tabs/PhongBanTab.tsx` |
| `/apis/delete_department` | POST | `department_id` | `code 200` | `tabs/PhongBanTab.tsx` |
| `/apis/get_department` | POST | `department_id` | chi tiết + counts | `app/phong-ban/[id]/page.tsx` |
| `/apis/get_projects` | POST | optional `organization_id`, `department_id` | `data: Project[]` | `app/du-an/page.tsx` |
| `/apis/add_project` | POST | project fields | `code 201/200` | `app/du-an/page.tsx` |
| `/apis/edit_project` | POST | `project_id`, project fields | `code 200` | `app/du-an/page.tsx` |
| `/apis/delete_project` | POST | `project_id` | `code 200` | `app/du-an/page.tsx` |
| `/apis/get_project` | POST | `project_id` | chi tiết + counts | `app/du-an/[id]/page.tsx` |
| `/apis/get_tasks` | POST | `limit`, `page`, filters | `data.listData` | `app/cong-viec/page.tsx` |
| `/apis/add_task` | POST multipart | task fields, `user_ids[]`, `files[]` | `code 201/200` | `app/cong-viec/page.tsx` |
| `/apis/edit_task` | POST multipart | `id`, task fields | `code 200` | `app/cong-viec/page.tsx` |
| `/apis/delete_task` | POST | `id` | `code 200` | `app/cong-viec/page.tsx` |
| `/apis/get_task` | POST | `id` | `data: Task` | `app/cong-viec/[id]/page.tsx` |
| `/apis/get_task_logs` | POST | `task_id` | `data.listData`, `code 0` | `app/cong-viec/[id]/page.tsx` |
| `/apis/add_task_log` | POST multipart | log fields, `files[]` | `code 0` | `app/cong-viec/[id]/page.tsx` |
| `/apis/edit_task_log` | POST multipart | `id`, log fields | `code 0` | `app/cong-viec/[id]/page.tsx` |
| `/apis/delete_task_log` | POST | `id` | `code 0` | `app/cong-viec/[id]/page.tsx` |
| `/apis/get_organization_members` | POST | `organization_id` | `data.listData` | `tabs/NhanSuTab.tsx` |
| `/apis/get_department_members` | POST | `department_id` | `data.listData` | `tabs/NhanSuTab.tsx` |
| `/apis/get_project_members` | POST | `project_id` | `data.listData` | `tabs/NhanSuTab.tsx` |
| `/apis/get_users` | POST | `keyword`, `status`, optional `organization_id` | `data.listData` | `tabs/NhanSuTab.tsx` |
| `/apis/add_organization_member` | POST | `organization_id`, `user_id[]`, optional `role_id` | `code` | `tabs/NhanSuTab.tsx` |
| `/apis/edit_organization_member` | POST | `organization_id`, `user_id`, `role_id` | `code` | `tabs/NhanSuTab.tsx` |
| `/apis/delete_organization_member` | POST | membership `id` | `code` | `tabs/NhanSuTab.tsx` |
| `/apis/add_department_member`, `/apis/delete_department_member` | POST | `department_id`, `user_id[]` / membership `id` | `code` | `tabs/NhanSuTab.tsx` |
| `/apis/add_project_member`, `/apis/delete_project_member` | POST | `project_id`, `user_id[]` / membership `id` | `code` | `tabs/NhanSuTab.tsx` |
| `/apis/get_roles` | POST | `organization_id` | `data.listData` | `tabs/VaiTroTab.tsx` |
| `/apis/get_permissions` | POST | none | `data.listData` | `tabs/VaiTroTab.tsx` |
| `/apis/add_role`, `/apis/edit_role` | POST | `name`, `description`, `organization_id`, `permissions[]`, edit có `id` | `code` | `tabs/VaiTroTab.tsx` |
| `/apis/delete_role` | POST | role `id` | `code` | `tabs/VaiTroTab.tsx` |
| `/apis/personalDashboardAPI` | POST | `user_id`, optional dates/org | dashboard | `app/bao-cao/page.tsx` |
| `/apis/managerDashboardAPI` | POST | `organization_id` | manager dashboard | `app/bao-cao/to-chuc/[id]/page.tsx` |
| `/apis/DepartmentDashboardAPI` | POST | `department_id` | department dashboard | `app/bao-cao/phong-ban/[id]/page.tsx` |
| `/apis/update_info_user` | POST multipart | profile fields/avatar | user data | `app/cai-dat/page.tsx` |
| `/apis/getTelegramLink` | POST | auth only | `link`, `telegram_chat_id` | `app/cai-dat/page.tsx` |

## 6. Cau truc du lieu quan trong

- `Organization`: `id`, `name`, `description`, `member_count`, `department_count`, `project_count`, `task_count`, `role_count`.
- `Department`: `id`, `name`, `description`, `organization_id`, counts.
- `Project`: `id`, `name`, `description`, `organization_id`, `department_id`, `status`, `start_date`, `end_date`, counts.
- `Task`: `id`, `name`, `description`, `organization_id`, `department_id`, `project_id`, `status`, `start_date`, `end_date`, `Users`, `link_file`, `image`.
- `TaskLog`: `id`, `task_id`, `action`, `status`, `created_at`, `link_file`, `image`, `Users`.
- File dinh kem duoc luu tach `link_file` va `image`, thuong la JSON array object `{ file_url, file_name, file_size, file_type }`.

## 7. Nhung phan co the tai su dung

- Toan bo REST API hien co.
- Quy uoc token Bearer va code het phien `203`.
- Mobile dung `token_mobile` lam access token thuc te, nhung client van gui field body/form ten `token` theo hop dong API hien co.
- Enum trang thai task/project.
- Quy tac file: toi da 5 file, 10MB, extension trong source web.
- Permission code tra ve tu `get_role_permission`.

## 8. Nhung phan khong the dung truc tiep tren mobile

- `localStorage`, `window.confirm`, `window.open`, DOM file input, Jodit rich text editor, `react-datepicker`, Recharts web.
- Giao dien desktop/sidebar Tailwind.
- Landing page marketing va SEO.

## 9. Cac API con thieu cho ung dung mobile

- API `/me` hoac `/apis/current_user` de xac minh token con hop le khi mo app. Hien mobile khoi phuc session tu token da luu va xu ly het phien khi API tra `203`.
- Refresh token: website khong co, mobile khong the refresh token.
- API thong bao/push notification: website chua co danh sach thong bao rieng, chi co lien ket Telegram. Mobile da gui `type_device=mobile` va `token_device` khi login de backend co du lieu gui notification sau nay.
- API upload avatar/task file da co dang multipart, nhung can backend dam bao chap nhan file tu React Native URI.

## 10. Kien truc de xuat cho ung dung React Native

- React Native CLI TypeScript, Android/iOS native project.
- `src/api`: API client, auth API, work API.
- `src/context`: auth/session state.
- `src/services/deviceMessaging.ts`: lay Firebase token, xin quyen notification Android 13+ khi can.
- `src/navigation`: auth stack, app stack, bottom tabs.
- `src/screens`: auth, tasks, organizations, projects, reports, profile.
- `src/components`: button, input, header, loading/error/empty, badge.
- `src/utils`: date, file parsing, text cleanup.
- `src/constants`: API config, business constants.

## 11. Cau truc man hinh mobile

- Auth: Login, Register, ForgotPassword.
- Main tabs: Cong viec, To chuc, Du an, Bao cao, Ho so.
- Stack nghiep vu: TaskDetail, TaskForm, TaskReport, OrganizationDetail, DepartmentDetail, ProjectDetail, ManagementReport, MemberReport.

## 12. Anh xa chuc nang web sang mobile

- `/login` -> LoginScreen.
- `/forgot-password` -> ForgotPasswordScreen.
- `/register` -> RegisterScreen; đăng ký xong gọi lại login mobile để có `token_mobile` và `token_device`.
- `/cong-viec` -> TasksScreen + TaskFormScreen.
- `/cong-viec/[id]` -> TaskDetailScreen + TaskReportScreen.
- `/to-chuc` và `/to-chuc/[id]` -> OrganizationsScreen + OrganizationDetailScreen và các tab phòng ban/vai trò/nhân sự/dự án/công việc.
- `/phong-ban/[id]` -> DepartmentDetailScreen.
- `/du-an` và `/du-an/[id]` -> ProjectsScreen + ProjectDetailScreen.
- `/bao-cao` và các báo cáo tổ chức/phòng ban/thành viên -> ReportsScreen + PersonalReportView + ManagementReportScreen + MemberReportScreen.
- `/cai-dat` + `/change-password` + `/logout` -> ProfileScreen.

## 13. Rui ro va van de can luu y

- RN CLI 0.86.2 yêu cầu Node >=22.11; máy hiện dùng Node 22.21.1, đáp ứng yêu cầu.
- `API_BASE_URL` can duoc cau hinh trong `src/constants/config.ts` hoac co che env build; khong ghi hard-code rai rac trong source.
- `android/app/google-services.json` và `ios/GoogleService-Info.plist` hợp lệ, khớp package/bundle ID `net.quanlynhansu.app` và cùng Firebase project. Android Emulator đã lấy được FCM device token. iOS đã khởi tạo Firebase, xin quyền thông báo và build Simulator thành công, nhưng React Native Firebase không đăng ký APNs trên ARM64 Simulator nên cần kiểm tra token lần cuối trên iPhone thật với Push Notifications provisioning và APNs credential đã cấu hình trong Firebase Console.
- iOS dùng CocoaPods cho Firebase (`$RNFirebaseDisableSPM = true`, `use_modular_headers!`) để tương thích static linkage; `pod install` đã hoàn tất.
- Khong co refresh token/current-user endpoint nen session restore chua the verify truoc khi goi API dau tien.
- Đã đối chiếu 52/52 endpoint REST của web trong lớp API mobile. Hai route `app/home` và `app/dashboard` là mockup tĩnh không gọi API, nên không chuyển thành màn hình mobile.
- Website không có API refresh token/current-user và không có API danh sách/đánh dấu đã đọc notification. App không tạo dữ liệu giả cho hai phần này.
