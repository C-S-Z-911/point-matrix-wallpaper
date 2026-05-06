class PointMatrixApp {
  constructor(appId, debugId) {
    // 获取Canvas debug和上下文Data
    this.canvas = document.getElementById(appId);
    this.debugElement = document.getElementById(debugId);
    this.ctx = this.canvas.getContext("2d");

    // 替换内容
    this.debugElement.innerHTML =
      "<p>FPS:</p><p>点数量:</p><p>每帧更新:</p><p></p>";

    // 性能计数器
    this.fps = 60;
    this.lastTime = 0;
    this.frameCount = 0;

    // 初始化参数
    this.repulsionStrength = 4;
    this.repulsionRadius = 128;
    this.animationSpeed = 0.05;

    // 鼠标位置
    this.mouseX = 0;
    this.mouseY = 0;

    // 鼠标效果
    this.mouseScopeColor = "rgba(255, 255, 255, 0)";
    this.mouseScopeWider = 1;
    this.mousePointColor = "rgba(255, 255, 255, 0)";
    this.mousePointRadius = 2;

    //粒子数量上限
    this.particleQuantity = 10000;

    // 点阵数据
    this.points = [];

    // 对象池 - 重用点对象减少垃圾回收
    this.pointPool = [];

    // 初始化
    this.init();
  }

  /**
   * 回收点对象到对象池随机位置
   */
  recyclePoint(point) {
    const index = Math.floor(Math.random() * (this.pointPool.length + 1));
    this.pointPool.splice(index, 0, point);
  }

  /**
   * 获取或创建点对象
   * 使用对象池减少垃圾回收
   */
  getPoint() {
    if (this.pointPool.length > 0) {
      return this.pointPool.pop();
    }
    return {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      originalX: 0,
      originalY: 0,
      color: "rgba(255, 0, 0, 0.7)",
      size: 1,
      updateCount: 0,
    };
  }

  /**
   * 设置点阵图形
   */
  putPoints(pointsJson, pointSize = 1, interval = 1, xOffset = 0, yOffset = 0) {
    // 回收旧点
    for (let point of this.points) {
      this.recyclePoint(point);
    }

    this.points = [];

    if (pointsJson.points.length <= this.particleQuantity) {
      this.debugElement.children[3].textContent = "";
      for (let pointData of pointsJson.points) {
        const point = this.getPoint();
        const pointWidth =
          (this.canvas.width - pointsJson.size.width * interval + xOffset) / 2;
        const pointHeight =
          (this.canvas.height - pointsJson.size.height * interval - yOffset) /
          2;
        if (point.x == 0 || point.y == 0) {
          point.x = Math.random() * this.canvas.width;
          point.y = Math.random() * this.canvas.height;
        }
        point.targetX = pointData.x * interval + pointWidth;
        point.targetY = pointData.y * interval + pointHeight;
        point.originalX = point.targetX;
        point.originalY = point.targetY;
        point.color = pointData.rgba;
        point.size = pointSize;
        this.points.push(point);
      }
    } else {
      this.debugElement.children[3].textContent =
        `警告:点数量大于最大值${this.particleQuantity}`;
    }
    this.debugElement.children[1].textContent = `粒子数量:${this.points.length}`;
  }

  /**
   * 初始化应用
   */
  init() {
    // 设置Canvas尺寸
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    // 设置事件监听
    this.setupEventListeners();
    // 开始动画循环
    this.animate(0);
  }

  /**
   * 设置Canvas尺寸
   */
  resizeCanvas() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 鼠标移动事件
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.mouseX = 0;
      this.mouseY = 0;
    });
  }

  /**
   * 批量绘制点
   * 使用单个路径绘制所有点，减少Canvas API调用
   */
  drawPoints() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 按颜色分组绘制（中等优化）
    const colorGroups = {};

    // 1. 按颜色分组
    for (let point of this.points) {
      if (!colorGroups[point.color]) {
        colorGroups[point.color] = [];
      }
      colorGroups[point.color].push(point);
    }

    // 2. 按颜色批量绘制
    for (let color in colorGroups) {
      this.ctx.fillStyle = color;
      this.ctx.beginPath();

      const group = colorGroups[color];
      for (let point of group) {
        this.ctx.moveTo(point.x + point.size, point.y);
        this.ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
      }

      this.ctx.fill();
    }
    // 绘制鼠标位置的光晕
    this.drawMouseHalo();
  }

  /**
   * 绘制鼠标位置的光晕效果
   */
  drawMouseHalo() {
    if (
      this.mouseX > 0 &&
      this.mouseX < this.canvas.width &&
      this.mouseY > 0 &&
      this.mouseY < this.canvas.height
    ) {
      // 绘制排斥范围圆圈
      this.ctx.beginPath();
      this.ctx.arc(
        this.mouseX,
        this.mouseY,
        this.repulsionRadius,
        0,
        Math.PI * 2
      );
      this.ctx.strokeStyle = this.mouseScopeColor;
      this.ctx.lineWidth = this.mouseScopeWider;
      this.ctx.stroke();

      // 绘制鼠标位置点
      this.ctx.beginPath();
      this.ctx.arc(
        this.mouseX,
        this.mouseY,
        this.mousePointRadius,
        0,
        Math.PI * 2
      );
      this.ctx.fillStyle = this.mousePointColor;
      this.ctx.fill();
    }
  }

  /**
   * 更新点阵位置
   * 处理点移动到目标位置和鼠标排斥效果
   */
  updatePoints() {
    let pointsUpdated = 0;

    // 更新所有点
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];

      // 平滑移动到目标位置
      if (this.moveToTarget(point)) {
        pointsUpdated++;
      }

      // 应用鼠标排斥效果
      if (this.applyMouseRepulsion(point)) {
        pointsUpdated++;
      }

      // 边界检查
      this.constrainPointToBounds(point);

      point.updateCount++;
    }

    // 更新性能计数器
    this.debugElement.children[2].textContent = `每帧更新:${pointsUpdated}`;
  }

  /**
   * 将点平滑移动到目标位置
   * 返回是否进行了移动
   */
  moveToTarget(point) {
    const dx = point.targetX - point.x;
    const dy = point.targetY - point.y;

    // 如果距离很小，直接设置到目标位置
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
      point.x = point.targetX;
      point.y = point.targetY;
      return false;
    }

    // 使用缓动函数平滑移动
    point.x += dx * this.animationSpeed;
    point.y += dy * this.animationSpeed;

    return true;
  }

  /**
   * 应用鼠标排斥效果
   * 返回是否应用了排斥力
   */
  applyMouseRepulsion(point) {
    const dx = this.mouseX - point.x;
    const dy = this.mouseY - point.y;
    const distanceSq = dx * dx + dy * dy;
    const repulsionRadiusSq = this.repulsionRadius * this.repulsionRadius;

    // 检查点是否在排斥范围内
    if (distanceSq < repulsionRadiusSq) {
      // 计算排斥力（距离越近，排斥力越强）
      const distance = Math.sqrt(distanceSq);
      const force = (this.repulsionRadius - distance) / this.repulsionRadius;
      const forceStrength = force * this.repulsionStrength;

      // 计算排斥方向（远离鼠标）
      const angle = Math.atan2(dy, dx);
      const moveX = -Math.cos(angle) * forceStrength;
      const moveY = -Math.sin(angle) * forceStrength;

      // 应用排斥力
      point.x += moveX;
      point.y += moveY;

      return true;
    }

    return false;
  }

  /**
   * 将点限制在画布边界内
   */
  constrainPointToBounds(point) {
    if (point.x < 0) point.x = 0;
    if (point.x > this.canvas.width) point.x = this.canvas.width;
    if (point.y < 0) point.y = 0;
    if (point.y > this.canvas.height) point.y = this.canvas.height;
  }

  /**
   * 动画循环
   */
  animate(timestamp) {
    // 计算FPS
    this.frameCount++;
    if (timestamp - this.lastTime >= 1000) {
      this.fps = Math.round(
        (this.frameCount * 1000) / (timestamp - this.lastTime)
      );
      this.frameCount = 0;
      this.lastTime = timestamp;
      this.debugElement.children[0].textContent = `FPS:${this.fps}`;
    }

    // 更新和绘制点
    this.updatePoints();
    this.drawPoints();

    // 请求下一帧
    requestAnimationFrame((t) => this.animate(t));
  }
}
