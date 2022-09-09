//空间距离
export default function SpacingDistance(points){
  if(points.length>=2){
    const distance = Cesium.Cartesian3.distance(points[points.length-2],points[points.length-1]).toFixed(2)
    let height = Math.abs(points[points.length-2].z-points[points.length-1].z).toFixed(2);
    let strLine =  (Math.sqrt(Math.pow(distance,2) + Math.pow(height,2))).toFixed(2);
    return strLine
  }
}

//地表距离
export function SurfaceDistance(points){
  if(points.length>=2){
    var point1=Cesium.Cartographic.fromCartesian(points[points.length-2]);
    var point2=Cesium.Cartographic.fromCartesian(points[points.length-1]);
    let geodesic = new Cesium.EllipsoidGeodesic(point1,point2);
    let distance = geodesic.surfaceDistance.toFixed(2);//求地表距离,单位为米
    return distance
  }
}

//水平距离
export function HorizontalDistance(points){
  if(points.length>=2){
    let distance = Cesium.Cartesian3.distance(points[points.length-2],points[points.length-1]).toFixed(2)
    return distance
  }
}

//垂直距离
export function VerticalDistance(points){
  if(points.length>=2){
    let height = Math.abs(points[points.length-2].z-points[points.length-1].z).toFixed(2);
    return height
  }
}
