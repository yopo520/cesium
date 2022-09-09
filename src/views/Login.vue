<template>
  <div id="cesiumContainer">
  <marke ref="marke"></marke>
    <div class="bth">
      <button  @click="updates">dianwo</button>
      <button  @click="ss">dianwo1</button>
    </div>
  </div>
</template>

<script>
import inputbox from '@/render/inputbox'
import getcesium from '@/api/cesiumtools'
import { SnowEffect } from '@/api/cesiumtools'
import marke from '@/api/marke'
export default {
  components:{
    marke
  },
  data(){
    return {
      viewer:'',
      isShow:true,
      msg:'',
    }
  },
  mounted () {
    this.viewer=getcesium()
  },
  methods:{
    updates(){
      this.$refs.marke.active(this.viewer)
    },
    ss(){
      this.$refs.marke.destroy()
    }
  }
}
</script>


<style lang="scss">
$co:red;
*{
  margin: 0;
  padding: 0;
  color: $co;
}
.bth{
  z-index: 2000;
  position: absolute;
}
.msg1{
  z-index: 2000;
  position: absolute;
}
</style>
