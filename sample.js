const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

// import { FACEMESH_FACE_OVAL } from '@mediapipe/face_mesh';
// import { FACEMESH_FACE_OVAL } from '@mediapipe/face_mesh';
////////////////////////////////////////////////////////////////////////////////////
import * as THREE from './node_modules/three/build/three.module.js';
import * as GeometryUtils from './node_modules/three/examples/jsm/utils/GeometryUtils.js';
import { LineGeometry } from './node_modules/three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from './node_modules/three/examples/jsm/lines/LineMaterial.js';
import { Line2 } from './node_modules/three/examples/jsm/lines/Line2.js';
import {OrbitControls} from './node_modules/three/examples/jsm/controls/OrbitControls.js';

let matLine;
const renderer = new THREE.WebGLRenderer();
const renderer_w = 640;
const renderer_h = 480;
renderer.setSize( renderer_w, renderer_h ); 
renderer.setViewport(0,0,renderer_w, renderer_h); 
document.body.appendChild( renderer.domElement );

const far = 500;
const near = 1 ;
const camera_ar = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, near, far);
camera_ar.position.set( 0, 0, 10 );
camera_ar.lookAt( 0, 0, 0 ); 
camera_ar.up.set(0,1,0);

const scene = new THREE.Scene();

const texture_bg = new THREE.VideoTexture(videoElement);
scene.background = texture_bg;
let oval_point_mesh = null;
let curveObject = null;
let line = null;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////


