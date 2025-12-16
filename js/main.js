const app = new PointMatrixApp("pointCanvas", "debug");
const pointCanvasElement = document.getElementById("pointCanvas");
const debugElement = document.getElementById("debug");
window.Initialize = false;

// 添加防抖变量
let updateTimeout = null;
const UPDATE_DEBOUNCE_DELAY = 100; // 100ms防抖延迟

/**
 * 改壁纸引擎获取到的颜色
 */
function wallpaperColor(color) {
  return color.map(function (c) {
    return Math.ceil(c * 255);
  });
}

/**
 * debug
 */
function pointsDebug(width, height, rgba) {
  const pointsJson = {
    count: width * height,
    size: {
      width: width,
      height: height,
    },
    points: [],
  };

  for (var x = 1; x <= width; x++) {
    for (var y = 1; y <= height; y++) {
      const point = {
        x: x,
        y: y,
        rgba: rgba,
      };
      pointsJson.points.push(point);
    }
  }
  return pointsJson;
}

/**
 * 读取json数据 (直接赋值给window)
 */
async function getJsonData() {
  window.jsonPoints = await fetch(
    `json/${window.parentPath}/${window.pathAll[window.parentPath]}`
  )
    .then((res) => res.json())
    .then((data) => {
      // console.log(
      //   `json/${window.parentPath}/${window.pathAll[window.parentPath]}`
      // );
      return data;
    })
    .catch((err) => {
      // console.log(
      //   `json/${window.parentPath}/${window.pathAll[window.parentPath]}`
      // );
      return {};
    });
}

window.wallpaperPropertyListener = {
  applyUserProperties: function (properties) {
    wallpaperMatrix(properties);
  },
};

async function wallpaperMatrix(properties) {
  // 初始化
  if (!window.Initialize) {
    window.Initialize = true;

    window.samplingInterval = 3;
    window.pointSize = 1;
    window.pointInterval = 1;
    window.xOffset = 0;
    window.yOffset = 0;
    window.customPoints = false;

    window.imgPoints = {};
    window.jsonPoints = {};

    window.imgPath = "";
    window.rgba = "";

    window.parentPath = "";
    window.parentPathAll = [];
    window.pathAll = {};
  }

  //背景图片
  if (properties.background_image) {
    pointCanvasElement.style.background =
      "url('file:///" + properties.background_image.value + "')";
  }

  // debug颜色 与 debug
  if (properties.debug_color) {
    let customColor = properties.debug_color.value.split(" ");
    let color = `rgba(${wallpaperColor(customColor)},1)`;
    debugElement.style.color = color;
    app.mouseScopeColor = color;
    app.mousePointColor = color;

    window.rgba = color;
  }
  if (properties.debug) {
    let alpha = 1;
    if (properties.debug.value) {
      debugElement.style.visibility = "visible";
      alpha = 1;
    } else {
      debugElement.style.visibility = "hidden";
      alpha = 0;
    }
    app.mouseScopeColor = app.mouseScopeColor.slice(0, -2) + alpha + ")";
    app.mousePointColor = app.mousePointColor.slice(0, -2) + alpha + ")";
  }

  // 动画参数部分 强度 范围 速度
  let WidthHeight =
    (pointCanvasElement.offsetWidth + pointCanvasElement.offsetHeight) / 5;
  if (properties.repulsion_strength) {
    app.repulsionStrength =
      (WidthHeight * properties.repulsion_strength.value) / 500;
  }
  if (properties.repulsion_radius) {
    app.repulsionRadius =
      (WidthHeight * properties.repulsion_radius.value) / 100;
  }
  if (properties.animation_speed) {
    app.animationSpeed = properties.animation_speed.value / 5000;
  }

  // 粒子参数部分 大小 间距 x方向偏移 y方向偏移
  if (properties.point_size) {
    window.pointSize = properties.point_size.value;
  }
  if (properties.points_interval) {
    window.pointInterval = properties.points_interval.value / 100;
  }
  if (properties.x_offset) {
    window.xOffset =
      (properties.x_offset.value / 100) * pointCanvasElement.offsetWidth;
  }
  if (properties.y_offset) {
    window.yOffset =
      (properties.y_offset.value / 100) * pointCanvasElement.offsetHeight;
  }

  // 粒子样式部分 粒子自定义 采样间隔 图片路径
  if (properties.custom_points) {
    window.customPoints = properties.custom_points.value;
  }
  if (properties.sampling_interval) {
    window.samplingInterval = properties.sampling_interval.value;
  }
  if (properties.image_path) {
    window.imgPath = properties.image_path.value;
  }

  // 执行 从图片获取粒子数据
  if (properties.image_path || properties.sampling_interval) {
    if (window.imgPath != "") {
      window.imgPoints = imageToPoints(
        await loadImage("file:///" + window.imgPath),
        window.samplingInterval
      );
    }
  }

  // 执行 从json获取粒子数据 父目录 子文件 获取

  if (properties.parent_path) {
    window.parentPath = properties.parent_path.value;

    await getJsonData();

    if (window.parentPathAll.length == 0) {
      window.parentPathAll = await fetch("project.json")
        .then((res) => res.json())
        .then((data) => {
          const propertiesName = [];
          for (i in data["general"]["properties"]["parent_path"].options) {
            propertiesName.push(
              data["general"]["properties"]["parent_path"].options[i]["value"]
            );
          }
          return propertiesName;
        })
        .catch((err) => {
          console.log(err);
          return {};
        });
    }
  }

  for (i in window.parentPathAll) {
    if (properties[window.parentPathAll[i]]) {
      window.pathAll[window.parentPathAll[i]] =
        properties[window.parentPathAll[i]].value;

      await getJsonData();
    }
  }

  // 执行
  // 清除之前的定时器
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
  // 设置新的定时器
  updateTimeout = setTimeout(() => {
    let points = {};
    if (window.customPoints) {
      points = window.imgPoints;
    } else {
      points = window.jsonPoints;
    }
    if (JSON.stringify(points) === "{}") {
      points = pointsDebug(70, 70, window.rgba);
    }
    // console.log(points);
    app.putPoints(
      points,
      window.pointSize,
      window.pointInterval,
      window.xOffset,
      window.yOffset
    );

    // 执行后清除定时器引用
    updateTimeout = null;
  }, UPDATE_DEBOUNCE_DELAY);
}
