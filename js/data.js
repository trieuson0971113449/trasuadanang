/**
 * Boba Craze - Data Store & Default Mock Data
 */

const DEFAULT_CATEGORIES = [
    { id: 'all', name: 'Tất cả đồ uống', icon: 'fa-glass-water' },
    { id: 'bestseller', name: 'Best Seller ⭐', icon: 'fa-fire' },
    { id: 'milk-tea', name: 'Trà Sữa Đậm Vị', icon: 'fa-mug-hot' },
    { id: 'fruit-tea', name: 'Trà Trái Cây Tươi', icon: 'fa-lemon' },
    { id: 'macchiato', name: 'Macchiato & Cream', icon: 'fa-cloud' },
    { id: 'snack', name: 'Ăn Kèm & Dessert', icon: 'fa-cookie-bite' }
];

const DEFAULT_SIZES = [
    { id: 'M', name: 'Size M (Medium)', price: 0 },
    { id: 'L', name: 'Size L (Large)', price: 6000 },
    { id: 'XL', name: 'Size XL (Extra Large)', price: 12000 }
];

const DEFAULT_SUGAR_LEVELS = [
    { id: '100%', name: '100% Đường (Ngọt chuẩn)' },
    { id: '70%', name: '70% Đường (Vừa ngọt)' },
    { id: '50%', name: '50% Đường (Ít ngọt)' },
    { id: '30%', name: '30% Đường (Rất ít ngọt)' },
    { id: '0%', name: '0% Đường (Không đường)' }
];

const DEFAULT_ICE_LEVELS = [
    { id: '100%', name: '100% Đá (Đá chuẩn)' },
    { id: '70%', name: '70% Đá (Vừa đá)' },
    { id: '50%', name: '50% Đá (Ít đá)' },
    { id: '30%', name: '30% Đá (Rất ít đá)' },
    { id: '0%', name: '0% Đá (Không đá)' }
];

const DEFAULT_TOPPINGS = [
    { id: 't1', name: 'Trân Châu Đen Dẻo', price: 7000, stock: true },
    { id: 't2', name: 'Trân Châu Hoàng Kim', price: 9000, stock: true },
    { id: 't3', name: 'Pudding Trứng Béo Mịn', price: 10000, stock: true },
    { id: 't4', name: 'Cream Cheese Sữa Dừa', price: 12000, stock: true },
    { id: 't5', name: 'Thạch Củ Năng Giòn', price: 8000, stock: true },
    { id: 't6', name: 'Thạch Dừa Sợi Fresh', price: 7000, stock: true },
    { id: 't7', name: 'Trân Châu Trắng 3Q', price: 9000, stock: true },
    { id: 't8', name: 'Đậu Đỏ Azuki', price: 8000, stock: true }
];

