const marker={
  data(){
    return {
      isShow:false,
      msg:'',
      scenePos:'',
      viewer:'',
      handler:'',
    }
  },
  methods:{
    active(viewer){
      let _this=this;
      // 获取点击位置的经纬度和高度
      this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
      this.handler.setInputAction(function (click) {
        const e = window.event,//event|| window.event,
          target = e.target || e.srcElement;
        //判断点击位置是否在地球画布内
        if(target&&target.tagName=='CANVAS'&&target.parentElement.className=='cesium-widget'){
          _this.isShow=true
          _this.scenePos=click.position
          _this.viewer=viewer
        }}, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    },
    addmarker(){
      let viewer=this.viewer
      let pick=this.scenePos
      let msg=this.msg
      viewer.entities.add({
        position: viewer.scene.globe.pick(viewer.camera.getPickRay(pick), viewer.scene),
        label: {
          text: msg,
          font: 'normal 26px MicroSoft YaHei',
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5000),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 9,
          outlineColor: Cesium.Color.WHITE,
        },
      });
      this.msg=''
      this.isShow=false
    },
    destroy(){
      this.handler.destroy()
      this.viewer.entities.removeAll()
    }
  },
  render(){
    return (
      <div style={{ zIndex:2000,position:'absolute',left:this.scenePos.x+'px',top:this.scenePos.y+'px'}} v-show={this.isShow}>
        <input  type="text"  placeholder="标记名称" onChange={this.addmarker} v-model={this.msg} />
        <input type="button"  name="nameSave"  id='submit' onClick={this.addmarker}  value="ok"  />
      </div>
    )
  }
}

export default marker

