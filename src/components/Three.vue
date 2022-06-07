<script setup lang="ts">
import { onMounted,ref } from 'vue'
import * as THREE from "three"; //引入Threejs
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import axios from 'axios';

let threeWarp = ref(null)
let scene = new THREE.Scene();
let reqState = ref(false);
let maxTl = 140;
let minDepth = 0;
let width = 300;
let height = 300;

onMounted(() => {
    scene = initThree(threeWarp.value)

    const terrainData = getTerrainData();
    console.log("terrainData::", terrainData);
    const terrainMesh = renderTerrain(terrainData);

})

// 初始化three
const initThree=(instance:any) => {
    const height = instance.clientHeight;
    const width = instance.clientWidth;
    // 创建场景对象Scene
    const scene = new THREE.Scene();
    // 创建相机对象
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    // 底部网格
    const gridHelper = new THREE.GridHelper(100, 10);
    scene.add(gridHelper);

    // 创建渲染器对象
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    console.log("render::", renderer);
    renderer.shadowMap.enabled = true;
    instance.append(renderer.domElement);
    // renderer.render(scene, camera);
    camera.position.z = width/2;
    camera.position.x = width/2;
    camera.position.y = width/2;
    renderer.setClearColor(0x000000, 1.0);

    // 辅助坐标系  参数400表示坐标系大小，可以根据场景大小去设置
    const axisHelper = new THREE.AxesHelper(width);
    scene.add(axisHelper);

    //光源
    const light = new THREE.DirectionalLight(0xffffff, 2.25);
    light.position.set(400, 0, 200);
    light.castShadow = true;
    light.shadow.mapSize.width = 1200;
    light.shadow.mapSize.height = 1200;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 1500;

    // shadow geometry
    const d = 600;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;

    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff));

    // 使物体产生阴影
    const pointLight = new THREE.PointLight(0xffffff); //点光源
    pointLight.position.set(20, 30, 20);
    pointLight.castShadow = true; // 让光源产生阴影效果
    scene.add(pointLight);

    
    //鼠标操作旋转、缩放
    new OrbitControls(camera, renderer.domElement);
    const animate = function () {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    };
    animate();
    return scene;
}