const DEFAULT_PRODUCTS = [
    {
        id: 'p1',
        name: 'Trà Sữa Nướng Trân Châu Hoàng Kim',
        category: 'milk-tea',
        isBestSeller: true,
        price: 39000,
        originalPrice: 49000,
        stock: 50,
        rating: 4.9,
        reviewsCount: 142,
        image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=600&q=80',
        description: 'Vị trà đậm đà hòa quyện cùng lớp đường nướng thơm lừng và trân châu hoàng kim dai dẻo trứ danh.',
        tags: ['HOT', 'Bán chạy']
    },
    {
        id: 'p2',
        name: 'Trà Đào Cam Sả Thượng Hạng',
        category: 'fruit-tea',
        isBestSeller: true,
        price: 42000,
        originalPrice: 48000,
        stock: 35,
        rating: 4.8,
        reviewsCount: 98,
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
        description: 'Trà đen hảo hạng thanh mát kết hợp cùng đào miếng giòn ngọt, cam tươi và hương sả nồng nàn.',
        tags: ['Fresh', 'Giải nhiệt']
    },
    {
        id: 'p3',
        name: 'Ô Long Cream Cheese Macchiato',
        category: 'macchiato',
        isBestSeller: true,
        price: 45000,
        originalPrice: 52000,
        stock: 40,
        rating: 5.0,
        reviewsCount: 215,
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
        description: 'Cốt trà Ô Long nướng thanh đậm phủ lớp kem cheese mặn béo ngậy mượt mà ngây ngất.',
        tags: ['Must Try', 'Béo ngậy']
    },
    {
        id: 'p4',
        name: 'Trà Sữa Matcha Nhật Bản Đậu Đỏ',
        category: 'milk-tea',
        isBestSeller: false,
        price: 45000,
        originalPrice: 50000,
        stock: 25,
        rating: 4.7,
        reviewsCount: 76,
        image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
        description: 'Bột Matcha Uji chuẩn Nhật Bản béo thanh kết hợp hoàn hảo cùng đậu đỏ Azuki ngọt dịu.',
        tags: ['Matcha Uji']
    },
    {
        id: 'p5',
        name: 'Trà Dâu Tây Dừa Nướng Fresh',
        category: 'fruit-tea',
        isBestSeller: false,
        price: 42000,
        originalPrice: 45000,
        stock: 30,
        rating: 4.6,
        reviewsCount: 64,
        image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=600&q=80',
        description: 'Dâu tây đà lạt mọng nước xay nhuyễn với trà nhài thanh mát và vụn dừa nướng thơm giòn.',
        tags: ['NEW', 'Dâu tây']
    },
    {
        id: 'p6',
        name: 'Trà Sữa Trân Châu Đường Đen Taiwan',
        category: 'milk-tea',
        isBestSeller: true,
        price: 48000,
        originalPrice: 55000,
        stock: 60,
        rating: 4.9,
        reviewsCount: 310,
        image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=600&q=80',
        description: 'Sữa tươi thanh trùng Dalat Milk sánh mịn hòa cùng đường đen đun chậm nồng nàn và trân châu nóng.',
        tags: ['Signature', 'Đường đen']
    },
    {
        id: 'p7',
        name: 'Trà Măng Cụt Hoa Nhài Macchiato',
        category: 'macchiato',
        isBestSeller: false,
        price: 49000,
        originalPrice: 55000,
        stock: 20,
        rating: 4.8,
        reviewsCount: 52,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
        description: 'Sự kết hợp độc đáo giữa hương nhài thanh tao và thịt măng mút mọng nước, phủ váng sữa đặc biệt.',
        tags: ['Hot Trend']
    },
    {
        id: 'p8',
        name: 'Bánh Mì Phô Mai Tỏi Nướng Bơ',
        category: 'snack',
        isBestSeller: false,
        price: 29000,
        originalPrice: 35000,
        stock: 15,
        rating: 4.7,
        reviewsCount: 88,
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
        description: 'Vỏ bánh mì giòn rụm thơm nức bơ tỏi Pháp, nhân phô mai chảy béo ngậy ăn kèm trà sữa cực cuốn.',
        tags: ['Snack hot']
    },
    {
        id: 'p9',
        name: 'Cà Phê Muối Kem Béo Đậm Vị',
        category: 'macchiato',
        isBestSeller: true,
        price: 35000,
        originalPrice: 40000,
        stock: 50,
        rating: 5.0,
        reviewsCount: 168,
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
        description: 'Cà phê phin nguyên chất đậm đà hòa quyện cùng lớp màng kem muối biển béo ngậy chuẩn vị Huế.',
        tags: ['HOT', 'Best Seller', 'Cà phê']
    }
];

const DEFAULT_VOUCHERS = [
    { code: 'WELCOME10', discount: 10, type: 'percent', minOrder: 50000, description: 'Giảm 10% cho đơn từ 50k' },
    { code: 'BOBA50K', discount: 20000, type: 'fixed', minOrder: 100000, description: 'Giảm 20.000đ cho đơn từ 100k' },
    { code: 'FREESHIP', discount: 15000, type: 'shipping', minOrder: 60000, description: 'Miễn phí vận chuyển 15k' }
];

