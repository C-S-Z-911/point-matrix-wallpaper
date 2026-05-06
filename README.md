# 基于明日方舟官网制作的动态粒子壁纸(新)

[![Wallpaper Engine](https://img.shields.io/badge/Wallpaper%20Engine-✓-green?logo=steam)](https://store.steampowered.com/app/431960/Wallpaper_Engine/)

> steam创意工坊:https://steamcommunity.com/sharedfiles/filedetails/?id=3624878007

## [功能特性]
- **更改/自定义粒子图案**
- **更改光标外边框**
- **将图片转成粒子特效**

## [json格式]
```
{
  "count": 4239,      //粒子数量,只会参与一次计算 用来判断粒子是否超出上限
  "size": {           //粒子整体宽高
    "width": 1000,
    "height": 500
  },
  "points": [         //粒子数据  x轴y轴位置 rgba颜色编码
    {"x": 248, "y": 132, "rgba": "#ffffffff"},
    {"x": 252, "y": 132, "rgba": "#808080ff"},
    ...
  ]
}
```
- **注意事项**
  - 粒子数量超过10000可能会造成卡顿
  - 使用自定义粒子样式时尽量使用透明背景的单色logo 或 颜色较少的图片
