const test = require('node:test');
const assert = require('node:assert');
const { validateImportData } = require('../src/services/importService');

test('Kiểm thử Import: Phát hiện đúng hàng hợp lệ và hàng lỗi cho Ai là triệu phú', () => {
  const sampleRows = [
    // Dòng 1: Hợp lệ
    {
      question: 'Nội dung câu hỏi 1',
      option_a: 'Phương án A',
      option_b: 'Phương án B',
      option_c: 'Phương án C',
      option_d: 'Phương án D',
      correct_answer: 'A',
      explanation: 'Giải thích',
      image: '',
      time_limit: 30,
      points: 100
    },
    // Dòng 2: Thiếu đáp án đúng
    {
      question: 'Nội dung câu hỏi 2',
      option_a: 'Phương án A',
      option_b: 'Phương án B',
      option_c: 'Phương án C',
      option_d: 'Phương án D',
      correct_answer: 'Z', // Sai quy cách
      explanation: '',
      image: '',
      time_limit: 30,
      points: 100
    },
    // Dòng 3: Thiếu nội dung câu hỏi
    {
      question: '',
      option_a: 'A',
      option_b: 'B',
      option_c: 'C',
      option_d: 'D',
      correct_answer: 'B',
      time_limit: 30,
      points: 100
    }
  ];

  const result = validateImportData(sampleRows, 'millionaire');

  assert.strictEqual(result.headersValid, true, 'Tiêu đề cột phải hợp lệ');
  assert.strictEqual(result.totalRows, 3, 'Tổng số dòng phải bằng 3');
  assert.strictEqual(result.validRows.length, 1, 'Chỉ có 1 dòng hợp lệ');
  assert.strictEqual(result.errorRows.length, 2, 'Phải có 2 dòng bị báo lỗi');
  assert.strictEqual(result.canImport, true, 'Hệ thống cho phép lưu các dòng hợp lệ');
});

test('Kiểm thử Import: Chống nhập trùng câu hỏi', () => {
  const duplicateRows = [
    {
      question: 'Câu hỏi bị trùng lặp',
      option_a: 'A',
      option_b: 'B',
      option_c: 'C',
      option_d: 'D',
      correct_answer: 'A',
      explanation: '',
      image: '',
      time_limit: 30,
      points: 100
    },
    {
      question: 'Câu hỏi bị trùng lặp', // Trùng nội dung question
      option_a: 'A',
      option_b: 'B',
      option_c: 'C',
      option_d: 'D',
      correct_answer: 'B',
      explanation: '',
      image: '',
      time_limit: 30,
      points: 100
    }
  ];

  const result = validateImportData(duplicateRows, 'millionaire');
  assert.strictEqual(result.validRows.length, 1, 'Chỉ chấp nhận 1 dòng đầu tiên');
  assert.strictEqual(result.errorRows.length, 1, 'Dòng thứ 2 phải bị báo lỗi trùng lặp');
});