const testMesh = () => {
    const geometry = new THREE.BoxGeometry(30, 30, 30);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.position.set(0, 15, 0);
    scene.add(cube);
}
// 图形显示隐藏
const hideLayer =()=> {
    const list = scene.children;
    list &&
    list.forEach((mesh: any) => {
        if (mesh.name == 'mian') {
            console.log(mesh)
            mesh.visible = !mesh.visible;
        }
    });
}
// 获取探测能力数据
const getDetectData=()=> {
    reqState.value = true;
    // 删除图层
    removeMesh(scene, "dy");
    axios.get("tlData.json").then(async (res:any) => {
        reqState.value = false;
        renderDetect(scene, res.data, maxTl, minDepth);
        console.log("scene::", scene);
    });
}
// 根据name删除图层
const removeMesh = (scene:any, name:String)=> {
    const list = scene.children;
    list &&
    list.forEach((mesh:any) => {
        if (mesh.name == name) scene.remove(mesh);
    });
}
// 渲染地形
const renderTerrain=(data:Array<Number>)=> {
    const geometry = new THREE.PlaneBufferGeometry(300, 300, 2, 2);
    geometry.rotateX(-Math.PI / 2);
    console.log(geometry);
    const vertices = geometry.attributes.position.array;
    console.log("vertices::", vertices);
    for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
    vertices[j + 1] = -data[i] / 100;
    }

    geometry.computeVertexNormals();
    const material = new THREE.MeshLambertMaterial({
        color: 0x000080,
        transparent: true,
        side: THREE.DoubleSide,
        castShadow: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "mian";
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
}
// 生成地形数据
const getTerrainData=()=> {
    const data = [];
    for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
        // data.push({
        //   x: i*1000,
        //   y: j*1000,
        //   z: Math.floor(Math.random() * 10000)
        // })
        data.push(Math.floor(Math.random() * 10000));
    }
    }
    return data;
}
// 绘制探测能力图
const renderDetect =(scene:any, list:Array<Object>, maxTl:Number, minZ:Number)=> {
    const pointArray = [],
    colorArray = [],
    geometry = new THREE.BufferGeometry();
    if (!list.length) return;
    list.forEach((item: any) => {
    if (item.TL <= parseFloat(maxTl) && item.z >= parseFloat(minZ)) {
        pointArray.push(item.x / 250);
        pointArray.push(-item.z / 50);
        pointArray.push(item.y / 250);
        const color = getColor(item.TL);
        colorArray.push(color[0] / 255);
        colorArray.push(color[1] / 255);
        colorArray.push(color[2] / 255);
    }
    });
    const vertices = new Float32Array(pointArray),
    colors = new Float32Array(colorArray);

    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeBoundingBox();

    const material = new THREE.PointsMaterial({
        vertexColors: true,
        size: 8,
        opacity: 1,
        transparent: true,
        sizeAttenuation: false,
    });

    const mesh = new THREE.Points(geometry, material);
    mesh.castShadow = true;
    mesh.name = "dy";
    
    if (scene) scene.add(mesh);
    return mesh;
}
// 获取探测能力颜色值
const getColor=(tlValue:Number)=> {
    const colorList = [
    [127, 0, 0],
    [131, 0, 0],
    [135, 0, 0],
    [139, 0, 0],
    [143, 0, 0],
    [147, 0, 0],
    [151, 0, 0],
    [156, 0, 0],
    [160, 0, 0],
    [164, 0, 0],
    [168, 0, 0],
    [172, 0, 0],
    [176, 0, 0],
    [180, 0, 0],
    [184, 0, 0],
    [188, 0, 0],
    [192, 0, 0],
    [196, 0, 0],
    [200, 0, 0],
    [205, 0, 0],
    [209, 0, 0],
    [213, 0, 0],
    [217, 0, 0],
    [221, 0, 0],
    [225, 0, 0],
    [229, 0, 0],
    [233, 0, 0],
    [237, 0, 0],
    [241, 0, 0],
    [245, 0, 0],
    [249, 0, 0],
    [254, 0, 0],
    [254, 0, 0],
    [254, 4, 0],
    [254, 8, 0],
    [254, 12, 0],
    [254, 16, 0],
    [254, 20, 0],
    [254, 24, 0],
    [254, 28, 0],
    [254, 32, 0],
    [254, 36, 0],
    [254, 40, 0],
    [254, 44, 0],
    [254, 48, 0],
    [254, 52, 0],
    [254, 56, 0],
    [254, 60, 0],
    [254, 64, 0],
    [254, 68, 0],
    [254, 72, 0],
    [254, 76, 0],
    [254, 80, 0],
    [254, 84, 0],
    [254, 88, 0],
    [254, 92, 0],
    [254, 96, 0],
    [254, 100, 0],
    [254, 104, 0],
    [254, 108, 0],
    [254, 112, 0],
    [254, 116, 0],
    [254, 120, 0],
    [254, 124, 0],
    [254, 129, 0],
    [254, 133, 0],
    [254, 137, 0],
    [254, 141, 0],
    [254, 145, 0],
    [254, 149, 0],
    [254, 153, 0],
    [254, 157, 0],
    [254, 161, 0],
    [254, 165, 0],
    [254, 169, 0],
    [254, 173, 0],
    [254, 177, 0],
    [254, 181, 0],
    [254, 185, 0],
    [254, 189, 0],
    [254, 193, 0],
    [254, 197, 0],
    [254, 201, 0],
    [254, 205, 0],
    [254, 209, 0],
    [254, 213, 0],
    [254, 217, 0],
    [254, 221, 0],
    [254, 225, 0],
    [254, 229, 0],
    [254, 233, 0],
    [254, 237, 0],
    [254, 241, 0],
    [254, 245, 0],
    [254, 249, 0],
    [254, 254, 0],
    [254, 254, 0],
    [249, 254, 4],
    [245, 254, 8],
    [241, 254, 12],
    [237, 254, 16],
    [233, 254, 20],
    [229, 254, 24],
    [225, 254, 28],
    [221, 254, 32],
    [217, 254, 36],
    [213, 254, 40],
    [209, 254, 44],
    [205, 254, 48],
    [201, 254, 52],
    [197, 254, 56],
    [193, 254, 60],
    [189, 254, 64],
    [185, 254, 68],
    [181, 254, 72],
    [177, 254, 76],
    [173, 254, 80],
    [169, 254, 84],
    [165, 254, 88],
    [161, 254, 92],
    [157, 254, 96],
    [153, 254, 100],
    [149, 254, 104],
    [145, 254, 108],
    [141, 254, 112],
    [137, 254, 116],
    [133, 254, 120],
    [129, 254, 124],
    [124, 254, 129],
    [120, 254, 133],
    [116, 254, 137],
    [112, 254, 141],
    [108, 254, 145],
    [104, 254, 149],
    [100, 254, 153],
    [96, 254, 157],
    [92, 254, 161],
    [88, 254, 165],
    [84, 254, 169],
    [80, 254, 173],
    [76, 254, 177],
    [72, 254, 181],
    [68, 254, 185],
    [64, 254, 189],
    [60, 254, 193],
    [56, 254, 197],
    [52, 254, 201],
    [48, 254, 205],
    [44, 254, 209],
    [40, 254, 213],
    [36, 254, 217],
    [32, 254, 221],
    [28, 254, 225],
    [24, 254, 229],
    [20, 254, 233],
    [16, 254, 237],
    [12, 254, 241],
    [8, 254, 245],
    [4, 254, 249],
    [0, 254, 254],
    [0, 254, 254],
    [0, 249, 254],
    [0, 245, 254],
    [0, 241, 254],
    [0, 237, 254],
    [0, 233, 254],
    [0, 229, 254],
    [0, 225, 254],
    [0, 221, 254],
    [0, 217, 254],
    [0, 213, 254],
    [0, 209, 254],
    [0, 205, 254],
    [0, 201, 254],
    [0, 197, 254],
    [0, 193, 254],
    [0, 189, 254],
    [0, 185, 254],
    [0, 181, 254],
    [0, 177, 254],
    [0, 173, 254],
    [0, 169, 254],
    [0, 165, 254],
    [0, 161, 254],
    [0, 157, 254],
    [0, 153, 254],
    [0, 149, 254],
    [0, 145, 254],
    [0, 141, 254],
    [0, 137, 254],
    [0, 133, 254],
    [0, 129, 254],
    [0, 124, 254],
    [0, 120, 254],
    [0, 116, 254],
    [0, 112, 254],
    [0, 108, 254],
    [0, 104, 254],
    [0, 100, 254],
    [0, 96, 254],
    [0, 92, 254],
    [0, 88, 254],
    [0, 84, 254],
    [0, 80, 254],
    [0, 76, 254],
    [0, 72, 254],
    [0, 68, 254],
    [0, 64, 254],
    [0, 60, 254],
    [0, 56, 254],
    [0, 52, 254],
    [0, 48, 254],
    [0, 44, 254],
    [0, 40, 254],
    [0, 36, 254],
    [0, 32, 254],
    [0, 28, 254],
    [0, 24, 254],
    [0, 20, 254],
    [0, 16, 254],
    [0, 12, 254],
    [0, 8, 254],
    [0, 4, 254],
    [0, 0, 254],
    [0, 0, 254],
    [0, 0, 249],
    [0, 0, 245],
    [0, 0, 241],
    [0, 0, 237],
    [0, 0, 233],
    [0, 0, 229],
    [0, 0, 225],
    [0, 0, 221],
    [0, 0, 217],
    [0, 0, 213],
    [0, 0, 209],
    [0, 0, 205],
    [0, 0, 200],
    [0, 0, 196],
    [0, 0, 192],
    [0, 0, 188],
    [0, 0, 184],
    [0, 0, 180],
    [0, 0, 176],
    [0, 0, 172],
    [0, 0, 168],
    [0, 0, 164],
    [0, 0, 160],
    [0, 0, 156],
    [0, 0, 151],
    [0, 0, 147],
    [0, 0, 143],
    [0, 0, 139],
    [0, 0, 135],
    [0, 0, 131],
    [0, 0, 127],
    ];
    let loss = tlValue;
    if (tlValue < 40) {
    loss = 40;
    }
    let index = Math.floor((256 * (loss - 40)) / 100);
    if (index >= 256) {
    index = 255;
    }
    return colorList[index];
}

</script>
<template>
    <div class="three">
        <el-form style="width: 200px; padding: 10px">
        <el-form-item label="tl最大值：">
            <el-input v-model="maxTl"></el-input>
        </el-form-item>
        <el-form-item label="深度最小值：">
            <el-input v-model="minDepth"></el-input>
        </el-form-item>
        <div>
            <el-button @click="getDetectData" :loading="reqState" type="primary"
            >获取数据</el-button
            >
        </div>
        <div style="margin-top: 20px">
            <el-button @click="hideLayer" type="primary"
            >地形控制显示隐藏</el-button
            >
        </div>
        </el-form>
        <div ref="threeWarp" class="three-warp"></div>
    </div>
</template>
<style lang="scss" scoped>
.three{
    display: flex;
    .three-warp{
        width: 800px;
        height: 600px;
        margin: 0 auto;
    }
}
</style>