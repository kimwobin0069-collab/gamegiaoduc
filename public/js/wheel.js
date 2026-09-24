/**
 * Logic Vẽ và Quay Vòng Quay Chiếc Nón Kỳ Diệu (Canvas Wheel of Fortune)
 */
function initWheel(canvasId, sectors, onFinish) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2 - 10;
  const numSectors = sectors.length;
  const arc = (2 * Math.PI) / numSectors;

  let currentAngle = 0;
  let isSpinning = false;

  function drawWheel(angle = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ từng nan quạt
    for (let i = 0; i < numSectors; i++) {
      const startAngle = angle + i * arc;
      const endAngle = startAngle + arc;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = sectors[i].color || '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Vẽ nhãn chữ
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 17px Outfit, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(sectors[i].label, radius - 20, 6);
      ctx.restore();
    }

    // Vẽ tâm nón
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#070b19';
    ctx.fill();
  }

  function spinToSector(targetIndex, durationMs = 4000) {
    if (isSpinning) return;
    isSpinning = true;

    // Tính toán góc đích để kim (bên phải 0 rad) chỉ đúng targetIndex
    const fullRotations = 5 + Math.floor(Math.random() * 3); // 5 đến 7 vòng quay
    // Kim chỉ ở góc 0 (hướng 3 giờ). Sector targetIndex nằm ở góc `targetIndex * arc`
    const targetAngle = (fullRotations * 2 * Math.PI) + (2 * Math.PI - (targetIndex * arc + arc / 2));
    
    const startTime = performance.now();
    const startAngle = currentAngle;
    let lastSectorClick = -1;

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Easing cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);
      currentAngle = startAngle + (targetAngle - startAngle) * ease;

      drawWheel(currentAngle);

      // Âm thanh click khi qua nan quạt
      const currentSector = Math.floor(((currentAngle % (2 * Math.PI)) / arc));
      if (currentSector !== lastSectorClick) {
        lastSectorClick = currentSector;
        if (window.gameshowAudio) window.gameshowAudio.playWheelClick();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isSpinning = false;
        if (onFinish) onFinish(sectors[targetIndex]);
      }
    }

    requestAnimationFrame(animate);
  }

  drawWheel(0);

  return {
    draw: drawWheel,
    spin: spinToSector
  };
}

window.initWheel = initWheel;
