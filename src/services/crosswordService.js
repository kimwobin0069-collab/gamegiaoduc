/**
 * Dịch vụ Dựng Lưới Ô Chữ Tự Động (Dynamic Crossword Grid)
 */

function generateCrosswordGrid(questions) {
  if (!questions || questions.length === 0) {
    return {
      grid: [],
      maxColumns: 0,
      keywordColumnIndex: 0,
      keywordWord: '',
      warnings: []
    };
  }

  const warnings = [];
  let maxLeft = 0;
  let maxRight = 0;
  let keywordWord = '';

  // Phân tích từng hàng ngang
  const analyzedRows = questions.map((q, idx) => {
    const rawAnswer = (q.data && q.data.answer ? q.data.answer : (q.answer || '')).toUpperCase().trim();
    // Bỏ khoảng trắng khi đếm chữ cái
    const letters = rawAnswer.replace(/\s+/g, '').split('');
    const kwPos = Number(q.data && q.data.keyword_position ? q.data.keyword_position : (q.keyword_position || 1));

    if (kwPos < 1 || kwPos > letters.length) {
      warnings.push(`Hàng ${idx + 1} ("${rawAnswer}") có vị trí từ khóa ${kwPos} không hợp lệ (độ dài: ${letters.length}).`);
    }

    const validKwPos = Math.max(1, Math.min(letters.length, kwPos));
    const leftCount = validKwPos - 1; // Số chữ cái trước ô từ khóa
    const rightCount = letters.length - validKwPos; // Số chữ cái sau ô từ khóa

    if (leftCount > maxLeft) maxLeft = leftCount;
    if (rightCount > maxRight) maxRight = rightCount;

    // Ký tự tạo nên từ khóa dọc
    keywordWord += letters[validKwPos - 1] || '';

    return {
      questionId: q._id ? q._id.toString() : `q_${idx}`,
      rowNumber: q.data && q.data.row_number ? q.data.row_number : (idx + 1),
      clue: q.question_text || q.clue || '',
      hint: q.data && q.data.hint ? q.data.hint : '',
      answer: rawAnswer,
      letters,
      keywordPosition: validKwPos,
      leftCount,
      rightCount
    };
  });

  const totalColumns = maxLeft + 1 + maxRight;
  const keywordColumnIndex = maxLeft;

  if (totalColumns > 24) {
    warnings.push(`Lưới ô chữ có độ rộng ${totalColumns} cột, có thể hơi nhỏ khi trình chiếu trên TV.`);
  }

  // Dựng mảng ô cho từng hàng
  const grid = analyzedRows.map(row => {
    const offset = keywordColumnIndex - (row.keywordPosition - 1);
    const cells = [];

    for (let c = 0; c < totalColumns; c++) {
      if (c < offset || c >= offset + row.letters.length) {
        cells.push({
          type: 'empty',
          char: '',
          isKeyword: false
        });
      } else {
        const letterIndex = c - offset;
        const isKeyword = (c === keywordColumnIndex);
        cells.push({
          type: 'letter',
          char: row.letters[letterIndex],
          letterIndex,
          isKeyword,
          cellId: `cell_${row.rowNumber}_${letterIndex}`
        });
      }
    }

    return {
      ...row,
      offset,
      cells
    };
  });

  return {
    grid,
    maxColumns: totalColumns,
    keywordColumnIndex,
    keywordWord,
    warnings
  };
}

module.exports = {
  generateCrosswordGrid
};
