import * as turf from 'turf/turf'
//启用cesium
export default function getcesium(){
  Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjOGI0NmQyMS1lMjFmLTQ0MGItOGRkZi1iNTRhZTc3OTM1Y2QiLCJpZCI6NjM1MjYsImlhdCI6MTY1OTk0NjcwMn0.jwvRvTl3aHwMb1V7up0OjejVr1uFhrm6OlrjUUFcgsI'
  let viewer = new Cesium.Viewer("cesiumContainer",{
    animation:false,//左下角仪表盘
    baseLayerPicker:false,//图层选择器
    fullscreenButton:false,//全屏按钮
    geocoder:false,//右上角查询
    homeButton:false,//home按钮
    infoBox:false,//信息框
    sceneModePicker:false,//三维地球选择器
    selectionIndicator:true,//选取指示器
    timeline:false,//时间轴
    navigationHelpButton:false,//右上角帮助按钮
    scene3DOnly:false,//节约GPU资源
/*    terrainProvider:Cesium.createWorldTerrain({
      requestVertexNormals:true,//地形光照
      requestWaterMask:true//水面波浪
    })//加载地形服务*/
  });
  viewer._cesiumWidget._creditContainer.style.display = "none";//去除版权标记
/*  //调用天地图
  viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
    url: "http://t0.tianditu.gov.cn/cia_w/wmts?tk=0a10eb11030f25a500b74ce968d28f95",
    layer: "cia",
    style: "default",
    tileMatrixSetID: "w",
    format: "tiles",
    maximumLevel: 18
  }))
  viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
    url:'http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={x}&TILECOL={y}&tk=0a10eb11030f25a500b74ce968d28f95',
    layer:'img',
    style:'default',
    tileMatrixSetID:'w'
  }))*/
  return viewer
}

//距离测量
export class MeasureDistance {
  constructor(viewer) {
    this.viewer = viewer;
    this.initEvents();
    this.positions = [];
    this.tempPositions = [];
    this.vertexEntities = [];
    this.labelEntity = undefined;
    this.measureDistance = 0; //测量结果
  }

