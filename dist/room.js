import * as T from './vendor/three.module.js';
import { lampSettings, lightingState } from './lighting.js?v=2';
export function createRoom(canvas){
 // r149 hex colours are sRGB inputs; lighting and tone mapping operate in linear space.
 T.ColorManagement.legacyMode=false;
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.physicallyCorrectLights=true;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.1,120);scene.background=new T.Color('#e2dfd5');const root=new T.Group();scene.add(root);const materials=[];function mat(color,roughness=.78,metalness=0){const m=new T.MeshStandardMaterial({color,roughness,metalness});materials.push(m);return m}const wood=mat('#a17b50'),walnut=mat('#6c4c30'),wall=mat('#e0d8c7'),fabric=mat('#9c9e85'),pillow=mat('#d4c6a5'),dark=mat('#3f4035'),black=mat('#222925'),green=mat('#4e6641'),pot=mat('#b99d79'),cream=mat('#ede2c6');
 function box(w,h,d,x,y,z,m=wood,parent=root){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}function cyl(r1,r2,h,x,y,z,m=wood,segments=48,parent=root){const mesh=new T.Mesh(new T.CylinderGeometry(r1,r2,h,segments),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}function sphere(r,x,y,z,m,parent=root){const mesh=new T.Mesh(new T.SphereGeometry(r,24,18),m);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh}
 // The room and every piece of furniture are built from original procedural geometry.
 box(7.35,.28,9.35,0,-.15,0,cream);box(7,.09,9,0,.03,0,wood);for(let z=-4.35;z<4.5;z+=.3){box(7,.008,.012,0,.081,z,walnut);for(let x=-3.4;x<3.4;x+=1.8)box(.011,.008,.3,x+((Math.round(z*10)%2)*.3),.081,z+.15,walnut)}
 box(7.3,3.4,.18,0,1.7,-4.6,wall);box(.18,3.4,9.15,-3.6,1.7,-.05,wall);box(7.1,.13,.12,0,.17,-4.45,cream);box(.12,.13,9,-3.47,.17,0,cream);
 const ground=new T.Mesh(new T.PlaneGeometry(200,200),mat('#e2dfd5'));ground.rotation.x=-Math.PI/2;ground.position.y=-.32;ground.receiveShadow=true;scene.add(ground);
 // Window / glowing exterior at the rear of the living space.
 box(1.45,1.55,.09,-2.1,2.1,-4.46,walnut);const windowM=new T.MeshStandardMaterial({color:'#b8c4ad',emissive:'#cbd2af',emissiveIntensity:.3,roughness:.4});materials.push(windowM);box(1.28,1.38,.03,-2.1,2.1,-4.39,windowM);box(.045,1.4,.06,-2.1,2.1,-4.34,cream);box(1.3,.045,.06,-2.1,2.1,-4.34,cream);
 // Media wall and a long low cabinet with slatted fronts.
 box(3.1,.55,.65,.7,.48,-3.98,walnut);for(let x=-.78;x<2.2;x+=.12)box(.035,.4,.04,x,.48,-3.62,wood);box(3.25,.06,.75,.7,.79,-3.98,wood);const tv=new T.MeshStandardMaterial({color:'#142427',emissive:'#263f43',emissiveIntensity:.28,roughness:.2});materials.push(tv);box(2.1,1.12,.1,.7,1.64,-4.34,black);box(1.98,.99,.025,.7,1.64,-4.275,tv);box(.09,.22,.12,.7,.97,-4.15,dark);box(.65,.04,.25,.7,.85,-4.15,dark);
 // Sofa, soft seating, arms and three loose cushions.
 box(1.6,.26,3.1,-2.25,.25,-.75,walnut);box(1.65,.42,3.15,-2.25,.54,-.75,fabric);box(.3,.9,3.25,-3,.9,-.75,fabric);box(1.7,.75,.22,-2.25,.79,-2.35,fabric);box(1.7,.75,.22,-2.25,.79,.84,fabric);for(let i=0;i<3;i++){box(1.31,.2,.93,-2.16,.86,-1.78+i,mat(i===1?'#a9a990':'#b2b29b'));let c=box(.23,.63,.6,-2.65,1.1,-1.67+i,pillow);c.rotation.z=.12;c.rotation.x=.06*(i-1)}
 const rug=mat('#c5b89d'),rugThread=mat('#b9ac94');box(4.1,.022,3.8,-.5,.1,-.3,rug);for(let z=-2.15;z<1.6;z+=.09)box(3.95,.004,.012,-.5,.114,z,rugThread);
 cyl(.78,.78,.09,-.35,.6,-.6,walnut);cyl(.16,.2,.48,-.35,.32,-.6,black);cyl(.48,.54,.04,-.35,.1,-.6,black);box(.45,.04,.32,-.6,.67,-.6,cream);box(.32,.035,.25,-.55,.71,-.6,mat('#76876e'));cyl(.08,.06,.12,-.02,.72,-.5,cream);cyl(.06,.06,.005,-.02,.785,-.5,walnut);
 // Dining table, chairs with curved backs.
 cyl(.9,.9,.09,1.45,.91,2.4,wood);cyl(.18,.27,.77,1.45,.48,2.4,walnut);cyl(.52,.58,.06,1.45,.1,2.4,walnut);
 for(let k=0;k<4;k++){const g=new T.Group();g.position.set(1.45+Math.cos(k*Math.PI/2)*1.36,0,2.4+Math.sin(k*Math.PI/2)*1.36);g.rotation.y=-k*Math.PI/2;root.add(g);box(.56,.13,.55,0,.49,0,fabric,g);box(.12,.65,.65,.26,.86,0,wood,g);for(const x of[-.2,.2])for(const z of[-.2,.2])box(.045,.43,.045,x,.24,z,walnut,g)}
 cyl(.09,.14,.27,1.45,1.09,2.4,cream);cyl(.018,.018,.35,1.45,1.35,2.4,green);for(let i=0;i<3;i++){const l=sphere(.1,1.45+.06*Math.sin(i),1.4+i*.06,2.4,green);l.scale.set(1,.2,1.8)}
 // Tall plant and the small bookshelf.
 cyl(.32,.25,.6,2.65,.4,-3.5,pot);cyl(.025,.03,1.55,2.65,1.3,-3.5,walnut);for(let i=0;i<10;i++){const a=i*2.4,y=1.05+i*.13,l=sphere(.24,2.65+Math.cos(a)*.33,y,-3.5+Math.sin(a)*.3,green);l.scale.set(1.7,.24,.7);l.rotation.z=Math.sin(a)*.5}
 box(.8,1.7,.45,-2.95,.94,3.45,wood);for(let y=.3;y<1.8;y+=.48){box(.7,.04,.39,-2.95,y,3.21,walnut);for(let i=0;i<4;i++)box(.11,.26+i*.025,.22,-3.19+i*.15,y+.15,3.25,mat(['#a7ac91','#c3b393','#777e6a','#ba9072'][i]))}
 const lightMeshes={},lampLights={};function glow(id,x,y,z,r=.12){
  const settings=lampSettings[id];
  const m=new T.MeshStandardMaterial({color:'#8c897c',emissive:'#ffbd60',emissiveIntensity:0});materials.push(m);
  const bulb=lightMeshes[id]=sphere(r,x,y,z,m);bulb.name='bulb-'+id;
  // The luminous bulb must not shadow the light whose origin is inside it.
  bulb.castShadow=false;bulb.receiveShadow=false;
  // A bounded cone uses one shadow map, rather than six point-light cube faces.
  const light=new T.SpotLight('#ffc67d',0,settings.distance,settings.angle,.7,2);
  light.name='lamp-'+id;light.position.set(x,y,z);light.target.position.set(...settings.target);
  light.castShadow=true;light.shadow.mapSize.set(512,512);light.shadow.camera.near=.05;
  light.shadow.camera.far=settings.distance;light.shadow.bias=-.0001;light.shadow.normalBias=.015;
  scene.add(light,light.target);lampLights[id]=light;
 }
 // Pendant hangs from an open ceiling plane for a dollhouse view.
 cyl(.018,.018,1,1.45,3.3,2.4,black);cyl(.45,.62,.22,1.45,2.7,2.4,cream);glow('pendant',1.45,2.55,2.4,.16);
 cyl(.23,.26,.05,-2.5,.12,1.65,black);cyl(.025,.025,1.65,-2.5,.96,1.65,black);cyl(.26,.4,.4,-2.5,1.95,1.65,cream);glow('floor',-2.5,1.71,1.65,.09);
 glow('accent',.7,.96,-3.65,.04);lightMeshes.accent.scale.set(22,.5,1);
 // AC is visibly separate from the lighting controls.
 const acBody=box(1.15,.28,.22,.7,2.9,-4.38,cream);for(let i=0;i<4;i++)box(.95,.012,.01,.7,2.8+i*.035,-4.25,mat('#b3baad'));const acLED=sphere(.023,1.17,2.9,-4.23,mat('#a6c387'));
 const ambient=new T.HemisphereLight('#e8e3d3','#776b51',.5);scene.add(ambient);const sun=new T.DirectionalLight('#fff0cf',2);sun.position.set(3,9,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-9;sun.shadow.camera.right=9;sun.shadow.camera.top=9;sun.shadow.camera.bottom=-9;sun.shadow.normalBias=.025;sun.shadow.camera.near=.5;sun.shadow.camera.far=35;scene.add(sun);
 const fill=new T.DirectionalLight('#e5e8df',.6);fill.position.set(-4,6,8);scene.add(fill);
 let angle=.67,top=false,drag=false,startX=0,startA=angle,lastState;let errorHandler;const render=()=>{try{renderer.render(scene,camera)}catch(error){if(errorHandler)errorHandler(error);else throw error}};function cameraUpdate(){const fit=Math.max(1,1.25/Math.max(camera.aspect,.2));if(top){camera.position.set(.01,24*fit,.1);camera.lookAt(0,0,0)}else{camera.position.set(Math.sin(angle)*18*fit,13*fit,Math.cos(angle)*18*fit);camera.lookAt(0,.2,0)}render()}
 function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/Math.max(r.height,1);camera.updateProjectionMatrix();cameraUpdate()}
 const onDown=e=>{if(e.button!==0&&e.pointerType==='mouse')return;drag=true;startX=e.clientX;startA=angle;canvas.setPointerCapture(e.pointerId)};const onMove=e=>{if(!drag||top)return;angle=Math.max(-.15,Math.min(1.25,startA+(e.clientX-startX)*.005));cameraUpdate()};const onUp=()=>{drag=false};canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);
 function update(s){
  lastState=s;const lighting=lightingState(s);
  for(const [id,setting] of Object.entries(lighting.lamps)){
   lampLights[id].intensity=setting.intensity;
   lightMeshes[id].material.emissiveIntensity=setting.emission;
   lightMeshes[id].material.color.set(setting.color);
  }
  ambient.intensity=lighting.ambient;sun.intensity=lighting.sun;fill.intensity=lighting.fill;
  windowM.emissiveIntensity=lighting.windowEmission;windowM.color.set(lighting.windowColor);
  tv.emissiveIntensity=lighting.televisionEmission;acLED.visible=s.ac;
  scene.background.set(lighting.background);ground.material.color.set(lighting.background);
  renderer.toneMappingExposure=lighting.exposure;render();
 }
 resize();return{update,resize,setErrorHandler(handler){errorHandler=handler},view(value){top=!!value;angle=.67;cameraUpdate()},dispose(){canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onUp);scene.traverse(o=>{o.geometry?.dispose();o.shadow?.map?.dispose();});materials.forEach(m=>m.dispose());renderer.dispose()}};
}
