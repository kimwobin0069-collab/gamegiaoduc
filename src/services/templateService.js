const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const TEMPLATES_DIR = path.join(__dirname, '../../templates');
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// Cấu trúc cột chuẩn theo đúng yêu cầu đề bài
const TEMPLATE_SCHEMAS = {
  millionaire: {
    filename: 'mau_import_ai_la_trieu_phu.xlsx',
    name: 'Mẫu Ai là triệu phú (Trắc nghiệm)',
    columns: [
      'question',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct_answer',
      'explanation',
      'image',
      'time_limit',
      'points'
    ],
    placeholder: {
      question: 'Nội dung câu hỏi',
      option_a: 'Phương án A',
      option_b: 'Phương án B',
      option_c: 'Phương án C',
      option_d: 'Phương án D',
      correct_answer: 'A',
      explanation: 'Giải thích đáp án',
      image: '',
      time_limit: 30,
      points: 100
    }
  },
  wheel: {
    filename: 'mau_import_chiec_non_ky_dieu.xlsx',
    name: 'Mẫu Chiếc nón kỳ diệu',
    columns: [
      'keyword',
      'category',
      'hint_1',
      'hint_2',
      'hint_3',
      'image'
    ],
    placeholder: {
      keyword: 'TU KHOA BI MAT',
      category: 'Chủ đề từ khóa',
      hint_1: 'Gợi ý 1',
      hint_2: 'Gợi ý 2',
      hint_3: 'Gợi ý 3',
      image: ''
    }
  },
  obstacle: {
    filename: 'mau_import_vuot_chuong_ngai_vat.xlsx',
    name: 'Mẫu Vượt chướng ngại vật',
    columns: [
      'question',
      'answer',
      'explanation',
      'tile_index',
      'image',
      'points'
    ],
    placeholder: {
      question: 'Nội dung câu hỏi hàng ngang',
      answer: 'DAP AN',
      explanation: 'Giải thích',
      tile_index: 1,
      image: '',
      points: 10
    }
  },
  acceleration: {
    filename: 'mau_import_tang_toc.xlsx',
    name: 'Mẫu Tăng tốc',
    columns: [
      'question',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct_answer',
      'explanation',
      'time_limit',
      'max_points'
    ],
    placeholder: {
      question: 'Nội dung câu hỏi tăng tốc',
      option_a: 'Phương án A',
      option_b: 'Phương án B',
      option_c: 'Phương án C',
      option_d: 'Phương án D',
      correct_answer: 'B',
      explanation: 'Giải thích',
      time_limit: 30,
      max_points: 40
    }
  },
  crossword: {
    filename: 'mau_import_o_chu_bi_mat.xlsx',
    name: 'Mẫu Ô chữ bí mật',
    columns: [
      'clue',
      'answer',
      'keyword_position',
      'row_number',
      'hint',
      'image'
    ],
    placeholder: {
      clue: 'Gợi ý cho hàng ngang',
      answer: 'DAP AN O CHU',
      keyword_position: 3,
      row_number: 1,
      hint: 'Gợi ý thêm',
      image: ''
    }
  },
  price_is_right: {
    filename: 'mau_import_hay_chon_gia_dung.xlsx',
    name: 'Mẫu Hãy chọn giá đúng',
    columns: [
      'item_name',
      'description',
      'image',
      'correct_price',
      'minimum_price',
      'maximum_price',
      'tolerance',
      'unit'
    ],
    placeholder: {
      item_name: 'Tên sản phẩm',
      description: 'Mô tả chi tiết',
      image: '',
      correct_price: 150000,
      minimum_price: 100000,
      maximum_price: 200000,
      tolerance: 5000,
      unit: 'VNĐ'
    }
  }
};

/**
 * Sinh tất cả file mẫu Excel chỉ có tiêu đề cột (hoặc dòng placeholder kiểm thử)
 */
function generateAllTemplates(includePlaceholder = false) {
  for (const [key, schema] of Object.entries(TEMPLATE_SCHEMAS)) {
    const wb = XLSX.utils.book_new();
    const rows = includePlaceholder ? [schema.placeholder] : [];
    const ws = XLSX.utils.json_to_sheet(rows, { header: schema.columns });
    
    // Đặt độ rộng cột tự động
    ws['!cols'] = schema.columns.map(() => ({ wch: 22 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    const filePath = path.join(TEMPLATES_DIR, schema.filename);
    XLSX.writeFile(wb, filePath);
  }
  console.log('[TemplateService] Đã tạo thành công 6 file Excel mẫu trong thư mục templates/');
}

function getTemplatePath(gameTypeCode) {
  const schema = TEMPLATE_SCHEMAS[gameTypeCode];
  if (!schema) return null;
  const filePath = path.join(TEMPLATES_DIR, schema.filename);
  if (!fs.existsSync(filePath)) {
    generateAllTemplates();
  }
  return filePath;
}

function getTemplateInfo(gameTypeCode) {
  return TEMPLATE_SCHEMAS[gameTypeCode] || null;
}

function getAllTemplatesList() {
  return Object.keys(TEMPLATE_SCHEMAS).map(code => ({
    code,
    ...TEMPLATE_SCHEMAS[code]
  }));
}

module.exports = {
  TEMPLATE_SCHEMAS,
  generateAllTemplates,
  getTemplatePath,
  getTemplateInfo,
  getAllTemplatesList
};