  //初始化事件
  initEvents() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.MeasureStartEvent = new Cesium.Event(); //开始事件
    this.MeasureEndEvent = new Cesium.Event(); //结束事件
  }

  spaceDistance(points){
    if(points.length>=2){
      var point1=Cesium.Cartographic.fromCartesian(points[points.length-2]);
      var point2=Cesium.Cartographic.fromCartesian(points[points.length-1]);
      const geodesic=new Cesium.EllipsoidGeodesic();
      geodesic.setEndPoints(point1,point2);
      let s=geodesic.surfaceDistance;//地表距离
      s=Math.sqrt(Math.pow(s,2)+Math.pow(point2.height-point1.height,2));
      return s
    }
  }

  //激活
  activate() {
    this.deactivate();
    this.registerEvents(); //注册鼠标事件
    //设置鼠标状态
    this.viewer.enableCursorStyle = false;
    this.viewer._element.style.cursor = 'default';
    this.isMeasure = true;
    this.measureDistance = 0;
  }

  //禁用
  deactivate() {
    if (!this.isMeasure) return;
    this.unRegisterEvents();
    this.viewer._element.style.cursor = 'pointer';
    this.viewer.enableCursorStyle = true;
    this.isMeasure = false;
    this.tempPositions = [];
    this.positions = [];
  }

  //清空绘制
  clear() {
    //清除线对象
    this.viewer.entities.remove(this.lineEntity);
    this.lineEntity = undefined;
    //清除节点
    this.vertexEntities.forEach(item => {
      this.viewer.entities.remove(item);
    });
    this.vertexEntities = [];
  }

  //创建线对象
  createLineEntity() {
    this.lineEntity = this.viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(e => {
          return this.tempPositions;
        }, false),
        width: 2,
        material: Cesium.Color.YELLOW,
        depthFailMaterial: Cesium.Color.YELLOW
      }
    })
  }

  //创建线节点
  createVertex() {
    let vertexEntity = this.viewer.entities.add({
      position: this.positions[this.positions.length - 1],
      id: "MeasureDistanceVertex" + this.positions[this.positions.length - 1],
      type: "MeasureDistanceVertex",
      label: {
        text: this.spaceDistance(this.positions) + "米",
        scale: 0.5,
        font: 'normal 24px MicroSoft YaHei',
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -30),
        outlineWidth: 9,
        outlineColor: Cesium.Color.WHITE
      },
      point: {
        color: Cesium.Color.FUCHSIA,
        pixelSize: 8,
        disableDepthTestDistance: 500,
      },
    });
    this.vertexEntities.push(vertexEntity);
  }

  //创建起点
  createStartEntity() {
    let vertexEntity = this.viewer.entities.add({
      position: this.positions[0],
      type: "MeasureDistanceVertex",
      billboard: {
        image: require('../assets/1.png'),//点图标
        scale:0.1,
        scaleByDistance: new Cesium.NearFarScalar(300, 1, 1200, 0.4), //设置随图缩放距离和比例
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10000), //设置可见距离 10000米可见
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
      },
      point: {
        color: Cesium.Color.FUCHSIA,
        pixelSize: 6,
      },
    });
    this.vertexEntities.push(vertexEntity);
  }

  //创建终点节点
  createEndEntity() {
    //结束时删除最后一个节点的距离标识
    let lastLabel = this.viewer.entities.getById("MeasureDistanceVertex" + this.positions[this.positions.length - 1]);
    this.viewer.entities.remove(lastLabel);
    this.viewer.entities.remove(this.moveVertexEntity);

    let vertexEntity = this.viewer.entities.add({
      position: this.positions[this.positions.length - 1],
      type: "MeasureDistanceVertex",
      label: {
        text: "总距离：" + this.spaceDistance(this.positions) + "米",
        scale: 0.5,
        font: 'normal 26px MicroSoft YaHei',
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5000),
        scaleByDistance: new Cesium.NearFarScalar(1000, 1, 3000, 0.4),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -50),
        outlineWidth: 9,
        outlineColor: Cesium.Color.WHITE,
        eyeOffset: new Cesium.Cartesian3(0, 0, -10)
      },
      billboard: {
        image: require('../assets/1.png'),//点图标
        scale:0.1,
        scaleByDistance: new Cesium.NearFarScalar(300, 1, 1200, 0.4), //设置随图缩放距离和比例
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10000), //设置可见距离 10000米可见
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
      },
      point: {
        color: Cesium.Color.FUCHSIA,
        pixelSize: 6,
      },
    });
    this.vertexEntities.push(vertexEntity);
  }

  //注册鼠标事件
  registerEvents() {
    this.leftClickEvent();
    this.rightClickEvent();
    this.mouseMoveEvent();
  }

  //左键点击事件
  leftClickEvent() {
    //单击鼠标左键画点点击事件
    this.handler.setInputAction(e => {
      this.viewer._element.style.cursor = 'default';
      let position = this.viewer.scene.pickPosition(e.position);
      if (!position) {
        const ellipsoid = this.viewer.scene.globe.ellipsoid;
        position = this.viewer.scene.camera.pickEllipsoid(e.position, ellipsoid);
      }
      if (!position) return;
      this.positions.push(position);
      if (this.positions.length == 1) { //首次点击
        this.createLineEntity();
        this.createStartEntity();
        return;
      }
      this.createVertex();

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  //鼠标移动事件
  mouseMoveEvent() {
    this.handler.setInputAction(e => {
      if (!this.isMeasure) return;
      this.viewer._element.style.cursor = 'default';
      let position = this.viewer.scene.pickPosition(e.endPosition);
      if (!position) {
        position = this.viewer.scene.camera.pickEllipsoid(e.startPosition, this.viewer.scene.globe.ellipsoid);
      }
      if (!position) return;
      this.handleMoveEvent(position);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  //处理鼠标移动
  handleMoveEvent(position) {
    if (this.positions.length < 1) return;
    this.tempPositions = this.positions.concat(position);
  }

  //右键事件
  rightClickEvent() {
    this.handler.setInputAction(e => {
      if (!this.isMeasure || this.positions.length < 1) {
        this.deactivate();
        this.clear();
      } else {
        this.createEndEntity();
        this.lineEntity.polyline = {
          positions: this.positions,
          width: 2,
          material: Cesium.Color.YELLOW,
          depthFailMaterial: Cesium.Color.YELLOW
        };
        this.measureEnd();
      }

    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  //测量结束
  measureEnd() {
    this.deactivate();
    this.MeasureEndEvent.raiseEvent(this.measureDistance); //触发结束事件 传入结果
  }

  //解除鼠标事件
  unRegisterEvents() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }
}

//面积测量
export class MeasureArea {
  constructor(viewer) {
    this.viewer = viewer;
    this.initEvents();
    this.positions = [];
    this.tempPositions = [];
    this.vertexEntities = [];
    this.labelEntity = undefined;
    this.measureArea = 0; //测量结果
  }

  //初始化事件
  initEvents() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.MeasureStartEvent = new Cesium.Event(); //开始事件
    this.MeasureEndEvent = new Cesium.Event(); //结束事件
  }

  //激活
  activate() {
    this.deactivate();
    this.registerEvents(); //注册鼠标事件
    //设置鼠标状态
    this.viewer.enableCursorStyle = false;
    this.viewer._element.style.cursor = 'default';
    this.isMeasure = true;
    this.measureArea = 0;
  }

  computeArea(points){
    var radiansPerDegree = Math.PI / 180.0;//角度转化为弧度(rad)
    var degreesPerRadian = 180.0 / Math.PI;//弧度转化为角度

    /*角度*/
    function Angle(p1, p2, p3) {
      var bearing21 = Bearing(p2, p1);
      var bearing23 = Bearing(p2, p3);
      var angle = bearing21 - bearing23;
      if (angle < 0) {
        angle += 360;
      }
      return angle;
    }

    /*方向*/
    function Bearing(from, to) {
      from = Cesium.Cartographic.fromCartesian(from);
      to = Cesium.Cartographic.fromCartesian(to);

      var lat1 = from.latitude;
      var lon1 = from.longitude;
      var lat2 = to.latitude;
      var lon2 = to.longitude;
      var angle = -Math.atan2(Math.sin(lon1 - lon2) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2));
      if (angle < 0) {
        angle += Math.PI * 2.0;
      }
      angle = angle * degreesPerRadian;//角度
      return angle;
    }

    function distance(point1, point2) {
      var point1cartographic = Cesium.Cartographic.fromCartesian(point1);
      var point2cartographic = Cesium.Cartographic.fromCartesian(point2);
      /**根据经纬度计算出距离**/
      var geodesic = new Cesium.EllipsoidGeodesic();
      geodesic.setEndPoints(point1cartographic, point2cartographic);
      var s = geodesic.surfaceDistance;
      //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
      //返回两点之间的距离
      s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
      return s;
    }

    var res = 0;
    //拆分三角曲面

    for (var i = 0; i < points.length - 2; i++) {
      var j = (i + 1) % points.length;
      var k = (i + 2) % points.length;
      var totalAngle = Angle(points[i], points[j], points[k]);


      var dis_temp1 = distance(points[j], points[0]);
      var dis_temp2 = distance(points[k], points[0]);
      res += dis_temp1 * dis_temp2 * Math.sin(totalAngle) / 2;
      // console.log(res);
    }
    res = Math.abs(res).toFixed(4);
    return res;
  }

  //禁用
  deactivate() {
    if (!this.isMeasure) return;
    this.unRegisterEvents();
    this.viewer._element.style.cursor = 'pointer';
    this.viewer.enableCursorStyle = true;
    this.isMeasure = false;
    this.tempPositions = [];
    this.positions = [];
    this.height = undefined;
  }

  //清空绘制
  clear() {
    //清除线面对象
    this.viewer.entities.remove(this.polygonEntity);
    this.polygonEntity = undefined;

    //清除节点
    this.vertexEntities.forEach(item => {
      this.viewer.entities.remove(item);
    });
    this.vertexEntities = [];

    this.viewer.entities.remove(this.mesureResultEntity);
    this.mesureResultEntity = undefined;

    this.height = undefined;
  }

  //创建面对象
  createPolygonEntity() {
    this.polygonEntity = this.viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.CallbackProperty(e => {
          return new Cesium.PolygonHierarchy(this.tempPositions);
          //使用最新1.72的时候 必须返回PolygonHierarchy类型 Cannot read property 'length' of undefined
          //低版本好像都可以
        }, false),
        material: Cesium.Color.RED.withAlpha(0.4),
        perPositionHeight: true, //
      },
      polyline: {
        positions: new Cesium.CallbackProperty(e => {
          return this.tempPositions.concat(this.tempPositions[0]);
        }, false),
        width: 1,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.YELLOW,
        }),
        depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.YELLOW,
        }),
      }

    })
  }

  //创建节点
  createVertex() {
    let vertexEntity = this.viewer.entities.add({
      position: this.positions[this.positions.length - 1],
      type: "MeasureAreaVertex",
      point: {
        color: Cesium.Color.FUCHSIA,
        pixelSize: 8,
        disableDepthTestDistance: 500,
      },
    });
    this.vertexEntities.push(vertexEntity);
  }

  //测量结果标签
  createResultLabel() {
    this.mesureResultEntity = this.viewer.entities.add({
      position: new Cesium.CallbackProperty(e => {
        return this.getCenterPosition()
      }, false),
      type: "MeasureAreaResult",
      label: {
        text: new Cesium.CallbackProperty(e => {
          return "面积" + this.computeArea(this.tempPositions) + "平方米";
        }, false),
        font: 'normal 28px MicroSoft YaHei',
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(20, 20),
        outlineWidth: 9,
        outlineColor: Cesium.Color.YELLOW
      },
    });

  }

  //获取节点的中心点
  getCenterPosition() {
    let points = [];
    if (this.tempPositions.length < 3) return this.tempPositions[0];
    this.tempPositions.forEach(position => {
      const point3d = this.cartesian3ToPoint3D(position);
      points.push([point3d.x, point3d.y]);
    })

    //构建turf.js  lineString
    let geo = turf.lineString(points);
    let bbox = turf.bbox(geo);
    let bboxPolygon = turf.bboxPolygon(bbox);
    let pointOnFeature = turf.center(bboxPolygon);
    let lonLat = pointOnFeature.geometry.coordinates;

    return Cesium.Cartesian3.fromDegrees(lonLat[0], lonLat[1], this.height + 0.3);
  }


  //注册鼠标事件
  registerEvents() {
    this.leftClickEvent();
    this.rightClickEvent();
    this.mouseMoveEvent();
  }

  //左键点击事件
  leftClickEvent() {
    //单击鼠标左键画点点击事件
    this.handler.setInputAction(e => {
      this.viewer._element.style.cursor = 'default';
      let position = this.viewer.scene.pickPosition(e.position);
      if (!position) {
        const ellipsoid = this.viewer.scene.globe.ellipsoid;
        position = this.viewer.scene.camera.pickEllipsoid(e.position, ellipsoid);
      }
      if (!position) return;
      this.positions.push(position);
      this.height = this.unifiedHeight(this.positions, this.height);
      if (this.positions.length == 1) { //首次点击
        this.createPolygonEntity();
      }
      this.createVertex();

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  //鼠标移动事件
  mouseMoveEvent() {
    this.handler.setInputAction(e => {
      if (!this.isMeasure) return;
      this.viewer._element.style.cursor = 'default';
      let position = this.viewer.scene.pickPosition(e.endPosition);
      if (!position) {
        position = this.viewer.scene.camera.pickEllipsoid(e.startPosition, this.viewer.scene.globe.ellipsoid);
      }
      if (!position) return;
      this.handleMoveEvent(position);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  //处理鼠标移动
  handleMoveEvent(position) {
    if (this.positions.length < 1) return;

    this.height = this.unifiedHeight(this.positions, this.height);
    this.tempPositions = this.positions.concat(position);
    if (this.tempPositions.length >= 3 && !this.mesureResultEntity) {
      this.createResultLabel();
    }
  }

  //统一节点的高度
  unifiedHeight(positions, height) {
    if (!height) height = this.getPositionHeight(positions[0]); //如果没有指定高度 就用第一个的高度
    let point3d;
    for (let i = 0; i < positions.length; i++) {
      const element = positions[i];
      point3d = this.cartesian3ToPoint3D(element);
      positions[i] = Cesium.Cartesian3.fromDegrees(point3d.x, point3d.y, height)
    }

    return height;
  }

  //获取某个点的高度
  getPositionHeight(position) {
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    return cartographic.height;
  }

  cartesian3ToPoint3D(position) {
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    const lon = Cesium.Math.toDegrees(cartographic.longitude);
    const lat = Cesium.Math.toDegrees(cartographic.latitude);
    return { x: lon, y: lat, z: cartographic.height };
  }


  //右键事件
  rightClickEvent() {
    this.handler.setInputAction(e => {
      if (!this.isMeasure || this.positions.length < 3) {
        this.deactivate();
        this.clear();
      } else {
        this.tempPositions = [...this.positions];
        this.polygonEntity.polyline = {
          positions: this.positions.concat(this.positions[0]),
          width: 2,
          material: Cesium.Color.YELLOW,
          depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.YELLOW,
          }),
        };

        this.polygonEntity.polygon.hierarchy = new Cesium.PolygonHierarchy(this.tempPositions);
        this.mesureResultEntity.position = this.getCenterPosition();
        this.mesureResultEntity.label.text = "总面积" + this.computeArea(this.positions) + "平方米"
        this.measureEnd();
      }

    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  //测量结束
  measureEnd() {
    this.deactivate();
    this.MeasureEndEvent.raiseEvent(this.measureArea); //触发结束事件 传入结果
  }

  //解除鼠标事件
  unRegisterEvents() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }
}

//大雾效果
export  class FogEffect {
  constructor(viewer, options) {
    if (!viewer) throw new Error('no viewer object!');
    options = options || {};
    this.visibility = Cesium.defaultValue(options.visibility, 0.1);
    this.color = Cesium.defaultValue(options.color,
      new Cesium.Color(0.8, 0.8, 0.8, 1));
    this._show = Cesium.defaultValue(options.show, !0);
    this.viewer = viewer;
    this.init();
  }

  init() {
    this.fogStage = new Cesium.PostProcessStage({
      name: 'czm_fog',
      fragmentShader: this.fog(),
      uniforms: {
        visibility: () => {
          return this.visibility;
        },
        fogColor: () => {
          return this.color;
        }
      }
    });
    this.viewer.scene.postProcessStages.add(this.fogStage);
  }

  //关闭大雾效果
  destroy() {
    if (!this.viewer || !this.fogStage) return;
    this.viewer.scene.postProcessStages.remove(this.fogStage);
    this.fogStage.destroy();
    delete this.visibility;
    delete this.color;
  }

  show(visible) {
    this._show = visible;
    this.fogState.enabled = this._show;
  }

  fog() {
    //通过调整float f = visibility * (depthcolor.r - 0.3) / n 的n来控制雾霾浓度，n值越高雾霾浓度越低
    return "uniform sampler2D colorTexture;\n\
         uniform sampler2D depthTexture;\n\
         uniform float visibility;\n\
         uniform vec4 fogColor;\n\
         varying vec2 v_textureCoordinates; \n\
         void main(void) \n\
         { \n\
            vec4 origcolor = texture2D(colorTexture, v_textureCoordinates); \n\
            float depth = czm_readDepth(depthTexture, v_textureCoordinates); \n\
            vec4 depthcolor = texture2D(depthTexture, v_textureCoordinates); \n\
            float f = visibility * (depthcolor.r - 0.3) / 0.2; \n\
            if (f < 0.0) f = 0.0; \n\
            else if (f > 1.0) f = 1.0; \n\
            gl_FragColor = mix(origcolor, fogColor, f); \n\
         }\n";
  }
}

//雪天效果
export class SnowEffect {
  constructor(viewer, options) {
    if (!viewer) throw new Error('no viewer object!');
    options = options || {};
    this.snowSize = Cesium.defaultValue(options.snowSize, 0.02); //最好小于0.02
    this.snowSpeed = Cesium.defaultValue(options.snowSpeed, 60.0);
    this.viewer = viewer;
    this.init();
  }

  init() {
    this.snowStage = new Cesium.PostProcessStage({
      name: 'czm_snow',
      fragmentShader: this.snow(),
      uniforms: {
        snowSize: () => {
          return this.snowSize;
        },
        snowSpeed: () => {
          return this.snowSpeed;
        }
      }
    });
    this.viewer.scene.postProcessStages.add(this.snowStage);
  }

  destroy() {
    if (!this.viewer || !this.snowStage) return;
    this.viewer.scene.postProcessStages.remove(this.snowStage);
    this.snowStage.destroy();
    delete this.snowSize;
    delete this.snowSpeed;
  }

  show(visible) {
    this.snowStage.enabled = visible;
  }

  snow() {
    return "uniform sampler2D colorTexture;\n\
            varying vec2 v_textureCoordinates;\n\
            uniform float snowSpeed;\n\
                    uniform float snowSize;\n\
            float snow(vec2 uv,float scale)\n\
            {\n\
                float time=czm_frameNumber/snowSpeed;\n\
                float w=smoothstep(1.,0.,-uv.y*(scale/10.));if(w<.1)return 0.;\n\
                uv+=time/scale;uv.y+=time*2./scale;uv.x+=sin(uv.y+time*.5)/scale;\n\
                uv*=scale;vec2 s=floor(uv),f=fract(uv),p;float k=3.,d;\n\
                p=.5+.35*sin(11.*fract(sin((s+p+scale)*mat2(7,3,6,5))*5.))-f;d=length(p);k=min(d,k);\n\
                k=smoothstep(0.,k,sin(f.x+f.y)*snowSize);\n\
                return k*w;\n\
            }\n\
            void main(void){\n\
                vec2 resolution=czm_viewport.zw;\n\
                vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n\
                vec3 finalColor=vec3(0);\n\
                //float c=smoothstep(1.,0.3,clamp(uv.y*.3+.8,0.,.75));\n\
                float c=0.;\n\
                c+=snow(uv,30.)*.0;\n\
                c+=snow(uv,20.)*.0;\n\
                c+=snow(uv,15.)*.0;\n\
                c+=snow(uv,10.);\n\
                c+=snow(uv,8.);\n\
                c+=snow(uv,6.);\n\
                c+=snow(uv,5.);\n\
                finalColor=(vec3(c));\n\
                gl_FragColor=mix(texture2D(colorTexture,v_textureCoordinates),vec4(finalColor,1),.5);\n\
                }\n\
                ";
  }
}

//雨天效果
export class RainEffect {
  constructor(viewer, options) {
    if (!viewer) throw new Error('no viewer object!');
    options = options || {};
    //倾斜角度，负数向右，正数向左
    this.tiltAngle = Cesium.defaultValue(options.tiltAngle, -.6);
    this.rainSize = Cesium.defaultValue(options.rainSize, 0.3);
    this.rainSpeed = Cesium.defaultValue(options.rainSpeed, 60.0);
    this.viewer = viewer;
    this.init();
  }

  init() {
    this.rainStage = new Cesium.PostProcessStage({
      name: 'czm_rain',
      fragmentShader: this.rain(),
      uniforms: {
        tiltAngle: () => {
          return this.tiltAngle;
        },
        rainSize: () => {
          return this.rainSize;
        },
        rainSpeed: () => {
          return this.rainSpeed;
        }
      }
    });
    this.viewer.scene.postProcessStages.add(this.rainStage);
  }

  destroy() {
    if (!this.viewer || !this.rainStage) return;
    this.viewer.scene.postProcessStages.remove(this.rainStage);
    this.rainStage.destroy();
    delete this.tiltAngle;
    delete this.rainSize;
    delete this.rainSpeed;
  }

  show(visible) {
    this.rainStage.enabled = visible;
  }

  rain() {
    return "uniform sampler2D colorTexture;\n\
                varying vec2 v_textureCoordinates;\n\
                uniform float tiltAngle;\n\
                uniform float rainSize;\n\
                uniform float rainSpeed;\n\
                float hash(float x) {\n\
                    return fract(sin(x * 133.3) * 13.13);\n\
                }\n\
                void main(void) {\n\
                    float time = czm_frameNumber / rainSpeed;\n\
                    vec2 resolution = czm_viewport.zw;\n\
                    vec2 uv = (gl_FragCoord.xy * 2. - resolution.xy) / min(resolution.x, resolution.y);\n\
                    vec3 c = vec3(.6, .7, .8);\n\
                    float a = tiltAngle;\n\
                    float si = sin(a), co = cos(a);\n\
                    uv *= mat2(co, -si, si, co);\n\
                    uv *= length(uv + vec2(0, 4.9)) * rainSize + 1.;\n\
                    float v = 1. - sin(hash(floor(uv.x * 100.)) * 2.);\n\
                    float b = clamp(abs(sin(20. * time * v + uv.y * (5. / (2. + v)))) - .95, 0., 1.) * 20.;\n\
                    c *= v * b;\n\
                    gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(c, 1), .5);\n\
                }\n\
                ";
  }
}

//火焰特效
export  class FireEffect{
  constructor(viewer) {
    this.viewer=viewer
    this.viewModel={
      emissionRate: 5,
      gravity: 0.0,//设置重力参数
      minimumParticleLife: 1,
      maximumParticleLife: 6,
      minimumSpeed: 1.0,//粒子发射的最小速度
      maximumSpeed: 4.0,//粒子发射的最大速度
      startScale: 0.0,
      endScale: 10.0,
      particleSize: 25.0,
    }
    this.emitterModelMatrix = new Cesium.Matrix4()
    this.translation = new Cesium.Cartesian3()
    this.rotation = new Cesium.Quaternion()
    this.hpr = new Cesium.HeadingPitchRoll()
    this.trs = new Cesium.TranslationRotationScale()
    this.scene = this.viewer.scene
    this.particleSystem=''
    this.entity = this.viewer.entities.add({
      //选择粒子放置的坐标
      position: Cesium.Cartesian3.fromDegrees(
        116.34485552299206,
        39.99754814959118
      ),
    });
    this.init();
  }

  init(){
    const _this=this
    this.viewer.clock.shouldAnimate = true;
    this.viewer.scene.globe.depthTestAgainstTerrain = false;
    this.viewer.trackedEntity = this.entity;
    var particleSystem = this.scene.primitives.add(
      new Cesium.ParticleSystem({
        image: require('../assets/fire.png'),//生成所需粒子的图片路径
        //粒子在生命周期开始时的颜色
        startColor:  new Cesium.Color(1, 1, 1, 1),
        //粒子在生命周期结束时的颜色
        endColor: new Cesium.Color(0.5, 0, 0, 0),
        //粒子在生命周期开始时初始比例
        startScale: _this.viewModel.startScale,
        //粒子在生命周期结束时比例
        endScale: _this.viewModel.endScale,
        //粒子发射的最小速度
        minimumParticleLife: _this.viewModel.minimumParticleLife,
        //粒子发射的最大速度
        maximumParticleLife: _this.viewModel.maximumParticleLife,
        //粒子质量的最小界限
        minimumSpeed: _this.viewModel.minimumSpeed,
        //粒子质量的最大界限
        maximumSpeed: _this.viewModel.maximumSpeed,
        //以像素为单位缩放粒子图像尺寸
        imageSize: new Cesium.Cartesian2(
          _this.viewModel.particleSize,
          _this.viewModel.particleSize
        ),
        //每秒发射的粒子数
        emissionRate: _this.viewModel.emissionRate,
        //粒子系统发射粒子的时间（秒）
        lifetime: 16.0,
        //粒子系统是否应该在完成时循环其爆发
        loop: true,
        //设置粒子的大小是否以米或像素为单位
        sizeInMeters: true,
        //系统的粒子发射器
        emitter: new Cesium.ConeEmitter(Cesium.Math.toRadians(45.0)),//BoxEmitter 盒形发射器，ConeEmitter 锥形发射器，SphereEmitter 球形发射器，CircleEmitter圆形发射器
      })
    );
    this.particleSystem=particleSystem;
    this.preUpdateEvent()
  }

  //场景渲染事件
  preUpdateEvent() {
    let _this=this;
    this.viewer.scene.preUpdate.addEventListener(function (scene, time) {
      //发射器地理位置
      _this.particleSystem.modelMatrix = _this.computeModelMatrix(_this.entity, time);
      //发射器局部位置
      _this.particleSystem.emitterModelMatrix = _this.computeEmitterModelMatrix();
      // 将发射器旋转
      if (_this.viewModel.spin) {
        _this.viewModel.heading += 1.0;
        _this.viewModel.pitch += 1.0;
        _this.viewModel.roll += 1.0;
      }
    });
  }

  computeModelMatrix(entity, time) {
    return entity.computeModelMatrix(time, new Cesium.Matrix4());
  }

  computeEmitterModelMatrix() {
    this.hpr = Cesium.HeadingPitchRoll.fromDegrees(0.0, 0.0, 0.0, this.hpr);
    this.trs.translation = Cesium.Cartesian3.fromElements(
      -4.0,
      0.0,
      1.4,
      this.translation
    );
    this.trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(this.hpr, this.rotation);

    return Cesium.Matrix4.fromTranslationRotationScale(
      this.trs,
      this.emitterModelMatrix
    );
  }

  removeEvent(){
    this.viewer.scene.preUpdate.removeEventListener(this.preUpdateEvent, this);
    this.emitterModelMatrix = undefined;
    this.translation = undefined;
    this.rotation = undefined;
    this.hpr = undefined;
    this.trs = undefined;
  }

  //移除粒子特效
  remove() {
    ()=>{return this.removeEvent()}; //清除事件
    this.viewer.scene.primitives.remove(this.particleSystem); //删除粒子对象
    this.viewer.entities.remove(this.entity); //删除entity
  }

}

//喷水特效
export  class waterEffect{
  constructor(viewer) {
    this.viewer=viewer
    this.viewModel={
      emissionRate: 5,
      gravity: 0.0,//设置重力参数
      minimumParticleLife: 1,
      maximumParticleLife: 6,
      minimumSpeed: 1.0,//粒子发射的最小速度
      maximumSpeed: 4.0,//粒子发射的最大速度
      startScale: 0.0,
      endScale: 10.0,
      particleSize: 25.0,
    }
    this.emitterModelMatrix = new Cesium.Matrix4()
    this.translation = new Cesium.Cartesian3()
    this.rotation = new Cesium.Quaternion()
    this.hpr = new Cesium.HeadingPitchRoll()
    this.trs = new Cesium.TranslationRotationScale()
    this.scene = this.viewer.scene
    this.particleSystem=''
    this.entity = this.viewer.entities.add({
      //选择粒子放置的坐标
      position: Cesium.Cartesian3.fromDegrees(
        116.34485552299206,
        39.99754814959118
      ),
    });
    this.init();
  }

  init(){
    const _this=this
    this.viewer.clock.shouldAnimate = true;
    this.viewer.scene.globe.depthTestAgainstTerrain = false;
    this.viewer.trackedEntity = this.entity;
    var particleSystem = this.scene.primitives.add(
      new Cesium.ParticleSystem({
        image: require('../assets/water.png'),//生成所需粒子的图片路径
        //粒子在生命周期开始时的颜色
        startColor: new Cesium.Color(1, 1, 1, 0.6),
        //粒子在生命周期结束时的颜色
        endColor: new Cesium.Color(0.80, 0.86, 1, 0.4),
        //粒子在生命周期开始时初始比例
        startScale: _this.viewModel.startScale,
        //粒子在生命周期结束时比例
        endScale: _this.viewModel.endScale,
        //粒子发射的最小速度
        minimumParticleLife: _this.viewModel.minimumParticleLife,
        //粒子发射的最大速度
        maximumParticleLife: _this.viewModel.maximumParticleLife,
        //粒子质量的最小界限
        minimumSpeed: _this.viewModel.minimumSpeed,
        //粒子质量的最大界限
        maximumSpeed: _this.viewModel.maximumSpeed,
        //以像素为单位缩放粒子图像尺寸
        imageSize: new Cesium.Cartesian2(
          _this.viewModel.particleSize,
          _this.viewModel.particleSize
        ),
        //每秒发射的粒子数
        emissionRate: _this.viewModel.emissionRate,
        //粒子系统发射粒子的时间（秒）
        lifetime: 16.0,
        //设置粒子的大小是否以米或像素为单位
        sizeInMeters: true,
        //系统的粒子发射器
        emitter: new Cesium.CircleEmitter(0.2),//BoxEmitter 盒形发射器，ConeEmitter 锥形发射器，SphereEmitter 球形发射器，CircleEmitter圆形发射器
        //回调函数，实现各种喷泉、烟雾效果
        updateCallback: (p, dt) => {
          return this.applyGravity(p, dt);
        },
      })
    );
    this.particleSystem=particleSystem;
    this.preUpdateEvent()
  }

  //场景渲染事件
  preUpdateEvent() {
    let _this=this;
    this.viewer.scene.preUpdate.addEventListener(function (scene, time) {
      //发射器地理位置
      _this.particleSystem.modelMatrix = _this.computeModelMatrix(_this.entity, time);
      //发射器局部位置
      _this.particleSystem.emitterModelMatrix = _this.computeEmitterModelMatrix();
      // 将发射器旋转
      if (_this.viewModel.spin) {
        _this.viewModel.heading += 1.0;
        _this.viewModel.pitch += 1.0;
        _this.viewModel.roll += 1.0;
      }
    });
  }

  computeModelMatrix(entity, time) {
    return entity.computeModelMatrix(time, new Cesium.Matrix4());
  }

  computeEmitterModelMatrix() {
    this.hpr = Cesium.HeadingPitchRoll.fromDegrees(0.0, 0.0, 0.0, this.hpr);
    this.trs.translation = Cesium.Cartesian3.fromElements(
      -4.0,
      0.0,
      1.4,
      this.translation
    );
    this.trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(this.hpr, this.rotation);

    return Cesium.Matrix4.fromTranslationRotationScale(
      this.trs,
      this.emitterModelMatrix
    );
  }

  applyGravity(p, dt){
    var gravityScratch = new Cesium.Cartesian3()
    var position = p.position
    Cesium.Cartesian3.normalize(position, gravityScratch)
    Cesium.Cartesian3.fromElements(
      20 * dt,
      gravityScratch.y * dt,
      -30 * dt,
      gravityScratch
    );
    p.velocity = Cesium.Cartesian3.add(p.velocity, gravityScratch, p.velocity)
  }

  removeEvent(){
    this.viewer.scene.preUpdate.removeEventListener(this.preUpdateEvent, this);
    this.emitterModelMatrix = undefined;
    this.translation = undefined;
    this.rotation = undefined;
    this.hpr = undefined;
    this.trs = undefined;
  }

  //移除粒子特效
  remove() {
    ()=>{return this.removeEvent()}; //清除事件
    this.viewer.scene.primitives.remove(this.particleSystem); //删除粒子对象
    this.viewer.entities.remove(this.entity); //删除entity
  }

}

//爆炸特效
export  class explotEffect{
  constructor(viewer) {
    this.viewer=viewer
    this.viewModel={
      emissionRate: 5,
      gravity: 0.0,//设置重力参数
      minimumParticleLife: 1,
      maximumParticleLife: 6,
      minimumSpeed: 1.0,//粒子发射的最小速度
      maximumSpeed: 4.0,//粒子发射的最大速度
      startScale: 0.0,
      endScale: 10.0,
      particleSize: 25.0,
    }
    this.emitterModelMatrix = new Cesium.Matrix4()
    this.translation = new Cesium.Cartesian3()
    this.rotation = new Cesium.Quaternion()
    this.hpr = new Cesium.HeadingPitchRoll()
    this.trs = new Cesium.TranslationRotationScale()
    this.scene = this.viewer.scene
    this.particleSystem=''
    this.entity = this.viewer.entities.add({
      //选择粒子放置的坐标
      position: Cesium.Cartesian3.fromDegrees(
        116.34485552299206,
        39.99754814959118
      ),
    });
    this.init();
  }

  init(){
    const _this=this
    this.viewer.clock.shouldAnimate = true;
    this.viewer.scene.globe.depthTestAgainstTerrain = false;
    this.viewer.trackedEntity = this.entity;
    var particleSystem = this.scene.primitives.add(
      new Cesium.ParticleSystem({
        image: require('../assets/explot.png'),//生成所需粒子的图片路径
        //粒子在生命周期开始时的颜色
        startColor: Cesium.Color.RED.withAlpha(0.7),
        //粒子在生命周期结束时的颜色
        endColor: Cesium.Color.YELLOW.withAlpha(0.3),
        //粒子在生命周期开始时初始比例
        startScale: _this.viewModel.startScale,
        //粒子在生命周期结束时比例
        endScale: _this.viewModel.endScale,
        //粒子发射的最小速度
        minimumParticleLife: _this.viewModel.minimumParticleLife,
        //粒子发射的最大速度
        maximumParticleLife: _this.viewModel.maximumParticleLife,
        //粒子质量的最小界限
        minimumSpeed: _this.viewModel.minimumSpeed,
        //粒子质量的最大界限
        maximumSpeed: _this.viewModel.maximumSpeed,
        //以像素为单位缩放粒子图像尺寸
        imageSize: new Cesium.Cartesian2(
          _this.viewModel.particleSize,
          _this.viewModel.particleSize
        ),
        //每秒发射的粒子数
        emissionRate: _this.viewModel.emissionRate,
        //粒子系统发射粒子的时间（秒）
        lifetime: 16.0,
        //设置粒子的大小是否以米或像素为单位
        sizeInMeters: true,
        //系统的粒子发射器
        emitter: new Cesium.CircleEmitter(5.0),//BoxEmitter 盒形发射器，ConeEmitter 锥形发射器，SphereEmitter 球形发射器，CircleEmitter圆形发射器

      })
    );
    this.particleSystem=particleSystem;
    this.preUpdateEvent()
  }

  //场景渲染事件
  preUpdateEvent() {
    let _this=this;
    this.viewer.scene.preUpdate.addEventListener(function (scene, time) {
      //发射器地理位置
      _this.particleSystem.modelMatrix = _this.computeModelMatrix(_this.entity, time);
      //发射器局部位置
      _this.particleSystem.emitterModelMatrix = _this.computeEmitterModelMatrix();
      // 将发射器旋转
      if (_this.viewModel.spin) {
        _this.viewModel.heading += 1.0;
        _this.viewModel.pitch += 1.0;
        _this.viewModel.roll += 1.0;
      }
    });
  }

  computeModelMatrix(entity, time) {
    return entity.computeModelMatrix(time, new Cesium.Matrix4());
  }

  computeEmitterModelMatrix() {
    this.hpr = Cesium.HeadingPitchRoll.fromDegrees(0.0, 0.0, 0.0, this.hpr);
    this.trs.translation = Cesium.Cartesian3.fromElements(
      -4.0,
      0.0,
      1.4,
      this.translation
    );
    this.trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(this.hpr, this.rotation);

    return Cesium.Matrix4.fromTranslationRotationScale(
      this.trs,
      this.emitterModelMatrix
    );
  }


  removeEvent(){
    this.viewer.scene.preUpdate.removeEventListener(this.preUpdateEvent, this);
    this.emitterModelMatrix = undefined;
    this.translation = undefined;
    this.rotation = undefined;
    this.hpr = undefined;
    this.trs = undefined;
  }

  //移除粒子特效
  remove() {
    ()=>{return this.removeEvent()}; //清除事件
    this.viewer.scene.primitives.remove(this.particleSystem); //删除粒子对象
    this.viewer.entities.remove(this.entity); //删除entity
  }

}

//喷雾特效
export  class sprayEffect{
  constructor(viewer) {
    this.viewer=viewer
    this.viewModel={
      emissionRate: 5,
      gravity: 0.0,//设置重力参数
      minimumParticleLife: 1,
      maximumParticleLife: 6,
      minimumSpeed: 1.0,//粒子发射的最小速度
      maximumSpeed: 4.0,//粒子发射的最大速度
      startScale: 0.0,
      endScale: 10.0,
      particleSize: 25.0,
    }
    this.emitterModelMatrix = new Cesium.Matrix4()
    this.translation = new Cesium.Cartesian3()
    this.rotation = new Cesium.Quaternion()
    this.hpr = new Cesium.HeadingPitchRoll()
    this.trs = new Cesium.TranslationRotationScale()
    this.scene = this.viewer.scene
    this.particleSystem=''
    this.entity = this.viewer.entities.add({
      //选择粒子放置的坐标
      position: Cesium.Cartesian3.fromDegrees(
        116.34485552299206,
        39.99754814959118
      ),
    });
    this.init();
  }

  init(){
    const _this=this
    this.viewer.clock.shouldAnimate = true;
    this.viewer.scene.globe.depthTestAgainstTerrain = false;
    this.viewer.trackedEntity = this.entity;
    var particleSystem = this.scene.primitives.add(
      new Cesium.ParticleSystem({
        image: require('../assets/fire.png'),//生成所需粒子的图片路径
        //粒子在生命周期开始时的颜色
        startColor: Cesium.Color.RED.withAlpha(0.7),
        //粒子在生命周期结束时的颜色
        endColor: Cesium.Color.YELLOW.withAlpha(0.3),
        //粒子在生命周期开始时初始比例
        startScale: _this.viewModel.startScale,
        //粒子在生命周期结束时比例
        endScale: _this.viewModel.endScale,
        //粒子发射的最小速度
        minimumParticleLife: _this.viewModel.minimumParticleLife,
        //粒子发射的最大速度
        maximumParticleLife: _this.viewModel.maximumParticleLife,
        //粒子质量的最小界限
        minimumSpeed: _this.viewModel.minimumSpeed,
        //粒子质量的最大界限
        maximumSpeed: _this.viewModel.maximumSpeed,
        //以像素为单位缩放粒子图像尺寸
        imageSize: new Cesium.Cartesian2(
          _this.viewModel.particleSize,
          _this.viewModel.particleSize
        ),
        //每秒发射的粒子数
        emissionRate: _this.viewModel.emissionRate,
        //粒子系统发射粒子的时间（秒）
        lifetime: 16.0,
        //设置粒子的大小是否以米或像素为单位
        sizeInMeters: true,
        //系统的粒子发射器
        emitter: new Cesium.CircleEmitter(2.0),//BoxEmitter 盒形发射器，ConeEmitter 锥形发射器，SphereEmitter 球形发射器，CircleEmitter圆形发射器
        //回调函数，实现各种喷泉、烟雾效果
        updateCallback: (p, dt) => {
          return this.applyGravity(p, dt);
        },
      })
    );
    this.particleSystem=particleSystem;
    this.preUpdateEvent()
  }

  //场景渲染事件
  preUpdateEvent() {
    let _this=this;
    this.viewer.scene.preUpdate.addEventListener(function (scene, time) {
      //发射器地理位置
      _this.particleSystem.modelMatrix = _this.computeModelMatrix(_this.entity, time);
      //发射器局部位置
      _this.particleSystem.emitterModelMatrix = _this.computeEmitterModelMatrix();
      // 将发射器旋转
      if (_this.viewModel.spin) {
        _this.viewModel.heading += 1.0;
        _this.viewModel.pitch += 1.0;
        _this.viewModel.roll += 1.0;
      }
    });
  }

  computeModelMatrix(entity, time) {
    return entity.computeModelMatrix(time, new Cesium.Matrix4());
  }

  computeEmitterModelMatrix() {
    this.hpr = Cesium.HeadingPitchRoll.fromDegrees(0.0, 0.0, 0.0, this.hpr);
    this.trs.translation = Cesium.Cartesian3.fromElements(
      -4.0,
      0.0,
      1.4,
      this.translation
    );
    this.trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(this.hpr, this.rotation);

    return Cesium.Matrix4.fromTranslationRotationScale(
      this.trs,
      this.emitterModelMatrix
    );
  }

  applyGravity(p, dt){
    var gravityScratch = new Cesium.Cartesian3()
    var position = p.position
    Cesium.Cartesian3.normalize(position, gravityScratch)
    Cesium.Cartesian3.fromElements(
      20 * dt,
      gravityScratch.y * dt,
      -30 * dt,
      gravityScratch
    );
    p.velocity = Cesium.Cartesian3.add(p.velocity, gravityScratch, p.velocity)
  }

  removeEvent(){
    this.viewer.scene.preUpdate.removeEventListener(this.preUpdateEvent, this);
    this.emitterModelMatrix = undefined;
    this.translation = undefined;
    this.rotation = undefined;
    this.hpr = undefined;
    this.trs = undefined;
  }

  //移除粒子特效
  remove() {
    ()=>{return this.removeEvent()}; //清除事件
    this.viewer.scene.primitives.remove(this.particleSystem); //删除粒子对象
    this.viewer.entities.remove(this.entity); //删除entity
  }

}

//烟特效
export  class smokeEffect{
  constructor(viewer) {
    this.viewer=viewer
    this.viewModel={
      emissionRate: 5,
      gravity: 0.0,//设置重力参数
      minimumParticleLife: 1,
      maximumParticleLife: 6,
      minimumSpeed: 1.0,//粒子发射的最小速度
      maximumSpeed: 4.0,//粒子发射的最大速度
      startScale: 0.0,
      endScale: 10.0,
      particleSize: 25.0,
    }
    this.emitterModelMatrix = new Cesium.Matrix4()
    this.translation = new Cesium.Cartesian3()
    this.rotation = new Cesium.Quaternion()
    this.hpr = new Cesium.HeadingPitchRoll()
    this.trs = new Cesium.TranslationRotationScale()
    this.scene = this.viewer.scene
    this.particleSystem=''
    this.entity = this.viewer.entities.add({
      //选择粒子放置的坐标
      position: Cesium.Cartesian3.fromDegrees(
        116.34485552299206,
        39.99754814959118
      ),
    });
    this.init();
  }

  init(){
    const _this=this
    this.viewer.clock.shouldAnimate = true;
    this.viewer.scene.globe.depthTestAgainstTerrain = false;
    this.viewer.trackedEntity = this.entity;
    var particleSystem = this.scene.primitives.add(
      new Cesium.ParticleSystem({
        image: require('../assets/fire.png'),//生成所需粒子的图片路径
        //粒子在生命周期开始时的颜色
        startColor: Cesium.Color.RED.withAlpha(0.7),
        //粒子在生命周期结束时的颜色
        endColor: Cesium.Color.YELLOW.withAlpha(0.3),
        //粒子在生命周期开始时初始比例
        startScale: _this.viewModel.startScale,
        //粒子在生命周期结束时比例
        endScale: _this.viewModel.endScale,
        //粒子发射的最小速度
        minimumParticleLife: _this.viewModel.minimumParticleLife,
        //粒子发射的最大速度
        maximumParticleLife: _this.viewModel.maximumParticleLife,
        //粒子质量的最小界限
        minimumSpeed: _this.viewModel.minimumSpeed,
        //粒子质量的最大界限
        maximumSpeed: _this.viewModel.maximumSpeed,
        //以像素为单位缩放粒子图像尺寸
        imageSize: new Cesium.Cartesian2(
          _this.viewModel.particleSize,
          _this.viewModel.particleSize
        ),
        //每秒发射的粒子数
        emissionRate: _this.viewModel.emissionRate,
        //粒子系统发射粒子的时间（秒）
        lifetime: 16.0,
        //设置粒子的大小是否以米或像素为单位
        sizeInMeters: true,
        //系统的粒子发射器
        emitter: new Cesium.CircleEmitter(2.0),//BoxEmitter 盒形发射器，ConeEmitter 锥形发射器，SphereEmitter 球形发射器，CircleEmitter圆形发射器
        //回调函数，实现各种喷泉、烟雾效果
        updateCallback: (p, dt) => {
          return this.applyGravity(p, dt);
        },
      })
    );
    this.particleSystem=particleSystem;
    this.preUpdateEvent()
  }

  //场景渲染事件
  preUpdateEvent() {
    let _this=this;
    this.viewer.scene.preUpdate.addEventListener(function (scene, time) {
      //发射器地理位置
      _this.particleSystem.modelMatrix = _this.computeModelMatrix(_this.entity, time);
      //发射器局部位置
      _this.particleSystem.emitterModelMatrix = _this.computeEmitterModelMatrix();
      // 将发射器旋转
      if (_this.viewModel.spin) {
        _this.viewModel.heading += 1.0;
        _this.viewModel.pitch += 1.0;
        _this.viewModel.roll += 1.0;
      }
    });
  }

  computeModelMatrix(entity, time) {
    return entity.computeModelMatrix(time, new Cesium.Matrix4());
  }

  computeEmitterModelMatrix() {
    this.hpr = Cesium.HeadingPitchRoll.fromDegrees(0.0, 0.0, 0.0, this.hpr);
    this.trs.translation = Cesium.Cartesian3.fromElements(
      -4.0,
      0.0,
      1.4,
      this.translation
    );
    this.trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(this.hpr, this.rotation);

    return Cesium.Matrix4.fromTranslationRotationScale(
      this.trs,
      this.emitterModelMatrix
    );
  }

  applyGravity(p, dt){
    var gravityScratch = new Cesium.Cartesian3()
    var position = p.position
    Cesium.Cartesian3.normalize(position, gravityScratch)
    Cesium.Cartesian3.fromElements(
      20 * dt,
      30 * dt,
      gravityScratch.y * dt,
      gravityScratch
    );
    p.velocity = Cesium.Cartesian3.add(p.velocity, gravityScratch, p.velocity)
  }

  removeEvent(){
    this.viewer.scene.preUpdate.removeEventListener(this.preUpdateEvent, this);
    this.emitterModelMatrix = undefined;
    this.translation = undefined;
    this.rotation = undefined;
    this.hpr = undefined;
    this.trs = undefined;
  }

  //移除粒子特效
  remove() {
    ()=>{return this.removeEvent()}; //清除事件
    this.viewer.scene.primitives.remove(this.particleSystem); //删除粒子对象
    this.viewer.entities.remove(this.entity); //删除entity
  }

}

//视野分析
export class Visionanalys{
  constructor(viewer,height) {
    this.viewer=viewer
    this.height=height
    this.visionanalys(this.viewer)
    this.vertexEntities=[]//存储实体对象
    this.tempPositions=[]
  }

  //鼠标点击事件
  visionanalys(viewer){
    let position=[]
    const _this=this
    // 获取点击位置的经纬度和高度
    let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    //监听鼠标左击事件
    handler.setInputAction(function (click) {
      const e = window.event,//event|| window.event,
        target = e.target || e.srcElement;
      //判断点击位置是否在地球画布内
      if(target&&target.tagName=='CANVAS'&&target.parentElement.className=='cesium-widget'){
        //控制点击事件为两下
        if(position.length<=2){
          // 创建二维笛卡尔点
          let pick = new Cesium.Cartesian2(click.position.x, click.position.y);
          if (pick) {
            //从相机位置通过windowPosition 世界坐标中的像素创建一条射线。viewer.camera.getPickRay(pick)
            //查找射线与渲染的地球表面之间的交点。射线必须以世界坐标给出。
            let cartesian = viewer.scene.globe.pick(viewer.camera.getPickRay(pick), viewer.scene)
            if (cartesian) {
              //世界坐标转地理坐标（弧度）
              let cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian)
              if (cartographic) {
                //海拔
                let height = viewer.scene.globe.getHeight(cartographic)
                //视角海拔高度
                let he = Math.sqrt(
                  viewer.scene.camera.positionWC.x * viewer.scene.camera.positionWC.x +
                  viewer.scene.camera.positionWC.y * viewer.scene.camera.positionWC.y +
                  viewer.scene.camera.positionWC.z * viewer.scene.camera.positionWC.z
                )
                let he2 = Math.sqrt(
                  cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z
                )
                //地理坐标（弧度）转经纬度坐标
                let point = [
                  (cartographic.longitude / Math.PI) * 180,//经度坐标
                  (cartographic.latitude / Math.PI) * 180,//纬度坐标
                  height//海拔高度
                ]
                position.push(point)
                //点击第一下显示起始点
                if(position.length==1){
                  _this.createVertex(position)
                  //鼠标移动事件
                  _this.mouseMoveEvent(handler,viewer,point)
                  _this.createLineEntity()
                }
                //点击第二下执行视野分析事件，并关闭坐标获取事件
                if(position.length==2){
                  //清除节点
                  _this.vertexEntities.forEach(item => {
                    _this.viewer.entities.remove(item);
                  });
                  _this.vertexEntities = [];
                  //视野分析
                  _this.getvision(viewer,position)
                  //关闭监听
                  handler.destroy();
                  handler = null;
                }
              }
            }
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  }

  //视野分析事件
  getvision(viewer,position) {
    const point1=position[0]//点击的第一个点
    const point2=position[1]//点击的第二个点
    let lng_a=point1[0]
    let lat_a=point1[1]
    let alt_a=point1[2]
    let lng_b=point2[0]
    let lat_b=point2[1]
    let alt_b=point2[2]
    let heading=this.courseAngle(lng_a, lat_a, lng_b, lat_b)//计算偏行角
    //设置相机
    let height=alt_a+parseInt(this.height)//相对地面高度
    viewer.camera.setView({
      destination:Cesium.Cartesian3.fromDegrees(lng_a,lat_a,height),//设置第一个点为相机位置
      orientation:{
        heading:Cesium.Math.toRadians(heading),
        pitch:Cesium.Math.toRadians(0.0),
        roll:Cesium.Math.toRadians(0.0)
      }
    });
  }

  //计算偏行角
  courseAngle(lng_a, lat_a, lng_b, lat_b) {
    //以a点为原点建立局部坐标系（东方向为x轴,北方向为y轴,垂直于地面为z轴），得到一个局部坐标到世界坐标转换的变换矩阵
    var localToWorld_Matrix = Cesium.Transforms.eastNorthUpToFixedFrame(new Cesium.Cartesian3.fromDegrees(lng_a, lat_a));
    //求世界坐标到局部坐标的变换矩阵
    var worldToLocal_Matrix = Cesium.Matrix4.inverse(localToWorld_Matrix, new Cesium.Matrix4());
    //a点在局部坐标的位置，其实就是局部坐标原点
    var localPosition_A = Cesium.Matrix4.multiplyByPoint(worldToLocal_Matrix, new Cesium.Cartesian3.fromDegrees(lng_a, lat_a), new Cesium.Cartesian3());
    //B点在以A点为原点的局部的坐标位置
    var localPosition_B = Cesium.Matrix4.multiplyByPoint(worldToLocal_Matrix, new Cesium.Cartesian3.fromDegrees(lng_b, lat_b), new Cesium.Cartesian3());
    //弧度
    var angle = Math.atan2((localPosition_B.y-localPosition_A.y), (localPosition_B.x-localPosition_A.x))
    //角度
    var theta = angle*(180/Math.PI)-90;
    return -theta;
  }

  //创建起始节点
  createVertex(position){
    const point=position[0]
    const positions=Cesium.Cartesian3.fromDegrees(point[0],point[1],point[2])
    let vertexEntity = this.viewer.entities.add({
      position: positions,
      id: "MeasureDistanceVertex" ,
      type: "MeasureDistanceVertex",
      label: {
        scale: 0.5,
        font: 'normal 24px MicroSoft YaHei',
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5000),
        scaleByDistance: new Cesium.NearFarScalar(1000, 1, 3000, 0.4),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -30),
        outlineWidth: 9,
        outlineColor: Cesium.Color.WHITE
      },
      point: {
        color: Cesium.Color.FUCHSIA,
        pixelSize: 8,
        disableDepthTestDistance: 500,
      },
    });
    this.vertexEntities.push(vertexEntity);
  }

  //鼠标移动事件
  mouseMoveEvent(handler,viewer,point) {
    handler.setInputAction(e => {
      viewer._element.style.cursor = 'default';
      let position = viewer.scene.pickPosition(e.endPosition);
      if (!position) {
        position = viewer.scene.camera.pickEllipsoid(e.startPosition, viewer.scene.globe.ellipsoid);
      }
      if (!position) return;
      this.handleMoveEvent(position,point);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  //处理鼠标移动
  handleMoveEvent(position,point) {
    const positions=[Cesium.Cartesian3.fromDegrees(point[0],point[1],point[2])]
    this.tempPositions = positions.concat(position);
  }

  //创建线对象
  createLineEntity() {
    let lineEntity = this.viewer.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(e => {
          return this.tempPositions;
        }, false),
        width: 2,
        material: Cesium.Color.YELLOW,
        depthFailMaterial: Cesium.Color.YELLOW
      }
    })
    this.vertexEntities.push(lineEntity)
  }
}