const DEFAULT_ORDERS = [
    {
        id: 'ORD-9821',
        customerName: 'Nguyễn Văn Anh',
        phone: '0889 045 686',
        address: '1059 Tôn Đản, P. Cẩm Lệ, TP. Đà Nẵng',
        items: [
            {
                name: 'Trà Sữa Nướng Trân Châu Hoàng Kim',
                size: 'L',
                sugar: '70%',
                ice: '70%',
                toppings: ['Trân Châu Hoàng Kim', 'Pudding Trứng Béo Mịn'],
                quantity: 2,
                price: 54000
            }
        ],
        subtotal: 108000,
        shippingFee: 0,
        discount: 10800,
        total: 97200,
        tableNumber: 'Bàn 5',
        paymentMethod: 'Thanh toán ngay (Chuyển khoản VietQR)',
        paymentType: 'online',
        paymentStatus: 'da_chuyen_khoan',
        status: 'completed', // pending, preparing, shipping, completed, cancelled
        createdAt: '2026-08-07 14:05:00',
        note: 'Giao trước 9h sáng giúp mình'
    },
    {
        id: 'ORD-9822',
        customerName: 'Lê Thị Hương',
        phone: '0912 987 654',
        address: '25 Nguyễn Văn Linh, Q. Hải Châu, TP. Đà Nẵng',
        items: [
            {
                name: 'Ô Long Cream Cheese Macchiato',
                size: 'M',
                sugar: '50%',
                ice: '50%',
                toppings: ['Cream Cheese Sữa Dừa'],
                quantity: 1,
                price: 57000
            },
            {
                name: 'Trà Đào Cam Sả Thượng Hạng',
                size: 'L',
                sugar: '100%',
                ice: '100%',
                toppings: ['Thạch Củ Năng Giòn'],
                quantity: 1,
                price: 56000
            }
        ],
        subtotal: 113000,
        shippingFee: 0,
        discount: 15000,
        total: 98000,
        tableNumber: 'Bàn 2',
        paymentMethod: 'Thanh toán sau (Tiền mặt / Tại quầy)',
        paymentType: 'cod',
        paymentStatus: 'chua_thanh_toan',
        status: 'preparing',
        createdAt: '2026-08-07 14:18:00',
        note: 'Cho ống hút to'
    },
    {
        id: 'ORD-9823',
        customerName: 'Trần Hoàng Nam',
        phone: '0933 555 888',
        address: '88 Điện Biên Phủ, Q. Thanh Khê, TP. Đà Nẵng',
        items: [
            {
                name: 'Trà Sữa Trân Châu Đường Đen Taiwan',
                size: 'XL',
                sugar: '70%',
                ice: '70%',
                toppings: ['Trân Châu Đen Dẻo', 'Pudding Trứng Béo Mịn'],
                quantity: 3,
                price: 77000
            }
        ],
        subtotal: 231000,
        shippingFee: 15000,
        discount: 20000,
        total: 226000,
        tableNumber: 'Mang đi',
        paymentMethod: 'Thanh toán ngay (Chuyển khoản VietQR)',
        paymentType: 'online',
        paymentStatus: 'da_chuyen_khoan',
        status: 'pending',
        createdAt: '2026-08-07 08:50:00',
        note: ''
    }
];

const DEFAULT_REVIEWS = [
    {
        id: 'rev1',
        name: 'Trần Ngọc Minh',
        rating: 5,
        date: '2026-08-06',
        comment: 'Trà sữa nướng cực kỳ đậm vị trà, trân châu hoàng kim giòn dẻo không bị cứng chút nào. Đóng gói rất kỹ càng!',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
    },
    {
        id: 'rev2',
        name: 'Phạm Bảo Quốc',
        rating: 5,
        date: '2026-08-05',
        comment: 'Kem cheese macchiato mặn mặn béo ngậy uống cùng trà Ô long nướng siêu hợp. Giao hàng cực nhanh chỉ 15 phút!',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
    },
    {
        id: 'rev3',
        name: 'Đặng Thùy Dương',
        rating: 4,
        date: '2026-08-04',
        comment: 'Trà dâu dừa nướng giải nhiệt rất tốt. Mình dặn 50% đường ngọt vừa phải đúng ý mình thích.',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'
    }
];
