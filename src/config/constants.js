/**
 * Hằng số và Cấu hình Hệ thống Trò chơi Học tập
 */
const GAME_TYPES = [
  {
    code: 'millionaire',
    name: 'Ai là triệu phú',
    description: 'Gameshow trí tuệ với 4 phương án lựa chọn, thang tiền thưởng bậc thang và 3 quyền trợ giúp kịch tính.',
    icon: 'bi-gem',
    color: '#3b82f6',
    default_config: {
      time_limit: 30,
      lifelines: ['50:50', 'ask_class', 'teacher_hint'],
      ladder: [100, 200, 300, 500, 1000, 2000, 3000, 6000, 10000, 14000, 22000, 30000, 40000, 60000, 85000]
    }
  },
  {
    code: 'wheel',
    name: 'Chiếc nón kỳ diệu',
    description: 'Vòng quay điểm thưởng hồi hộp kết hợp đoán từ khóa ô chữ theo từng chữ cái tiếng Việt.',
    icon: 'bi-pie-chart-fill',
    color: '#ec4899',
    default_config: {
      sectors: [
        { label: '100', value: 100, type: 'points', color: '#ef4444' },
        { label: '200', value: 200, type: 'points', color: '#3b82f6' },
        { label: '300', value: 300, type: 'points', color: '#10b981' },
        { label: '400', value: 400, type: 'points', color: '#f59e0b' },
        { label: '500', value: 500, type: 'points', color: '#8b5cf6' },
        { label: 'Nhân đôi', value: 2, type: 'double', color: '#ec4899' },
        { label: 'Mất điểm', value: 0, type: 'lose_points', color: '#6b7280' },
        { label: 'Mất lượt', value: 0, type: 'lose_turn', color: '#1f2937' },
        { label: 'Phần thưởng', value: 1000, type: 'reward', color: '#fbbf24' },
        { label: 'Cộng điểm', value: 250, type: 'bonus', color: '#06b6d4' }
      ]
    }
  },
  {
    code: 'obstacle',
    name: 'Vượt chướng ngại vật',
    description: 'Giải mã bức tranh bí mật qua các câu hỏi hàng ngang, đoán từ khóa chướng ngại vật bất cứ lúc nào.',
    icon: 'bi-puzzle-fill',
    color: '#8b5cf6',
    default_config: {
      tiles_count: 4,
      time_limit: 15,
      obstacle_base_points: 80,
      points_decay_per_tile: 10
    }
  },
  {
    code: 'acceleration',
    name: 'Tăng tốc',
    description: 'Cuộc đua trả lời câu hỏi với điểm số giảm dần theo thời gian, kịch tính trong từng giây cuối.',
    icon: 'bi-lightning-charge-fill',
    color: '#f59e0b',
    default_config: {
      default_time: 30,
      points_ladder: [40, 30, 20, 10]
    }
  },
  {
    code: 'crossword',
    name: 'Ô chữ bí mật',
    description: 'Lưới ô chữ thông minh tự động căn chỉnh, mở từng chữ cái hoặc cả hàng, nổi bật từ khóa hàng dọc.',
    icon: 'bi-grid-3x3',
    color: '#10b981',
    default_config: {
      keyword_highlight_color: '#ffd700'
    }
  },
  {
    code: 'price_is_right',
    name: 'Hãy chọn giá đúng',
    description: 'Đoán giá sản phẩm, thiết bị; hệ thống tự tính độ chênh lệch, đội đoán gần nhất giành chiến thắng.',
    icon: 'bi-tag-fill',
    color: '#06b6d4',
    default_config: {
      strict_rule: false, // true = không được vượt quá giá thật
      points_first: 50,
      points_second: 30,
      points_third: 10
    }
  }
];

const DEFAULT_TEAMS = [
  { name: 'Đội Đỏ', color: '#ef4444' },
  { name: 'Đội Xanh Lam', color: '#3b82f6' },
  { name: 'Đội Vàng', color: '#eab308' },
  { name: 'Đội Xanh Lá', color: '#10b981' },
  { name: 'Đội Tím', color: '#8b5cf6' },
  { name: 'Đội Cam', color: '#f97316' }
];

const VIETNAMESE_ALPHABET = [
  'A', 'Ă', 'Â', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'G', 'H', 'I',
  'K', 'L', 'M', 'N', 'O', 'Ô', 'Ơ', 'P', 'Q', 'R', 'S', 'T',
  'U', 'Ư', 'V', 'X', 'Y'
];

module.exports = {
  GAME_TYPES,
  DEFAULT_TEAMS,
  VIETNAMESE_ALPHABET
};
