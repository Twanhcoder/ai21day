-- First Project Challenge: cọc giữ chỗ 300.000đ, phần còn lại 690.000đ trả sau buổi khởi động 12/10.
update public.products
set price = 300000,
    description = 'Đặt cọc giữ 1 trong 3 suất Founding. Còn lại 690.000đ thanh toán sau buổi khởi động 12/10 nếu học tiếp.'
where slug = 'coc-founding';

update public.products
set description = 'First Project Challenge: 21 ngày làm dự án đầu tay có người dùng thật, 12/10 - 01/11/2026.'
where slug = 'founding';
