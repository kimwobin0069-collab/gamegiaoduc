const XLSX = require('xlsx');
const fs = require('fs');
const { TEMPLATE_SCHEMAS } = require('./templateService');

/**
 * Đọc dữ liệu từ file (.xlsx, .csv, .json)
 */
function parseFile(filePath, fileType) {
  if (fileType === 'json') {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  // Đọc Excel hoặc CSV bằng thư viện xlsx
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { defval: '' });
}

/**
 * Xác thực và phân loại từng dòng dữ liệu import
 */
function validateImportData(rows, gameTypeCode, existingQuestions = []) {
  const schema = TEMPLATE_SCHEMAS[gameTypeCode];
  if (!schema) {
    throw new Error(`Loại trò chơi '${gameTypeCode}' không hợp lệ.`);
  }

  const requiredColumns = schema.columns;
  if (!rows || rows.length === 0) {
    return {
      headersValid: false,
      missingColumns: [],
      totalRows: 0,
      validRows: [],
      errorRows: [{ rowNumber: 1, errors: ['Tệp rỗng hoặc không có dòng dữ liệu nào.'] }],
      canImport: false
    };
  }

  // Kiểm tra tên cột
  const firstRow = rows[0];
  const fileColumns = Object.keys(firstRow).map(c => c.trim().toLowerCase());
  const missingColumns = requiredColumns.filter(
    col => !fileColumns.includes(col.toLowerCase())
  );

  if (missingColumns.length > 0) {
    return {
      headersValid: false,
      missingColumns,
      totalRows: rows.length,
      validRows: [],
      errorRows: [{
        rowNumber: 1,
        errors: [`Thiếu các cột bắt buộc: ${missingColumns.join(', ')}`]
      }],
      canImport: false
    };
  }

  const validRows = [];
  const errorRows = [];
  const seenTexts = new Set(existingQuestions.map(q => q.trim().toLowerCase()));

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // Dòng 1 là tiêu đề
    const errors = [];
    const cleanRow = {};

    // Chuẩn hóa tên trường
    for (const key of Object.keys(row)) {
      cleanRow[key.trim().toLowerCase()] = typeof row[key] === 'string' ? row[key].trim() : row[key];
    }

    // 1. Kiểm tra theo từng loại trò chơi
    if (gameTypeCode === 'millionaire' || gameTypeCode === 'acceleration') {
      const qText = cleanRow['question'];
      if (!qText) errors.push('Thiếu nội dung câu hỏi (question).');
      if (!cleanRow['option_a']) errors.push('Thiếu phương án A (option_a).');
      if (!cleanRow['option_b']) errors.push('Thiếu phương án B (option_b).');
      if (!cleanRow['option_c']) errors.push('Thiếu phương án C (option_c).');
      if (!cleanRow['option_d']) errors.push('Thiếu phương án D (option_d).');

      const ans = (cleanRow['correct_answer'] || '').toString().toUpperCase().trim();
      if (!['A', 'B', 'C', 'D'].includes(ans)) {
        errors.push(`Đáp án đúng phải là một trong các chữ cái A, B, C, D (nhận được: '${ans}').`);
      } else {
        cleanRow['correct_answer'] = ans;
      }

      // Kiểm tra trùng lặp
      if (qText) {
        const lowerQ = qText.toLowerCase();
        if (seenTexts.has(lowerQ)) {
          errors.push(`Trùng lặp câu hỏi với câu đã có: "${qText}".`);
        } else {
          seenTexts.add(lowerQ);
        }
      }

      // Kiểm tra thời gian & điểm
      if (cleanRow['time_limit']) {
        const t = Number(cleanRow['time_limit']);
        if (isNaN(t) || t <= 0) errors.push('Thời gian (time_limit) phải là số dương.');
      }
      if (cleanRow['points'] || cleanRow['max_points']) {
        const p = Number(cleanRow['points'] || cleanRow['max_points']);
        if (isNaN(p) || p < 0) errors.push('Điểm số phải là số lớn hơn hoặc bằng 0.');
      }
    } 
    else if (gameTypeCode === 'wheel') {
      const kw = cleanRow['keyword'];
      if (!kw) errors.push('Thiếu từ khóa bí mật (keyword).');
      if (kw) {
        const lowerKw = kw.toLowerCase();
        if (seenTexts.has(lowerKw)) {
          errors.push(`Trùng lặp từ khóa: "${kw}".`);
        } else {
          seenTexts.add(lowerKw);
        }
      }
    } 
    else if (gameTypeCode === 'obstacle') {
      const qText = cleanRow['question'];
      const ans = cleanRow['answer'];
      if (!qText) errors.push('Thiếu nội dung câu hỏi hàng ngang (question).');
      if (!ans) errors.push('Thiếu đáp án hàng ngang (answer).');
      if (cleanRow['tile_index']) {
        const tile = Number(cleanRow['tile_index']);
        if (isNaN(tile) || tile <= 0) errors.push('Chỉ số mảnh ghép (tile_index) phải là số dương.');
      }
      if (qText) {
        const lowerQ = qText.toLowerCase();
        if (seenTexts.has(lowerQ)) {
          errors.push(`Trùng lặp câu hỏi: "${qText}".`);
        } else {
          seenTexts.add(lowerQ);
        }
      }
    } 
    else if (gameTypeCode === 'crossword') {
      const clue = cleanRow['clue'];
      const ans = cleanRow['answer'];
      const kwPos = Number(cleanRow['keyword_position']);
      if (!clue) errors.push('Thiếu câu gợi ý (clue).');
      if (!ans) errors.push('Thiếu đáp án ô chữ (answer).');
      if (isNaN(kwPos) || kwPos <= 0) {
        errors.push('Vị trí từ khóa (keyword_position) phải là số nguyên dương.');
      } else if (ans) {
        const pureLen = ans.replace(/\s+/g, '').length;
        if (kwPos > pureLen) {
          errors.push(`Vị trí từ khóa (${kwPos}) vượt quá độ dài đáp án (${pureLen} chữ cái).`);
        }
      }
      if (clue) {
        const lowerClue = clue.toLowerCase();
        if (seenTexts.has(lowerClue)) {
          errors.push(`Trùng lặp câu gợi ý: "${clue}".`);
        } else {
          seenTexts.add(lowerClue);
        }
      }
    } 
    else if (gameTypeCode === 'price_is_right') {
      const itemName = cleanRow['item_name'];
      const correctPrice = Number(cleanRow['correct_price']);
      if (!itemName) errors.push('Thiếu tên sản phẩm (item_name).');
      if (isNaN(correctPrice) || correctPrice < 0) {
        errors.push('Giá đúng (correct_price) phải là một con số hợp lệ.');
      }
      if (cleanRow['minimum_price'] && isNaN(Number(cleanRow['minimum_price']))) {
        errors.push('Giá tối thiểu (minimum_price) phải là số hợp lệ.');
      }
      if (cleanRow['maximum_price'] && isNaN(Number(cleanRow['maximum_price']))) {
        errors.push('Giá tối đa (maximum_price) phải là số hợp lệ.');
      }
      if (itemName) {
        const lowerName = itemName.toLowerCase();
        if (seenTexts.has(lowerName)) {
          errors.push(`Trùng lặp tên sản phẩm: "${itemName}".`);
        } else {
          seenTexts.add(lowerName);
        }
      }
    }

    if (errors.length > 0) {
      errorRows.push({
        rowNumber,
        data: cleanRow,
        errors
      });
    } else {
      validRows.push({
        rowNumber,
        data: cleanRow
      });
    }
  });

  return {
    headersValid: true,
    missingColumns: [],
    totalRows: rows.length,
    validRows,
    errorRows,
    canImport: validRows.length > 0
  };
}

/**
 * Xuất file Excel báo cáo danh sách các dòng bị lỗi để tải xuống
 */
function createErrorReportWorkbook(errorRows) {
  const wb = XLSX.utils.book_new();
  const reportData = errorRows.map(err => ({
    'Dòng Số': err.rowNumber,
    'Chi Tiết Lỗi': err.errors.join(' | '),
    'Dữ Liệu Thô': JSON.stringify(err.data || {})
  }));

  const ws = XLSX.utils.json_to_sheet(reportData);
  ws['!cols'] = [{ wch: 10 }, { wch: 45 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Danh Sách Lỗi');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  parseFile,
  validateImportData,
  createErrorReportWorkbook
};
