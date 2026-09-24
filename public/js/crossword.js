/**
 * Logic Vẽ và Hiển Thị Lưới Ô Chữ Bí Mật (Dynamic Crossword Grid)
 */
function renderCrosswordGrid(containerId, gridData) {
  const container = document.getElementById(containerId);
  if (!container || !gridData || !gridData.grid) return;

  container.innerHTML = '';
  const { grid, keywordColumnIndex } = gridData;

  grid.forEach((row, rIdx) => {
    const rowEl = document.createElement('div');
    rowEl.style.display = 'flex';
    rowEl.style.alignItems = 'center';
    rowEl.style.gap = '5px';

    // Số thứ tự hàng
    const numEl = document.createElement('div');
    numEl.style.width = '32px';
    numEl.style.height = '36px';
    numEl.style.display = 'flex';
    numEl.style.alignItems = 'center';
    numEl.style.justifyContent = 'center';
    numEl.style.fontWeight = '800';
    numEl.style.color = 'var(--accent-gold)';
    numEl.style.fontSize = '0.95rem';
    numEl.innerText = row.rowNumber;
    rowEl.appendChild(numEl);

    // Các ô chữ
    row.cells.forEach((cell, cIdx) => {
      const cellEl = document.createElement('div');
      cellEl.style.width = '42px';
      cellEl.style.height = '42px';
      cellEl.style.display = 'flex';
      cellEl.style.alignItems = 'center';
      cellEl.style.justifyContent = 'center';
      cellEl.style.fontWeight = '800';
      cellEl.style.fontSize = '1.25rem';
      cellEl.style.borderRadius = '6px';
      cellEl.style.transition = 'all 0.3s ease';

      if (cell.type === 'empty') {
        cellEl.style.background = 'transparent';
      } else {
        cellEl.id = cell.cellId;
        if (cell.isKeyword) {
          cellEl.style.background = 'rgba(255, 215, 0, 0.2)';
          cellEl.style.border = '2px solid var(--accent-gold)';
          cellEl.style.color = 'var(--accent-gold)';
          cellEl.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.3)';
        } else {
          cellEl.style.background = '#0e1836';
          cellEl.style.border = '1px solid rgba(255,255,255,0.2)';
          cellEl.style.color = '#fff';
        }
        cellEl.innerText = cell.char || '';
      }

      rowEl.appendChild(cellEl);
    });

    container.appendChild(rowEl);
  });
}

window.renderCrosswordGrid = renderCrosswordGrid;
