/**
 * 加载图片
 */
async function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败: ${source}`));
    img.src = source;
  });
}

/**
 * 从图片生成点矩阵
 */
function imageToPoints(image, interval = 3) {
  // 创建Canvas来读取像素数据
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const width = (canvas.width = image.width);
  const height = (canvas.height = image.height);

  // 绘制图片到Canvas
  ctx.drawImage(image, 0, 0);

  // 获取像素数据
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const points = [];
  let count = 0;

  // 间隔遍历像素
  for (let y = 0; y < height; y += interval) {
    for (let x = 0; x < width; x += interval) {
      // 计算在一维数组中的索引
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];

      // 只处理不透明像素
      if (alpha !== 0) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        points.push({
          x: x,
          y: y,
          rgba: `rgba(${r}, ${g}, ${b}, ${(alpha / 255).toFixed(2)})`,
        });
        count++;
      }
    }
  }
  return {
    count: count,
    size: {
      width: width,
      height: height,
    },
    points: points,
  };
}