function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) { //각각이 무엇을 의미하는지 확인해 보아야 한다. 
      //console.log(FACEMESH_FACE_OVAL)
      //console.log(landmarks[300])
      // Landmark is normalizedLandmark[]
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,
                     {color: '#C0C0C070', lineWidth: 1});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});
      if(oval_point_mesh == null){
        let oval_point_geo = new THREE.BufferGeometry();
        const num_oval_points =FACEMESH_FACE_OVAL.length;
        const oval_vertices = [];
        const curve_vertices = []
        let first_point = new THREE.Vector3();
        // const oval_vertices = new Float32Array( num_oval_points);
        for(let i =0; i< num_oval_points; i++){
          const index = FACEMESH_FACE_OVAL[i][0];
          const pos_ns = landmarks[index];
          const pos_ps = new THREE.Vector3((pos_ns.x -0.5)*2,-(pos_ns.y -0.5)*2, pos_ns.z)
          let pos_ws = new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.x).unproject(camera_ar);
          // oval_vertices[i] = pos_ws;
          oval_vertices.push(pos_ws.x,pos_ws.y,pos_ws.z);
          curve_vertices.push(new THREE.Vector3(pos_ws.x,pos_ws.y,pos_ws.z));
          if( i == 0){
            first_point = oval_vertices[0]
          }
        }
        const point_mat = new THREE.PointsMaterial({color:0xFF0000, size : 0.07});
        oval_point_geo.setAttribute('position', new THREE.Float32Attribute(oval_vertices,3));
        oval_point_mesh = new THREE.Points(oval_point_geo,point_mat);
        // scene.add(point_mesh);
        // curve_vertices.push(first_point)
        curve_vertices.push(curve_vertices[0])
        
        const spline = new THREE.CatmullRomCurve3( curve_vertices );
        const points = spline.getPoints( curve_vertices.length -1 );
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
        curveObject = new THREE.Line( geometry, material );
        scene.add(curveObject);
        // point_mesh = new THREE.Points(,)
        ///////////////////////////////////////////////////////////////
       const positions_2 = [];
       const colors = [];
 
       const points2 = GeometryUtils.hilbert3D( new THREE.Vector3( 0, 0, 0 ), 20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7 );
 
       const spline2 = new THREE.CatmullRomCurve3( points2 );
       const divisions = Math.round( 12 * points2.length );
       const point = new THREE.Vector3();
       const color = new THREE.Color();
 
       for ( let i = 0, l = divisions; i < l; i ++ ) {
         const t = i / l;
         spline2.getPoint( t, point );
         positions_2.push( point.x, point.y, point.z );
         color.setHSL( t, 1.0, 0.5 );
         colors.push( color.r, color.g, color.b );
       }
       // Line2 ( LineGeometry, LineMaterial )
 
       const geometry2 = new LineGeometry();
       geometry2.setPositions( oval_vertices ); //! 여기다가 넣어줬다는거지
       geometry2.setColors( colors );
 
       matLine = new LineMaterial( {
 
         color: 0xffffff,
         linewidth: 0.005, // in world units with size attenuation, pixels otherwise
         vertexColors: true,
 
         //resolution:  // to be set by renderer, eventually
         dashed: false,
         alphaToCoverage: true,
 
       } );
 
       line = new Line2( geometry2, matLine );
       line.computeLineDistances();
       line.scale.set( 1, 1, 1 );
       scene.add( line );
       ///////////////////////////////////

      }

      
      const num_oval_points = FACEMESH_FACE_OVAL.length;
      let positions = oval_point_mesh.geometry.attributes.position.array;
      let curve_positions = curveObject.geometry.attributes.position.array;
      let line_positions = line.geometry.attributes.position.array;
      // console.log(positions, line_positions);
      let count = 1
      // let curvePosition = new Array()
      for(let i =0; i< num_oval_points; i++){
        const index = FACEMESH_FACE_OVAL[i][0];
        const pos_ns = landmarks[index];
        const pos_ps = new THREE.Vector3((pos_ns.x -0.5)*2,-(pos_ns.y -0.5)*2, pos_ns.z)
        let pos_ws = new THREE.Vector3(pos_ps.x,pos_ps.y,pos_ps.x).unproject(camera_ar);
        // oval_vertices[i] = pos_ws;

        positions[3*i +0] = pos_ws.x;
        positions[3*i +1] = pos_ws.y;
        positions[3*i +2] = pos_ws.z;

        curve_positions[3*i +0] = pos_ws.x;
        curve_positions[3*i +1] = pos_ws.y;
        curve_positions[3*i +2] = pos_ws.z;

        // line_positions[3*i +0] = pos_ws.x;
        // line_positions[3*i +1] = pos_ws.y;
        // line_positions[3*i +2] = pos_ws.z;

        count += 1
        // curvePosition.push(new THREE.Vector3(pos_ws.x, pos_ws.y, pos_ws.z));
        // oval_vertices.push(pos_ws.x,pos_ws.y,pos_ws.z);
        // point_mesh.geometry.attributes.position[i] = new THREE.Vector3(pos_ws.x,pos_ws.y,pos_ws.z);
      }
      curve_positions[3*(count -1 ) +0] = curve_positions[0];
      curve_positions[3*(count -1) +1] = curve_positions[1];
      curve_positions[3*(count -1) +2] = curve_positions[2];

      line.geometry.setPositions(positions);//!

      oval_point_mesh.geometry.attributes.position.needsUpdate = true; // 애만 업데이트 하세요.
      curveObject.geometry.attributes.position.needsUpdate = true;
      line.geometry.attributes.position.needsUpdate = true;
    }
  }
  renderer.render(scene, camera_ar);
  canvasCtx.restore();
}


const faceMesh = new FaceMesh({locateFile: (file) => {
  return `./node_modules/@mediapipe/face_mesh/${file}`;
}});
faceMesh.setOptions({
  maxNumFaces: 1, //최대 얼굴의 수를 정해준다. 
  refineLandmarks: true, // 눈동자도 트래킹 해줌. Iris tracking
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5 // 수많은 랜드마크가 잡히고, 특정 probability를 따져서 화면에 보여준다. 설정 값 이상의 신뢰도가 주어져야 함.
});
faceMesh.onResults(onResults); // 콜백 펑션. 랜드마크를 생성하면 onResult를 콜백한다. 
 

// const camera = new Camera(videoElement, {
//   onFrame: async () => {
//     await faceMesh.send({image: videoElement});
//   }, // 매프레임 마다 onFrame을 실행하는데, 
//   width: 1280,
//   height: 720 
// });
//camera.start();

//! 여기 잘 못쳤을지도 
// let count = 0;
// function processPerFrame(){
//   console.log(count++);
//   async function detectionFrame(now, metadata){
//     await faceMesh.send({image: videoElement});
//   }
//   videoElement.requestVideoFrameCallback(processPerFrame);
// }

videoElement.play();

async function detectionFrame(){
  await faceMesh.send({image: videoElement});
  videoElement.requestVideoFrameCallback(detectionFrame);
}



detectionFrame();