import {worldVertexShader,worldFragmentShader,skyVertexShader,skyFragmentShader,weatherPresets,sampleWeather,crowdVertexShader,rainFragmentShader} from './graphics.js?v=11';
const $=id=>document.getElementById(id),canvas=$('pitch'),gl=canvas.getContext('webgl',{antialias:true});
function showLoadError(){const notice=$('unsupported');notice.textContent='The game could not start. Refresh the page, or check that hardware acceleration is enabled in your browser.';notice.hidden=false;}
if(!gl){showLoadError();throw Error('WebGL unavailable');}
const vs=worldVertexShader,fs=worldFragmentShader;
function shader(type,src){const out=gl.createShader(type);gl.shaderSource(out,src);gl.compileShader(out);if(!gl.getShaderParameter(out,gl.COMPILE_STATUS)){showLoadError();throw Error(gl.getShaderInfoLog(out));}return out;}
function makeProgram(vertex,fragment){const out=gl.createProgram();gl.attachShader(out,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(out,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(out);if(!gl.getProgramParameter(out,gl.LINK_STATUS)){showLoadError();throw Error(gl.getProgramInfoLog(out));}return out;}
const program=makeProgram(vs,fs),skyProgram=makeProgram(skyVertexShader,skyFragmentShader);
gl.useProgram(program);gl.enable(gl.DEPTH_TEST);
const attrs=['p','n','c'].map(name=>gl.getAttribLocation(program,name)),vp=gl.getUniformLocation(program,'vp');
const uniforms=Object.fromEntries(['eye','sunDirection','sunColor','fogColor','ambient','power','wet','night','fogDensity','clock','faces','shadows[0]','shadowCount'].map(name=>[name,gl.getUniformLocation(program,name)]));
const skyUniforms=Object.fromEntries(['forward','right','up','zenith','horizon','sunDirection','sunColor','aspect','clock','cloudCover','storm','night','detail'].map(name=>[name,gl.getUniformLocation(skyProgram,name)]));
const skyAttr=gl.getAttribLocation(skyProgram,'pos'),skyBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
const faceTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,faceTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,1,1,0,gl.RGB,gl.UNSIGNED_BYTE,new Uint8Array([191,142,109]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
let faceAtlasReady=false,weatherClock=0,weatherChoice='auto',detailChoice='auto',frameCost=16;
const coarseGraphics=()=>window.matchMedia('(any-pointer: coarse)').matches;
function graphicsHigh(){return detailChoice==='high'||detailChoice==='auto'&&!coarseGraphics()&&frameCost<27;}
const col=h=>[parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255],white=col('ecede4'),skin=col('c78f70'),maroon=col('651c38'),gold=col('edb454'),black=col('1b2329');
const norm=a=>{let l=Math.hypot(...a)||1;return a.map(x=>x/l)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
function mult(a,b){let o=[];for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o}
function view(eye,target){let z=norm(eye.map((x,i)=>x-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]}
class MeshBuilder{
 constructor(capacity=32768){this.data=new Float32Array(capacity);this.length=0;}
 push(...values){if(this.length+values.length>this.data.length){const grown=new Float32Array(this.data.length*2);grown.set(this.data);this.data=grown;}this.data.set(values,this.length);this.length+=values.length;}
 put9(a,b,c,d,e,f,g,h,i){const end=this.length+9;if(end>this.data.length){const grown=new Float32Array(Math.max(end,this.data.length*2));grown.set(this.data);this.data=grown;}const n=this.length,v=this.data;v[n]=a;v[n+1]=b;v[n+2]=c;v[n+3]=d;v[n+4]=e;v[n+5]=f;v[n+6]=g;v[n+7]=h;v[n+8]=i;this.length=end;}
 array(){return this.data.subarray(0,this.length);}
}
let verts=new MeshBuilder(),surface=0;
function vertex(p,n,c){const k=surface+1;verts.put9(p[0],p[1],p[2],n[0]*k,n[1]*k,n[2]*k,c[0],c[1],c[2]);}
function material(kind,fn){const old=surface;surface=kind;fn();surface=old;}

function box(x,y,z,w,h,d,c){let q=[[x-w/2,y-h/2,z-d/2],[x+w/2,y-h/2,z-d/2],[x+w/2,y+h/2,z-d/2],[x-w/2,y+h/2,z-d/2],[x-w/2,y-h/2,z+d/2],[x+w/2,y-h/2,z+d/2],[x+w/2,y+h/2,z+d/2],[x-w/2,y+h/2,z+d/2]];for(let [ids,n] of [[[0,3,2,1],[0,0,-1]],[[4,5,6,7],[0,0,1]],[[0,4,7,3],[-1,0,0]],[[1,2,6,5],[1,0,0]],[[3,7,6,2],[0,1,0]],[[0,1,5,4],[0,-1,0]]])for(let i of [0,1,2,0,2,3])vertex(q[ids[i]],n,c)}
function sphereMesh(rows,cols){const out=[];for(let a=0;a<rows;a++)for(let b=0;b<cols;b++){const point=(i,j)=>{const u=i*Math.PI/rows,v=j*Math.PI*2/cols;return[Math.sin(u)*Math.cos(v),Math.cos(u),Math.sin(u)*Math.sin(v)]};const q=[point(a,b),point(a+1,b),point(a+1,b+1),point(a,b+1)];for(const i of [0,1,2,0,2,3])out.push(q[i]);}return out;}
const sphere=sphereMesh(8,12),smallSphere=sphereMesh(3,6),crowdSphere=sphereMesh(3,5);let geometryDetail=true;
function ell(x,y,z,sx,sy,sz,c,basis){
 const mesh=geometryDetail==='crowd'?crowdSphere:geometryDetail?sphere:smallSphere,k=surface+1;
 for(const v of mesh){
  const px=v[0]*sx,py=v[1]*sy,pz=v[2]*sz;
  let nx=v[0]/sx,ny=v[1]/sy,nz=v[2]/sz;const length=Math.hypot(nx,ny,nz)||1;nx/=length;ny/=length;nz/=length;
  if(basis)verts.put9(x+basis[0][0]*px+basis[1][0]*py+basis[2][0]*pz,y+basis[0][1]*px+basis[1][1]*py+basis[2][1]*pz,z+basis[0][2]*px+basis[1][2]*py+basis[2][2]*pz,(basis[0][0]*nx+basis[1][0]*ny+basis[2][0]*nz)*k,(basis[0][1]*nx+basis[1][1]*ny+basis[2][1]*nz)*k,(basis[0][2]*nx+basis[1][2]*ny+basis[2][2]*nz)*k,c[0],c[1],c[2]);
  else verts.put9(x+px,y+py,z+pz,nx*k,ny*k,nz*k,c[0],c[1],c[2]);
 }
}
function limb(a,b,r,c){const y=norm(b.map((v,i)=>v-a[i])),reference=Math.abs(y[2])>.92?[1,0,0]:[0,0,1],x=norm(cross(reference,y));ell(...a.map((v,i)=>(v+b[i])/2),r,Math.hypot(...b.map((v,i)=>v-a[i]))/2+r*.35,r,c,[x,y,cross(x,y)]);}
function taper(a,b,r1,r2,c,segments=10){
 const axis=norm(b.map((v,i)=>v-a[i])),side=norm(cross(Math.abs(axis[2])>.9?[1,0,0]:[0,0,1],axis)),front=cross(side,axis);
 const point=(t,angle)=>a.map((v,i)=>v+(b[i]-v)*t+(side[i]*Math.cos(angle)+front[i]*Math.sin(angle))*(r1+(r2-r1)*t));
 for(let j=0;j<segments;j++){const u=j*Math.PI*2/segments,v=(j+1)*Math.PI*2/segments;
  const q=[point(0,u),point(1,u),point(1,v),point(0,v)],ns=[u,u,v,v].map(angle=>norm(side.map((n,i)=>n*Math.cos(angle)+front[i]*Math.sin(angle)+axis[i]*(r1-r2))));
  for(const i of [0,1,2,0,2,3])vertex(q[i],ns[i],c);
 }
}
let seed=12345;function rand(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}
// Stadium geometry is uploaded once. Crowd movement is done by the GPU.
let scenerySeed=38017;function sceneryRandom(){scenerySeed=(1664525*scenerySeed+1013904223)>>>0;return scenerySeed/4294967296;}
const crowdInstances=[];
function spectator(x,y,z,angle,style){crowdInstances.push(x,y,z,angle,...col(['962f48','dcaf38','dedfda','254a63','417d67','192b36','ba6739'][style%7]));}
function spectatorGeometry(x,y,z,angle,style){
 const cs=Math.cos(angle),sn=Math.sin(angle),point=(a,b,c)=>[x+a*cs+c*sn,y+b,z-a*sn+c*cs];
 const shirt=col(['962f48','dcaf38','dedfda','254a63','417d67','192b36','ba6739'][style%7]),skinTone=col(['c9916c','78553e','dab49b','9b6e52'][style%4]);
 material(5,()=>{
  taper(point(0,.33,0),point(0,.79,0),.145,.19,shirt,6);
  ell(...point(0,.94,0),.12,.15,.12,skinTone);taper(point(0,1.045,0),point(0,1.105,0),.115,.045,col('302b27'),5);
  // Bent seated legs, shoulders and occasional raised cheering arms.
  for(const side of [-1,1]){
   taper(point(side*.085,.36,0),point(side*.10,.30,.22),.075,.064,col('29363b'),3);
   taper(point(side*.10,.30,.22),point(side*.10,.07,.24),.052,.041,skinTone,3);
   const shoulder=point(side*.18,.73,0),elbow=point(side*.25,style%6===0?.94:.50,.13),hand=point(side*.24,style%6===0?1.18:.42,.26);
   taper(shoulder,elbow,.052,.04,skinTone,3);taper(elbow,hand,.043,.03,skinTone,3);
  }
 });
}
geometryDetail=false;
box(0,-.25,50,210,.4,250,col('304634'));
material(1,()=>box(0,.006,50,68,.05,120,col('307239')));
for(let z=0;z<=100;z+=10){box(0,.038,z,68,.012,z===0||z===100?.19:.095,white);if(z>0&&z<100)for(const x of [-24,-10,10,24])box(x,.04,z,.095,.01,1.7,white);}
for(const x of [-34,34])box(x,.039,50,.12,.012,120,white);for(const z of [-10,110])box(0,.039,z,68,.012,.12,white);
for(const z of [0,100]){
 for(const x of [-2.8,2.8]){taper([x,0,z],[x,10,z],.09,.06,white,10);box(x,1,z,.44,2,.44,maroon);}
 taper([-2.8,3,z],[2.8,3,z],.085,.085,white,10);
 for(const x of [-34,34]){taper([x,.03,z],[x,1.7,z],.025,.025,white,6);box(x+.2,1.55,z,.4,.28,.02,col('dc6d34'));}
}
function truss(a,b){taper(a,b,.10,.10,col('7a8993'),6);}
// Four 34-metre floodlight towers, each carrying a giant bank of lamps aimed across the pitch.
for(const side of [-1,1])for(const end of [-1,1]){
 const x=side*63,z=end<0?-8:108,inner=x-side*.58;
 for(const dx of [-1.7,1.7])for(const dz of [-1.25,1.25])truss([x+dx,0,z+dz],[x+dx*.42,31,z+dz*.42]);
 for(let y=5;y<31;y+=5){
  truss([x-1.7+(y/31)*.98,y,z-1.25+(y/31)*.73],[x+1.7-(y/31)*.98,y,z+1.25-(y/31)*.73]);
  truss([x-1.7+(y/31)*.98,y,z+1.25-(y/31)*.73],[x+1.7-(y/31)*.98,y,z-1.25+(y/31)*.73]);
 }
 box(x,33.1,z,1.1,6.2,15,col('24323a'));
 box(x,33.1,z,.72,5.7,14.5,col('50616a'));
 for(let row=0;row<5;row++)for(let lamp=0;lamp<12;lamp++)material(4,()=>box(inner,31.05+row*1.03,z-6.1+lamp*1.1,.12,.72,.82,col('eef7ff')));
 truss([x,30.5,z-6.8],[x,35.9,z-6.8]);truss([x,30.5,z+6.8],[x,35.9,z+6.8]);
 truss([x,35.9,z-6.8],[x,35.9,z+6.8]);
}
for(const sign of [-1,1]){
 box(sign*38.5,.7,50,.3,1.4,145,col('263e43'));
 for(let z=-19;z<122;z+=5){material(4,()=>box(sign*38.3,.78,z,.04,.64,4.8,col(z%3?'284b58':'62787a')));}
 for(let row=0;row<18;row++){
  const x=sign*(42+row*1.18),y=.5+row*.68;
  box(x,y,50,1.25,.42,151,col(row%2?'55616a':'626c72'));
  for(let seat=0;seat<157;seat++){
   const z=-24+seat*.95;if(seat%23<2)continue;
   box(x,y+.32,z,.47,.08,.47,col('344d5b'));box(x+sign*.17,y+.52,z,.075,.47,.5,col('3f5968'));
   spectator(x,y+.24,z,sign>0?-Math.PI/2:Math.PI/2,Math.floor(sceneryRandom()*60));
  }
 }
 // Open cantilever roof, lattice steel and a continuous floodlight strip.
 box(sign*56.5,15.2,50,26,.38,159,col('bac4c7'));box(sign*56.5,15.0,50,26,.09,159,col('46555f'));
 for(let z=-26;z<131;z+=15){truss([sign*70,0,z],[sign*70,16,z]);truss([sign*70,15.0,z],[sign*44,14.6,z]);truss([sign*70,17,z],[sign*44,14.6,z]);for(let j=0;j<6;j++)truss([sign*(45+j*4),14.6,z],[sign*(49+j*4),15.0+j*.25,z]);}
 material(4,()=>box(sign*44,14.5,50,.22,.15,150,col('f0f5ff')));
 for(let z=-22;z<127;z+=22){box(sign*43.8,13.8,z,.65,.5,3,col('253744'));for(let lamp=0;lamp<6;lamp++)material(4,()=>box(sign*43.4,13.65,z-1.2+lamp*.48,.08,.33,.31,col('e3eeff')));}
}
for(const sign of [-1,1]){
 for(let row=0;row<15;row++){
  const z=50+sign*(66+row*1.2),y=.5+row*.68;box(0,y,z,83,.42,1.25,col('596871'));
  for(let seat=0;seat<88;seat++){if(seat%22<2)continue;const x=-41+seat*.94;box(x,y+.32,z,.48,.08,.48,col('344d5b'));spectator(x,y+.24,z,sign>0?Math.PI:0,Math.floor(sceneryRandom()*60));}
 }
 box(0,13,50+sign*79,86,.28,17,col('8b999f'));
 for(let x=-41;x<=41;x+=10)truss([x,0,50+sign*85],[x,13,50+sign*85]);
 // Large scoreboards in each end stand.
 box(0,10,50+sign*70,14,5,.6,col('1a2931'));material(4,()=>box(0,10,50+sign*69.65,13.2,4.2,.08,col('243d46')));
}
geometryDetail=true;
const staticData=verts.array(),staticBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,staticBuffer);gl.bufferData(gl.ARRAY_BUFFER,staticData,gl.STATIC_DRAW);
const instancing=gl.getExtension('ANGLE_instanced_arrays'),crowdProgram=makeProgram(crowdVertexShader,fs),rainProgram=makeProgram(skyVertexShader,rainFragmentShader);
const crowdAttrs=['p','n','c'].map(name=>gl.getAttribLocation(crowdProgram,name)),instanceAttrs=['instancePose','instanceColor'].map(name=>gl.getAttribLocation(crowdProgram,name));
const crowdUniforms=Object.fromEntries(['vp',...Object.keys(uniforms)].map(name=>[name,gl.getUniformLocation(crowdProgram,name)]));
verts=new MeshBuilder();geometryDetail='crowd';spectatorGeometry(0,0,0,0,3);const crowdData=verts.array();const crowdBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,crowdBuffer);gl.bufferData(gl.ARRAY_BUFFER,crowdData,gl.STATIC_DRAW);
const instanceBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(crowdInstances),gl.STATIC_DRAW);geometryDetail=true;
const rainAttrs=gl.getAttribLocation(rainProgram,'pos'),rainUniforms=Object.fromEntries(['clock','storm','aspect'].map(name=>[name,gl.getUniformLocation(rainProgram,name)]));
const dynamicBuffer=gl.createBuffer();verts=new MeshBuilder(1048576);
const keys=new Set();let mode='menu',tries=0,player={x:0,z:0},defenders=[],time=0,previous=0,runTime=0,burstUntil=0,burstCD=0,fendUntil=0,fendCD=0,stepUntil=0,stepCD=0,stepDir=1,diveUntil=0,diveCD=0,noticeUntil=0,heading=0,cam=[-14,10,-16],audio,nextFootstep=0;

// Fictional gameplay attributes, tuned to the requested playing styles.
const attackers=[
 {id:'walsh',jerseyNumber:1,burstsPerRun:2,name:'Reece Walsh',club:'BRISBANE BRONCOS',role:'Fullback',style:'Speed + skill',description:'Electric pace and a sharp step. A long burst creates space.',speed:8.5,burstSpeed:12.5,burstDuration:3,burstRecovery:4.5,stepDuration:.32,stepRecovery:2,stepSpeed:17,stepSuccess:.9,fendSuccess:.65,fendRecovery:2.6,breakChance:.34,build:1,skin:'c78f70',hair:'36291f',kit:'651c38',trim:'edb454',beard:0,ratings:[96,95,58,48]},
 {id:'fonua-blake',jerseyNumber:8,burstsPerRun:2,name:'Addin Fonua-Blake',club:'CRONULLA SHARKS',role:'Forward',style:'Power runner',description:'Slower feet, a brutal fend and the strongest natural tackle break.',speed:7.1,burstSpeed:9,burstDuration:2,burstRecovery:4.5,stepDuration:.26,stepRecovery:3.3,stepSpeed:10,stepSuccess:.62,fendSuccess:.96,fendRecovery:2.1,breakChance:.86,build:1.35,skin:'ad7956',hair:'171719',kit:'8ccdeb',trim:'172128',beard:.13,ratings:[65,58,97,96]},
 {id:'mitchell',jerseyNumber:3,burstsPerRun:1,name:'Latrell Mitchell',club:'SOUTH SYDNEY RABBITOHS',role:'Centre',style:'Pace + power',description:'Fast and powerful through contact. His burst lasts just one second.',speed:8.2,burstSpeed:9.7,burstDuration:1,burstRecovery:3.5,stepDuration:.30,stepRecovery:2.5,stepSpeed:14,stepSuccess:.8,fendSuccess:.9,fendRecovery:2.3,breakChance:.70,build:1.2,skin:'ae7852',hair:'1b1b1b',kit:'167044',trim:'db332c',beard:.055,ratings:[89,80,90,85]},
 {id:'faalogo',jerseyNumber:1,burstsPerRun:3,name:'Sua Faalogo',club:'MELBOURNE STORM',role:'Fullback',style:'Footwork specialist',description:'Blistering pace and the biggest, quickest-recharging step. Avoid contact.',speed:8.7,burstSpeed:12.2,burstDuration:2.6,burstRecovery:3.5,stepDuration:.38,stepRecovery:1.35,stepSpeed:20,stepSuccess:.98,fendSuccess:.48,fendRecovery:2.8,breakChance:.13,build:.94,skin:'ba8163',hair:'202023',kit:'57318b',trim:'dfc457',beard:0,ratings:[98,99,43,24]},
 {id:'martin',jerseyNumber:12,burstsPerRun:3,name:'Liam Martin',club:'PENRITH PANTHERS',role:'Second row',style:'Relentless runner',description:'Strong through contact with three short power bursts and a reliable fend.',speed:7.35,burstSpeed:10.1,burstDuration:1.8,burstRecovery:3.6,stepDuration:.22,stepRecovery:3.1,stepSpeed:10,stepSuccess:.46,fendSuccess:.84,fendRecovery:2.2,breakChance:.72,build:1.13,skin:'d09a7e',hair:'4a352b',kit:'171a1d',trim:'e2bd45',beard:.035,ratings:[70,42,85,88]},
 {id:'egan',jerseyNumber:9,burstsPerRun:1,name:'Wayde Egan',club:'NEW ZEALAND WARRIORS',role:'Hooker',style:'Craft + fend',description:'Balanced pace and footwork, with a strong fend but limited tackle breaking.',speed:7.75,burstSpeed:10.2,burstDuration:2.2,burstRecovery:4.2,stepDuration:.27,stepRecovery:2.5,stepSpeed:13,stepSuccess:.66,fendSuccess:.83,fendRecovery:2.25,breakChance:.22,build:1.05,skin:'c28a69',hair:'3b2c25',kit:'243981',trim:'e44243',beard:.10,ratings:[77,65,84,32]},
 {id:'koula',jerseyNumber:3,burstsPerRun:1,name:'Tolutau Koula',club:'MANLY WARRINGAH SEA EAGLES',role:'Centre',style:'Pure speed',description:'The fastest runner in the game, with a sharp short step and little fend.',speed:9.4,burstSpeed:13.5,burstDuration:2.5,burstRecovery:4.6,stepDuration:.20,stepRecovery:2.1,stepSpeed:14,stepSuccess:.72,fendSuccess:.38,fendRecovery:2.9,breakChance:.50,build:1.04,skin:'b8795a',hair:'17191d',kit:'681c3e',trim:'eef0ec',beard:0,ratings:[100,62,34,58]},
 {id:'walker',jerseyNumber:7,burstsPerRun:2,name:'Sam Walker',club:'SYDNEY ROOSTERS',role:'Halfback',style:'Elusive playmaker',description:'Clever footwork and a useful fend compensate for his limited power in contact.',speed:7.55,burstSpeed:10.5,burstDuration:2.1,burstRecovery:3.8,stepDuration:.34,stepRecovery:1.8,stepSpeed:17,stepSuccess:.89,fendSuccess:.64,fendRecovery:2.55,breakChance:.18,build:.93,skin:'d4a181',hair:'403027',kit:'182431',trim:'d92d3b',beard:.025,ratings:[74,90,64,27]}
];
const teams=[
 {name:'Wests Tigers',kit:'1b2329',trim:'f49236',count:6},
 {name:'Gold Coast Titans',kit:'5ab7db',trim:'e5ba55',count:7},
 {name:'St George Illawarra Dragons',kit:'eeeeea',trim:'d82b36',count:8},
 {name:'Canterbury Bulldogs',kit:'ededec',trim:'245db3',count:9},
 {name:'Canberra Raiders',kit:'83b742',trim:'edf0e2',count:10},
 {name:'South Sydney Rabbitohs',kit:'167044',trim:'db332c',count:11},
 {name:'Melbourne Storm',kit:'57318b',trim:'dfc457',count:12},
 {name:'Brisbane Broncos',kit:'651c38',trim:'edb454',count:13},
 {name:'Sydney Roosters',kit:'182c52',trim:'d53737',count:13},
 {name:'Penrith Panthers',kit:'202126',trim:'db667e',count:13}
];
let tackle=null,resumeMode='play';
let burstsLeft=0,portraitRequest=0;
let selected=attackers[0],activeTeam=teams[0],lineZ=43,contactUntil=0;
// Begin fetching and decoding every portrait before the first selection change.
const portraits=attackers.map(a=>{
 const image=new Image();image.src=a.id+'.webp';image.alt=a.name+' in club colours';
 const ready=image.decode().then(()=>image);ready.catch(()=>{});
 return {image,ready};
});
Promise.all(portraits.map(p=>p.ready)).then(images=>{
 const atlas=document.createElement('canvas');atlas.width=2048;atlas.height=2048;const ctx=atlas.getContext('2d');
 const crops=[[214,47,108,125],[245,22,117,160],[223,31,121,139],[220,35,124,144],[158,0,112,145],[156,3,126,148],[158,0,123,148],[154,0,132,146]];
 images.forEach((image,i)=>ctx.drawImage(image,...crops[i],(i%4)*512,Math.floor(i/4)*512,512,512));
 ctx.fillStyle='rgba(245,248,237,0.96)';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 160px Arial';
 ['10','20','30','40','50'].forEach((text,i)=>ctx.fillText(text,i*256+128,1280));
 ctx.font='bold 125px Arial';ctx.fillText('RUN IT',1536,1280);ctx.font='bold 74px Arial';ctx.fillText('100 METRES. 10 TRIES.',1024,1750);
 gl.bindTexture(gl.TEXTURE_2D,faceTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);faceAtlasReady=true;
}).catch(()=>{faceAtlasReady=false;});
function showPortrait(index){
 const request=++portraitRequest,previous=$('player-photo');
 previous.style.visibility='hidden';
 portraits[index].ready.then(image=>{
  if(request!==portraitRequest)return;
  image.id='player-photo';image.className='';image.style.visibility='visible';
  $('player-photo').replaceWith(image);
 }).catch(()=>{
  if(request!==portraitRequest)return;
  const image=$('player-photo');image.removeAttribute('src');image.alt='Portrait unavailable';image.style.visibility='visible';
 });
}
function tackleBreakChance(runner,level,bursting){
 const base=Math.max(.06,runner.breakChance-level*.012);
 // Momentum removes 45% of the remaining tackle risk, while preserving player differences.
 return Math.min(.97,base+(bursting?(1-base)*.45:0));
}
function updateBurstHUD(){
 const state=time<burstUntil?'ACTIVE':burstsLeft===0?'Used up':time<burstCD?`${(burstCD-time).toFixed(1)}s`:'Ready';
 $('burst').textContent=state+' · '+burstsLeft+' left';
}
function selectAttacker(index){
 selected=attackers[index];
 showPortrait(index);
 $('player-name').textContent=selected.name;$('player-club').textContent=selected.club+' · '+selected.role.toUpperCase();
 $('player-style').textContent=selected.style;$('player-description').textContent=selected.description;
 $('selection-count').textContent=String(index+1).padStart(2,'0')+' / '+String(attackers.length).padStart(2,'0');
 $('player-number').textContent=String(selected.jerseyNumber);
 for(let i=0;i<4;i++){$('rating-'+i).value=selected.ratings[i];$('value-'+i).textContent=selected.ratings[i];}
 attackers.forEach((runner,i)=>$('pick-'+i).setAttribute('aria-pressed',String(i===index)));
 $('burst-info').textContent=selected.burstsPerRun+' burst'+(selected.burstsPerRun===1?'':'s')+' per run · '+selected.burstDuration+'s each';
}
attackers.forEach((a,i)=>{$('pick-'+i).onclick=()=>{if(mode==='menu')selectAttacker(i)}});

const soundDefaults={footstep:0,tackle:0,score:1,burst:0,step:0,fend:0,button:0,tackleBreak:0};
const soundSelection={...soundDefaults};
function audioEngine(){
 const AudioEngine=window.AudioContext||window.webkitAudioContext||globalThis.AudioContext;
 audio??=new AudioEngine();if(audio.state==='suspended')audio.resume();return audio;
}
function tone(ctx,freq,start,duration,gain=.04,type='sine',endFreq=freq){
 const oscillator=ctx.createOscillator(),volume=ctx.createGain();oscillator.type=type;
 oscillator.frequency.setValueAtTime(Math.max(20,freq),start);oscillator.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),start+duration);
 volume.gain.setValueAtTime(.0001,start);volume.gain.linearRampToValueAtTime(gain,start+.008);volume.gain.exponentialRampToValueAtTime(.0001,start+duration);
 oscillator.connect(volume);volume.connect(ctx.destination);oscillator.start(start);oscillator.stop(start+duration+.02);
}
function noise(ctx,start,duration,frequency=220,gain=.025,filterType='lowpass'){
 const frames=Math.max(1,Math.floor(ctx.sampleRate*duration)),buffer=ctx.createBuffer(1,frames,ctx.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<frames;i++)data[i]=(Math.random()*2-1)*(1-i/frames*.35);
 const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),volume=ctx.createGain();source.buffer=buffer;filter.type=filterType;filter.frequency.value=frequency;
 volume.gain.setValueAtTime(.0001,start);volume.gain.linearRampToValueAtTime(gain,start+.012);volume.gain.exponentialRampToValueAtTime(.0001,start+duration);
 source.connect(filter);filter.connect(volume);volume.connect(ctx.destination);source.start(start);source.stop(start+duration+.02);
}
function say(word,variant=0){
 try{
  const synth=window.speechSynthesis;if(!synth||typeof SpeechSynthesisUtterance==='undefined')return;
  const utterance=new SpeechSynthesisUtterance(word),voices=synth.getVoices?.()||[];
  utterance.voice=voices.find(v=>/^en-AU/i.test(v.lang))||voices.find(v=>/^en-(GB|US)/i.test(v.lang))||null;
  const styles=[{rate:1.02,pitch:.82,volume:.72},{rate:.82,pitch:.62,volume:.82},{rate:1.20,pitch:1.05,volume:.74}][variant]||{};
  Object.assign(utterance,styles);synth.speak(utterance);
 }catch{}
}
function gameSound(kind,choice=soundSelection[kind]??0){
 if(kind==='tackle')say('Oof!',choice);else if(kind==='fend')say('Booyah!',choice);else if(kind==='tackleBreak')say('Oh yeah!',choice);
 try{
  const ctx=audioEngine(),now=ctx.currentTime+.005;
  if(kind==='footstep'){
   const profiles=[[105,.018,.038],[150,.014,.034],[205,.012,.029]],p=profiles[choice];noise(ctx,now,.07,p[0],p[2]);tone(ctx,p[0],now,.075,p[1],'sine',p[0]*.7);
  }else if(kind==='step'){
   const profiles=[[150,.075,.08],[100,.09,.11],[240,.065,.065]],p=profiles[choice];noise(ctx,now,.12,p[0]*2,p[2],'bandpass');tone(ctx,p[0],now,.13,p[1],'triangle',p[0]*.55);
  }else if(kind==='tackle'){
   const profiles=[[75,.11,.12],[58,.14,.16],[46,.16,.20]],p=profiles[choice];noise(ctx,now,.22,150,p[2]);tone(ctx,p[0],now,.24,p[1],'sine',32);
  }else if(kind==='score'){
   const profiles=[[1.15,.045,720],[1.55,.065,950],[2.0,.085,1250]],p=profiles[choice];noise(ctx,now,p[0],p[2],p[1],'bandpass');
   for(let i=0;i<7+choice*4;i++){const at=now+.05+i*.095;noise(ctx,at,.05,1800,.018+choice*.004,'highpass')}
   tone(ctx,392,now+.04,.55,.022,'sawtooth',523);tone(ctx,523,now+.18,.65,.018,'sawtooth',784);
  }else if(kind==='burst'){
   const sets=[[220,330,494],[130,260,520],[330,554,880]],notes=sets[choice];notes.forEach((freq,i)=>tone(ctx,freq,now+i*.085,.24,.04,'sawtooth',freq*1.08));noise(ctx,now,.35,900,.018,'highpass');
  }else if(kind==='fend'){
   tone(ctx,[180,120,260][choice],now,.16,.035,'square',[260,170,390][choice]);
  }else if(kind==='tackleBreak'){
   tone(ctx,[330,220,440][choice],now,.18,.04,'triangle',[495,330,660][choice]);
  }else if(kind==='button'){
   const profiles=[[620,860,.065],[980,710,.045],[440,1320,.08]],p=profiles[choice];tone(ctx,p[0],now,p[2],.022,'square',p[1]);
  }
 }catch{}
}
function sound(freq,duration=.1){try{const ctx=audioEngine();tone(ctx,freq,ctx.currentTime+.005,duration,.04,'sine',freq)}catch{}}
document.addEventListener('pointerdown',event=>{if(event.target?.closest?.('button'))gameSound('button')});
document.addEventListener('click',event=>{if(event.detail===0&&event.target?.closest?.('button'))gameSound('button')});
function notice(s){$('message').textContent=s;noticeUntil=time+1.6}
function setupRun(){if(portraitBlocked())return;
 stopCelebration();
 player={x:0,z:0,gait:0,runBlend:0};tackle=null;heading=0;runTime=0;nextFootstep=0;keys.clear();resetTouch();
 burstUntil=burstCD=fendUntil=fendCD=stepUntil=stepCD=diveUntil=diveCD=0;contactUntil=0;burstsLeft=selected.burstsPerRun;
 activeTeam=teams[tries];lineZ=43;defenders=[];
 const count=activeTeam.count, hasFullback=tries>=3, lineCount=count-(hasFullback?1:0);
 for(let i=0;i<count;i++){
  const fullback=hasFullback&&i===count-1;
  let x,z;
  if(fullback){x=0;z=72;}
  else if(tries<3){x=-27+i*54/(lineCount-1)+(rand()-.5)*5;z=22+rand()*58;}
  else {x=-30+i*60/(lineCount-1);z=lineZ+(tries===9?0:(rand()-.5)*(9-tries)*2.5);}
  defenders.push({x,z,homeX:x,offsetZ:z-lineZ,fullback,stun:0,phase:rand()*6,
   skin:col(['bc8661','8b5b40','deb092','684b3c'][i%4]),hair:col(['30251f','a7824f','181819','574332'][i%4]),
   build:.9+rand()*.22,engaged:false,cool:0,angle:Math.PI,moving:false});
 }
 mode='play';$('menu').hidden=true;$('overlay').hidden=true;$('hud').hidden=false;$('tries').textContent=tries;
 $('team-name').textContent=activeTeam.name.toUpperCase();
 $('level').textContent=`LEVEL ${String(tries+1).padStart(2,'0')} · ${count} DEFENDERS`;
 $('runner-hud').textContent=selected.name;
 updateBurstHUD();$('fend').textContent=$('step').textContent='Ready';
 $('metres').textContent='100';$('progress').style.width='0%';
 cam=[0,5.2,-9];notice(tries===9?'12 in the line. One fullback. Find your gap.':activeTeam.name+' · Find the open space');sound(440);
}
const celebrationCanvas=$('celebration-canvas'),celebrationContext=celebrationCanvas.getContext('2d');
let celebrationFrame=0,celebrationBursts=[],nextFirework=0;
function fireworkBurst(width,height){
 const hue=Math.floor(Math.random()*360),x=width*(.12+Math.random()*.76),y=height*(.10+Math.random()*.42);
 for(let i=0;i<42;i++){const angle=i/42*Math.PI*2+Math.random()*.08,speed=1.7+Math.random()*4.1;celebrationBursts.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1,hue,size:1.4+Math.random()*2.2});}
}
function stopCelebration(){
 if(celebrationFrame)cancelAnimationFrame(celebrationFrame);
 celebrationFrame=0;celebrationBursts=[];celebrationCanvas.hidden=true;
 celebrationContext.clearRect(0,0,celebrationCanvas.width,celebrationCanvas.height);
}
function startCelebration(){
 stopCelebration();celebrationCanvas.hidden=false;nextFirework=0;
 const started=performance.now();
 function animateFireworks(now){
  if(mode!=='won'){stopCelebration();return;}
  const ratio=Math.min(window.devicePixelRatio||1,1.5),width=Math.floor(innerWidth*ratio),height=Math.floor(innerHeight*ratio);
  if(celebrationCanvas.width!==width||celebrationCanvas.height!==height){celebrationCanvas.width=width;celebrationCanvas.height=height;celebrationContext.setTransform(ratio,0,0,ratio,0,0);}
  const viewWidth=width/ratio,viewHeight=height/ratio;celebrationContext.clearRect(0,0,viewWidth,viewHeight);
  if(now-started<12000&&now>=nextFirework){fireworkBurst(viewWidth,viewHeight);nextFirework=now+260+Math.random()*380;}
  celebrationContext.globalCompositeOperation='lighter';
  for(const p of celebrationBursts){
   p.x+=p.vx;p.y+=p.vy;p.vy+=.035;p.vx*=.994;p.life-=.012;
   celebrationContext.fillStyle=`hsla(${p.hue},100%,65%,${Math.max(0,p.life)})`;
   celebrationContext.beginPath();celebrationContext.arc(p.x,p.y,p.size,0,Math.PI*2);celebrationContext.fill();
  }
  celebrationBursts=celebrationBursts.filter(p=>p.life>0);
  celebrationContext.globalCompositeOperation='source-over';
  if(now-started<12000||celebrationBursts.length)celebrationFrame=requestAnimationFrame(animateFireworks);else celebrationFrame=0;
 }
 celebrationFrame=requestAnimationFrame(animateFireworks);
}
function overlay(label,title,body,button,victory=false){
 $('overlay').hidden=false;$('overlay').dataset.state=victory?'victory':'standard';
 $('result-label').textContent=label;$('result-title').textContent=title;$('result-body').textContent=body;$('again').textContent=button;
 $('victory-banner').hidden=!victory;
 if(victory){$('victory-runner').textContent=selected.name.toUpperCase();startCelebration();}else stopCelebration();
}
function lose(reason){mode='over';let scored=tries;tries=0;$('tries').textContent='0';overlay('RUN OVER',reason,`${scored} of 10 consecutive tries. Your streak has reset. Find a gap and have another run.`,'TRY AGAIN');if(reason!=='Tackled.')sound(110,.35)}
function score(){tries++;$('tries').textContent=tries;mode=tries===10?'won':'scored';overlay(tries===10?'CHALLENGE COMPLETE':'TRY CONFIRMED',tries===10?'UNTOUCHABLE!':'TRY!',tries===10?`${selected.name} has beaten all ten teams without being tackled.`:`${tries} / 10 tries. Next up: ${teams[tries]?.name}. Sharper, faster defending.`,tries===10?'PLAY AGAIN':'NEXT RUN',tries===10);gameSound('score')}
function pause(){if(mode==='play'||mode==='tackling'){resumeMode=mode;mode='paused';keys.clear();resetTouch();overlay('TIME OUT','Paused','Your run is safe. Press Escape or resume when you’re ready.','RESUME')}else if(mode==='paused'){if(portraitBlocked())return;landscape();mode=resumeMode;$('overlay').hidden=true}}
$('start').onclick=()=>{landscape();if(portraitBlocked())return;tries=0;setupRun()};$('again').onclick=()=>{if(mode==='paused')pause();else{if(mode==='won')tries=0;setupRun()}};$('choose').onclick=()=>{stopCelebration();mode='menu';tackle=null;tries=0;$('overlay').hidden=true;$('hud').hidden=true;$('menu').hidden=false};$('pause').onclick=pause;
const touchInput={x:0,z:0,pointer:null};
const touchDevice=()=>window.matchMedia('(any-pointer: coarse)').matches;
const portraitBlocked=()=>touchDevice()&&innerHeight>innerWidth;
function resetTouch(){touchInput.x=touchInput.z=0;touchInput.pointer=null;$('stick-knob').style.transform='translate(0px,0px)';}
function performSkill(k){if(mode!=='play'||portraitBlocked())return;
if(k==='shift'&&time>=burstCD&&burstsLeft>0){burstsLeft--;burstUntil=time+selected.burstDuration;burstCD=time+selected.burstRecovery;updateBurstHUD();notice('BURST · '+burstsLeft+' LEFT');gameSound('burst')}if(k==='f'&&time>=fendCD){fendUntil=time+.65;fendCD=time+selected.fendRecovery;notice('FEND');gameSound('fend')}if(k==='e'&&time>=stepCD){stepDir=touchInput.x>.1?1:touchInput.x<-.1?-1:keys.has('a')?1:keys.has('d')?-1:-stepDir;stepUntil=time+selected.stepDuration;stepCD=time+selected.stepRecovery;notice('STEP');gameSound('step')}if(k==='q'&&time>=diveCD){if(player.z>=100){score();return}diveUntil=time+.65;diveCD=time+1.5;notice(player.z>=95?'REACH FOR THE LINE':'DIVE')}
}
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase(),canContinue=(k===' '||k==='enter')&&['paused','over','scored','won'].includes(mode);if(['w','a','s','d','q','e','f','shift','escape',' '].includes(k)||canContinue)e.preventDefault();if(e.repeat)return;if(canContinue){$('again').onclick();return}keys.add(k);if(k==='escape')pause();else performSkill(k);});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();resetTouch();if(mode==='play'||mode==='tackling')pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();resetTouch();if(mode==='play'||mode==='tackling')pause()}});
const stick=$('thumbstick');
function moveStick(e){
 if(e.pointerId!==touchInput.pointer)return;
 const rect=stick.getBoundingClientRect(),radius=rect.width*.34;
 let x=(e.clientX-rect.left-rect.width/2)/radius,y=(e.clientY-rect.top-rect.height/2)/radius;
 const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
 touchInput.x=Math.abs(x)<.10?0:-x;touchInput.z=Math.abs(y)<.10?0:-y;
 $('stick-knob').style.transform=`translate(${x*radius}px,${y*radius}px)`;
}
stick.addEventListener('pointerdown',e=>{if(mode!=='play'||touchInput.pointer!==null||portraitBlocked())return;e.preventDefault();touchInput.pointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);});
stick.addEventListener('pointermove',moveStick);
for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{if(e.pointerId===touchInput.pointer)resetTouch()});
for(const [id,key] of [['touch-burst','shift'],['touch-fend','f'],['touch-step','e'],['touch-ground','q']]){
 $(id).addEventListener('pointerdown',e=>{e.preventDefault();performSkill(key)});
 $(id).addEventListener('click',e=>{if(e.detail===0)performSkill(key)});
}
async function landscape(){
 if(!touchDevice())return;
 try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();}catch{}
 try{await window.screen.orientation?.lock?.('landscape');}catch{}
}
function orientationChanged(){
 $('rotate-screen').hidden=!portraitBlocked();
 if(portraitBlocked()){resetTouch();keys.clear();resetTouch();if(mode==='play'||mode==='tackling')pause();}
}
window.addEventListener('resize',orientationChanged);
$('rotate-button').onclick=landscape;
function updateTouchHUD(){
 $('touch-controls').hidden=!touchDevice()||mode!=='play'||portraitBlocked();
 for(const [id,cd,until,empty] of [['touch-burst',burstCD,burstUntil,burstsLeft===0],['touch-fend',fendCD,fendUntil,false],['touch-step',stepCD,stepUntil,false],['touch-ground',diveCD,diveUntil,false]]){
  $(id).disabled=mode!=='play'||time<cd||empty;
  const value=time<until?'ACTIVE':empty?'Used up':time<cd?(cd-time).toFixed(1)+'s':'Ready';
  $(id+'-status').textContent=value+(id==='touch-burst'?' · '+burstsLeft+' left':'');
 }
}
orientationChanged();
const clamp01=v=>Math.max(0,Math.min(1,v));
function cooldownProgress(readyAt,recovery,empty=false){return empty?0:time>=readyAt?1:clamp01(1-(readyAt-time)/recovery);}
function setAbilityBar(id,value){const bar=$(id+'-bar');bar.style.transform=`scaleX(${clamp01(value)})`;}
function updateAbilityBars(){
 const values={
  burst:cooldownProgress(burstCD,selected.burstRecovery,burstsLeft===0),
  fend:cooldownProgress(fendCD,selected.fendRecovery),
  step:cooldownProgress(stepCD,selected.stepRecovery),
  ground:clamp01(player.z/100)
 };
 for(const [ability,value] of Object.entries(values)){setAbilityBar(ability,value);setAbilityBar('touch-'+ability,value);}
}
const smooth=v=>{v=clamp01(v);return v*v*(3-2*v)};
function beginTackle(defender){
 const others=defenders.filter(d=>d!==defender&&d.stun<=time&&Math.hypot(d.x-player.x,d.z-player.z)<1.65).slice(0,1);
 const involved=[defender,...others];
 tackle={elapsed:0,heading,origin:{x:player.x,z:player.z},involved,starts:involved.map(d=>({x:d.x,z:d.z,angle:d.angle||0})),impactPlayed:false};
 mode='tackling';keys.clear();resetTouch();burstUntil=fendUntil=stepUntil=diveUntil=0;
 player.fall=0;player.fallHeading=heading;player.runBlend=0;
 involved.forEach(d=>{d.wrapping=true;d.fall=0;d.fallHeading=heading;d.runBlend=0;});
 $('message').textContent='TACKLE';
}
function tickTackle(dt){
 tackle.elapsed+=dt;
 const t=tackle.elapsed,wrap=smooth(t/.3),fall=smooth((t-.3)/.7),slide=smooth((t-.15)/1.0);
 const forward=[Math.sin(tackle.heading),Math.cos(tackle.heading)],side=[forward[1],-forward[0]];
 player.x=tackle.origin.x+forward[0]*slide*.85;player.z=tackle.origin.z+forward[1]*slide*.85;
 player.fall=fall;player.wrap=wrap;
 tackle.involved.forEach((d,i)=>{
  const sign=i===0?1:-1,start=tackle.starts[i];
  const tx=player.x+side[0]*sign*.60-forward[0]*.08,tz=player.z+side[1]*sign*.60-forward[1]*.08;
  d.x=start.x+(tx-start.x)*wrap;d.z=start.z+(tz-start.z)*wrap;
  const target=tackle.heading-sign*Math.PI/2;
  d.angle=start.angle+Math.atan2(Math.sin(target-start.angle),Math.cos(target-start.angle))*wrap;
  d.fall=fall;d.wrap=wrap;d.moving=false;
 });
 if(fall>.96&&!tackle.impactPlayed){tackle.impactPlayed=true;gameSound('tackle');}
 // Give the grounded pose a moment before showing the result.
 if(t>=1.65)lose('Tackled.');
}
function bodyPoint(p,attacker,a,b,c,bob=0){
 const angle=attacker?heading:(p.angle??Math.PI),cs=Math.cos(angle),sn=Math.sin(angle);
 let wx=a*cs+c*sn,wz=-a*sn+c*cs;
 if(p.fall!==undefined){
  const f=p.fall*Math.PI/2,forward=[Math.sin(p.fallHeading),Math.cos(p.fallHeading)],right=[forward[1],-forward[0]];
  const along=wx*forward[0]+wz*forward[1],across=wx*right[0]+wz*right[1],yy=b-.9;
  const tilted=along*Math.cos(f)+yy*Math.sin(f);
  const y=.9+((attacker?.38:.53)-.9)*p.fall+yy*Math.cos(f)-along*Math.sin(f);
  return[p.x+right[0]*across+forward[0]*tilted,y,p.z+right[1]*across+forward[1]*tilted];
 }
 if(attacker&&time<diveUntil){const yy=b-1;return[p.x+a,.62+yy*.22-c*.96,p.z+yy*.96+c*.22];}
 return[p.x+wx,b+bob,p.z+wz];
}
// Stance: foot travels front to back on the turf. Recovery: heel lifts and swings forward.
function footPath(phase,speed,side,bob=0){
 const u=((phase/(Math.PI*2)+(side===1?0:.5))%1+1)%1,stance=.24;
 let z,lift=0;
 if(u<stance){z=.27-.54*u/stance;}
 else{const q=(u-stance)/(1-stance);z=-.27+.54*smooth(q);lift=Math.sin(Math.PI*q)*.29;}
 return[side*.16,.12+lift*speed-bob,z*speed];
}
// Two-bone leg solver: the knee always stays forward of the hip-to-ankle line.
function legPose(phase,speed,side,bob=0){
  const hip=[side*.16,.87,0];
  const ankle=footPath(phase,speed,side,bob);
  const upper=.39,lower=.40;
  let dy=ankle[1]-hip[1],dz=ankle[2],distance=Math.hypot(dy,dz);
  const reach=Math.min(distance,upper+lower-.005), uy=dy/distance,uz=dz/distance;
  ankle[1]=hip[1]+uy*reach;ankle[2]=uz*reach;
  const along=(upper*upper-lower*lower+reach*reach)/(2*reach);
  const bend=Math.sqrt(Math.max(0,upper*upper-along*along));
  const knee=[side*.16,hip[1]+uy*along+uz*bend,uz*along-uy*bend];
  return {hip,knee,ankle};
}
// Centred block numerals conform to the curved back rather than disappearing into it.
const jerseyGlyphs={
 0:['01110','11011','11011','11011','11011','11011','01110'],
 1:['00100','01100','00100','00100','00100','00100','11111'],
 2:['11110','00011','00011','01110','11000','11000','11111'],
 3:['11110','00011','00011','01110','00011','00011','11110'],
 4:['11011','11011','11011','11111','00011','00011','00011'],
 5:['11111','11000','11000','11110','00011','00011','11110'],
 6:['01110','11000','11000','11110','11011','11011','01110'],
 7:['11111','00011','00110','00110','01100','01100','01100'],
 8:['01110','11011','11011','01110','11011','11011','01110'],
 9:['01110','11011','11011','01111','00011','00011','01110']
};
function jerseyNumber(number,build,local){
 const digits=String(number).split(''),totalColumns=digits.length*5+(digits.length-1),width=.035,height=.045;
 const origin=local(0,0,0),normal=norm(local(0,0,-1).map((v,i)=>v-origin[i]));
 const point=(column,row)=>{
  const x=(totalColumns/2-column)*width,y=1.3+(3.5-row)*height;
  const [rx,rz]=torsoRadius(y,build);const z=-rz*Math.sqrt(Math.max(.01,1-(x/rx)**2))-.007;
  return local(x,y,z);
 };
 digits.forEach((digit,digitIndex)=>jerseyGlyphs[digit].forEach((row,j)=>[...row].forEach((pixel,i)=>{
   if(pixel!=='1')return;
   const column=digitIndex*6+i,q=[point(column,j),point(column+1,j),point(column+1,j+1),point(column,j+1)];
   for(const index of [0,1,2,0,2,3])vertex(q[index],normal,white);
 })));
}
// Continuous rings form the torso, skull and shorts; limbs taper through joints.
const torsoRings=[[.89,.225,.14],[1.04,.22,.14],[1.20,.25,.165],[1.40,.295,.18],[1.50,.26,.145],[1.58,.105,.085]];
function torsoRadius(y,build){
 for(let i=1;i<torsoRings.length;i++)if(y<=torsoRings[i][0]){const a=torsoRings[i-1],b=torsoRings[i],t=Math.max(0,(y-a[0])/(b[0]-a[0]));return[(a[1]+(b[1]-a[1])*t)*build,a[2]+(b[2]-a[2])*t];}
 return[.105*build,.085];
}
function loft(rings,local,basis,color,segments=16){
 for(let row=1;row<rings.length;row++){
  const a=rings[row-1],b=rings[row];
  for(let i=0;i<segments;i++){
   const u=i*Math.PI*2/segments,v=(i+1)*Math.PI*2/segments;
   const p=(r,t)=>local(Math.cos(t)*r[1],r[0],Math.sin(t)*r[2]);
   const n=(r,t)=>{const normal=norm([Math.cos(t)/r[1],((a[1]+a[2])-(b[1]+b[2]))/Math.max(.01,b[0]-a[0]),Math.sin(t)/r[2]]);return basis[0].map((_,j)=>basis[0][j]*normal[0]+basis[1][j]*normal[1]+basis[2][j]*normal[2]);};
   const q=[p(a,u),p(b,u),p(b,v),p(a,v)],ns=[n(a,u),n(b,u),n(b,v),n(a,v)];
   for(const j of [0,1,2,0,2,3])vertex(q[j],ns[j],color);
  }
 }
}
function facePatch(local,basis,index){
 if(!faceAtlasReady)return;
 const column=index%4,row=Math.floor(index/4);
 const point=(u,v)=>{const shape=Math.sin(v*Math.PI);const x=(u-.5)*.235*(.60+.40*shape),y=1.904-v*.244,z=(.068+.031*shape)*Math.sqrt(Math.max(.08,1-((u-.5)*1.82)**2))+.007;
  return {p:local(x,y,z),uv:[-1,(column+u)*.25,(row+v)*.25],n:basis[2]};};
 material(3,()=>{for(let j=0;j<8;j++)for(let i=0;i<8;i++){
  const q=[point(i/8,j/8),point((i+1)/8,j/8),point((i+1)/8,(j+1)/8),point(i/8,(j+1)/8)];
  for(const k of [0,1,2,0,2,3])vertex(q[k].p,q[k].n,q[k].uv);
 }});
}
const poseCache=new WeakMap();
function replayPose(p,cached){
 const angle=(p.angle??Math.PI)-cached.angle,cs=Math.cos(angle),sn=Math.sin(angle),data=cached.data;
 for(let i=0;i<data.length;i+=9){const x=data[i]-cached.x,z=data[i+2]-cached.z,nx=data[i+3],nz=data[i+5];verts.put9(p.x+x*cs+z*sn,data[i+1],p.z-x*sn+z*cs,nx*cs+nz*sn,data[i+4],-nx*sn+nz*cs,data[i+6],data[i+7],data[i+8]);}
}
function footballer(p,attacker,phase,speed){
 const distance=Math.hypot(p.x-cam[0],p.z-cam[2]),detailed=attacker||graphicsHigh()&&distance<25;
 const cacheable=!attacker&&distance>16&&p.fall===undefined&&!p.wrapping,cached=poseCache.get(p);
 if(cacheable&&cached&&cached.until>weatherClock&&cached.detail===detailed){replayPose(p,cached);return;}
 const firstVertex=verts.length;geometryDetail=detailed;
 const build=attacker?selected.build:(p.build||1),s=1+(build-1)*.68;
 const sk=attacker?col(selected.skin):(p.skin||skin),shirt=col(attacker?selected.kit:activeTeam.kit),trim=col(attacker?selected.trim:activeTeam.trim),hair=attacker?col(selected.hair):(p.hair||col('302a23'));
 const bob=p.fall!==undefined?0:Math.cos(phase*2)*speed*.018;
 const local=(a,b,c)=>bodyPoint(p,attacker,a,b,c,bob),origin=local(0,0,0);
 const basis=[[1,0,0],[0,1,0],[0,0,1]].map(v=>norm(local(...v).map((n,i)=>n-origin[i])));
 const ball=(a,b,c,sx,sy,sz,color)=>ell(...local(a,b,c),sx,sy,sz,color,basis);
 const segment=(a,b,r1,r2,color)=>taper(local(...a),local(...b),r1,r2,color,detailed?12:8);
 material(2,()=>loft(torsoRings.map(r=>[r[0],r[1]*s,r[2]]),local,basis,shirt,detailed?20:12));
 // Collar, shoulder seams and a fitted kit chevron.
 material(2,()=>{
  segment([-.10,1.56,.075],[0,1.51,.11],.018,.018,white);segment([0,1.51,.11],[.10,1.56,.075],.018,.018,white);
  segment([-.23*s,1.42,.12],[0,1.29,.172],.021,.024,trim);segment([0,1.29,.172],[.23*s,1.42,.12],.024,.021,trim);
  for(const side of [-1,1]){segment([side*.09,1.51,-.045],[side*.29*s,1.46,-.025],.008,.008,trim);}
 });
 for(const side of [-1,1]){
  const {hip,knee,ankle}=legPose(phase,speed,side,bob);const thigh=hip.map((v,i)=>v+(knee[i]-v)*.5),calf=knee.map((v,i)=>v+(ankle[i]-v)*.40);
  material(3,()=>{segment(hip,thigh,.126*s,.139*s,sk);segment(thigh,knee,.139*s,.083,sk);ball(...knee,.087,.09,.082,sk);segment(knee,calf,.079,.098*s,sk);segment(calf,ankle,.098*s,.055,sk);});
  material(2,()=>{
   segment([hip[0],.94,0],[hip[0],.73,0],.145*s,.136*s,shirt);
   segment([hip[0],.735,0],[hip[0],.725,0],.138*s,.138*s,trim);
   const sock=ankle.map((v,i)=>v+(knee[i]-v)*.43);segment(sock,ankle,.070,.058,shirt);
   segment(sock,sock.map((v,i)=>v+(ankle[i]-v)*.1),.071,.067,trim);
  });
  material(0,()=>{
   ball(ankle[0],ankle[1]-.037,ankle[2]+.077,.075,.060,.155,attacker?col('d8e6bf'):col('cad3d6'));
   ball(ankle[0],ankle[1]-.072,ankle[2]+.075,.077,.019,.148,col('28313a'));
   if(detailed)for(let lace=0;lace<3;lace++)segment([ankle[0]-.04,ankle[1]+.018,ankle[2]+.07+lace*.025],[ankle[0]+.04,ankle[1]+.018,ankle[2]+.07+lace*.025],.004,.004,white);
  });
  const stride=footPath(phase,speed,side)[2],extended=attacker&&side===-1&&time<fendUntil;
  const shoulder=[side*.285*s,1.46,0],upper=[side*.34*s,1.29,stride*-.24];
  material(2,()=>{segment(shoulder,upper,.105*s,.094*s,shirt);segment(upper,upper.map((v,i)=>v+(i===1?-.012:0)),.096*s,.094*s,trim);});
  let elbow=[side*(extended?.62:.37)*s,extended?1.40:1.12,attacker&&side===1?.15:-stride*.64],hand=[side*(extended?.89:.27)*s,extended?1.43:1.09,attacker&&side===1?(p.fall!==undefined?.20:.30):.23];
  material(3,()=>{
   if(p.wrapping&&tackle){
    const start=local(...upper),grip=bodyPoint(player,true,side*.25,1.14,.13),rest=local(...hand),target=rest.map((v,i)=>v+(grip[i]-v)*(p.wrap||0));
    const mid=start.map((v,i)=>(v+target[i])/2);mid[0]+=Math.cos(tackle.heading)*side*.16;mid[2]-=Math.sin(tackle.heading)*side*.16;mid[1]+=.06;
    taper(start,mid,.09*s,.065,sk,10);taper(mid,target,.069,.042,sk,10);ell(...target,.058,.078,.035,sk,basis);
   }else{
    segment(upper,elbow,.10*s,.064,sk);ball(...elbow,.064,.065,.065,sk);segment(elbow,hand,.071,.041,sk);ball(...hand,.056,.075,.035,sk);
    if(detailed)for(let finger=0;finger<3;finger++)ball(hand[0]-.025+finger*.018,hand[1]-.06,hand[2]+.012,.009,.036,.013,sk);
   }
  });
 }
 material(3,()=>{
  segment([0,1.51,0],[0,1.70,0],.082,.072,sk);
  loft([[1.65,.064,.064],[1.70,.105,.08],[1.79,.124,.101],[1.87,.114,.099],[1.93,.072,.061],[1.95,.012,.012]],local,basis,sk,detailed?20:10);
  ball(-.124,1.79,0,.018,.038,.026,sk);ball(.124,1.79,0,.018,.038,.026,sk);
 });
 material(0,()=>{
  ball(0,1.93,-.012,.110,.045,.085,hair);
  if(attacker&&selected.id==='walsh')for(let i=0;i<9;i++)ball(Math.sin(i*2.1)*.087,1.945+(i%3)*.018,Math.cos(i*2.1)*.063,.031,.036,.032,hair);
  else ball(0,1.90,-.082,.102,.069,.025,hair);
 });
 if(attacker)facePatch(local,basis,attackers.indexOf(selected));
 if(detailed){
  // Nose and lips give the photographic face relief rather than a flat portrait plane.
  material(3,()=>{ball(0,1.793,.113,.017,.027,.028,sk);});
  if(!attacker||!faceAtlasReady){material(0,()=>{for(const a of [-.048,.048]){ball(a,1.828,.092,.020,.010,.007,white);ball(a,1.828,.10,.008,.008,.004,col('332d28'));}ball(0,1.735,.083,.035,.007,.008,col('94685a'));});}
 }
 if(attacker){
  material(0,()=>{
   const bz=p.fall!==undefined?.20:.29;
   ball(.24*s,1.15,bz,.109,.211,.109,col('dfd7bf'));
   for(const sign of [-1,1])segment([.24*s-.066,1.15+sign*.15,bz+.03],[.24*s+.066,1.15+sign*.15,bz+.03],.008,.008,col('254750'));
   for(let lace=0;lace<4;lace++)segment([.24*s-.018,1.11+lace*.025,bz+.105],[.24*s+.018,1.11+lace*.025,bz+.105],.003,.003,col('6a604b'));
  });
  material(2,()=>jerseyNumber(selected.jerseyNumber,s,local));
 }
 if(cacheable)poseCache.set(p,{data:verts.data.slice(firstVertex,verts.length),x:p.x,z:p.z,angle:p.angle??Math.PI,until:weatherClock+.12,detail:detailed});
 geometryDetail=true;
}
function tick(dt){if(portraitBlocked())return;if(mode==='tackling'){tickTackle(dt);return;}if(mode!=='play')return;time+=dt;runTime+=dt;let dx=(keys.has('a')?1:0)-(keys.has('d')?1:0)+touchInput.x,dz=(keys.has('w')?1:0)-(keys.has('s')?1:0)+touchInput.z,l=Math.hypot(dx,dz);if(l>1){dx/=l;dz/=l}let speed=time<burstUntil?selected.burstSpeed:selected.speed;if(time<stepUntil)dx=stepDir*selected.stepSpeed/speed;if(time<diveUntil){dz=1;speed=9.5;dx*=.3}const oldX=player.x,oldZ=player.z;player.x+=dx*speed*dt;player.z=Math.max(-2,player.z+dz*speed*dt);const travel=Math.hypot(player.x-oldX,player.z-oldZ);
 player.runBlend=(player.runBlend||0)+((travel>.001?1:0)-(player.runBlend||0))*Math.min(1,dt*14);
 player.gait=(player.gait||0)+travel*(Math.PI*2/2.25);
 if(travel>.001&&time>=nextFootstep){gameSound('footstep');nextFootstep=time+(time<burstUntil?.22:.32)}
 if(travel>.001){const target=Math.atan2(player.x-oldX,player.z-oldZ);heading+=Math.atan2(Math.sin(target-heading),Math.cos(target-heading))*Math.min(1,dt*18);}if(Math.abs(player.x)>34||player.z>110){lose('Into touch.');return}if(player.z>=100&&time<diveUntil){score();return}
// Higher levels advance together, slide across, and release nearby tacklers.
const pace=4.4+tries*.32,structured=tries>=3;
if(structured&&lineZ>player.z+2)lineZ-=pace*.48*dt;
for(let d of defenders){
 d.moving=false;
 if(d.stun>time)continue;
 const vx=player.x-d.x,vz=player.z-d.z,dist=Math.hypot(vx,vz);
 let tx=player.x,tz=player.z,moveSpeed=pace;
 if(!structured){d.engaged=dist<30+tries*6||d.engaged;}
 else {
  d.engaged=true;
  const broken=player.z>lineZ+1;
  if(d.fullback){
   // Sweep behind the line until the runner breaks through or reaches tackling distance.
   if(!broken&&dist>15){tx=Math.max(-29,Math.min(29,player.x*.85));tz=Math.max(lineZ+19,player.z+22);moveSpeed=pace*.7;}
   else {tx=player.x+dx*selected.speed*.24;tz=player.z+Math.max(0,dz)*selected.speed*.25;moveSpeed=pace+.25;}
  }else if(!broken&&dist>7+tries*.25){
   tx=Math.max(-32,Math.min(32,d.homeX+player.x*.12));tz=lineZ+d.offsetZ;
  }else{
   tx=player.x+dx*selected.speed*(.12+tries*.015);tz=player.z+Math.max(0,dz)*selected.speed*.18;
  }
 }
 if(d.engaged){
  const ax=tx-d.x,az=tz-d.z,length=Math.hypot(ax,az),travel=Math.min(length,moveSpeed*dt);
  if(length>.05){d.x+=ax/length*travel;d.z+=az/length*travel;d.angle=Math.atan2(ax,az);d.moving=true;d.gait=(d.gait||d.phase||0)+travel*(Math.PI*2/2.25);}
 }
 if(Math.hypot(player.x-d.x,player.z-d.z)<1.05&&time>d.cool&&time>=contactUntil){
  const stepping=time<stepUntil,fending=time<fendUntil;
  const evade=stepping&&rand()<selected.stepSuccess;
  const fend=!evade&&fending&&rand()<selected.fendSuccess;
  if(fending)fendUntil=0;
  if(evade||fend){d.stun=time+(evade?1.5+selected.stepSuccess:2.1);d.cool=d.stun+.7;contactUntil=time+.18;d.x+=vx>0?-1:1;notice(evade?'BEATEN WITH FOOTWORK':'FENDED OFF');sound(300);}
  else if(rand()<tackleBreakChance(selected,tries,time<burstUntil)){
   d.stun=time+1.65;d.cool=time+2.5;contactUntil=time+.25;notice('TACKLE BROKEN');gameSound('tackleBreak');
  }else{beginTackle(d);return;}
 }
}
$('metres').textContent=Math.max(0,Math.ceil(100-player.z));$('progress').style.width=Math.min(100,player.z)+'%';for(let [id,cd,active] of [['fend',fendCD,fendUntil],['step',stepCD,stepUntil]])$(id).textContent=time<active?'ACTIVE':time<cd?`${(cd-time).toFixed(1)}s`:'Ready';updateBurstHUD();if(time>noticeUntil)$('message').textContent=player.z>95?'Q · DIVE / GROUND THE BALL':''}
function drawBuffer(buffer,data,count,usage){
 gl.bindBuffer(gl.ARRAY_BUFFER,buffer);if(data)gl.bufferData(gl.ARRAY_BUFFER,data,usage);
 attrs.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,36,i*12)});gl.drawArrays(gl.TRIANGLES,0,count);
}
let fallbackCrowdBuffer=null,fallbackCrowdCount=0;
if(!instancing){
 const mesh=new MeshBuilder();for(let j=0;j<crowdInstances.length;j+=42){
  const [x,y,z,angle,r,g,b]=crowdInstances.slice(j,j+7),cs=Math.cos(angle),sn=Math.sin(angle);
  for(let i=0;i<crowdData.length;i+=9){const px=crowdData[i],py=crowdData[i+1],pz=crowdData[i+2],nx=crowdData[i+3],ny=crowdData[i+4],nz=crowdData[i+5];const shirt=crowdData[i+6]<.18&&crowdData[i+8]>.30;
   mesh.push(x+px*cs+pz*sn,y+py,z-px*sn+pz*cs,nx*cs+nz*sn,ny,-nx*sn+nz*cs,shirt?r:crowdData[i+6],shirt?g:crowdData[i+7],shirt?b:crowdData[i+8]);
  }
 }fallbackCrowdBuffer=gl.createBuffer();fallbackCrowdCount=mesh.length/9;gl.bindBuffer(gl.ARRAY_BUFFER,fallbackCrowdBuffer);gl.bufferData(gl.ARRAY_BUFFER,mesh.array(),gl.STATIC_DRAW);
}
function applyWorldUniforms(map,w,matrix,shadows){
 if(map.vp)gl.uniformMatrix4fv(map.vp,false,matrix);
 gl.uniform3fv(map.eye,cam);gl.uniform3fv(map.sunDirection,w.direction);gl.uniform3fv(map.sunColor,w.sun);gl.uniform3fv(map.fogColor,w.horizon);
 gl.uniform1f(map.ambient,w.ambient);gl.uniform1f(map.power,w.power);gl.uniform1f(map.wet,w.storm);gl.uniform1f(map.night,w.night);gl.uniform1f(map.fogDensity,w.fog);gl.uniform1f(map.clock,weatherClock);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,faceTexture);gl.uniform1i(map.faces,0);
 gl.uniform3fv(map['shadows[0]'],shadows);gl.uniform1i(map.shadowCount,Math.min(14,mode==='menu'?1:1+defenders.length));
}
function drawSky(target,w,aspect){
 gl.useProgram(skyProgram);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);
 const forward=norm(target.map((v,i)=>v-cam[i])),right=norm(cross(forward,[0,1,0])),up=cross(right,forward);
 for(const [name,value] of Object.entries({forward,right,up,zenith:w.zenith,horizon:w.horizon,sunDirection:w.direction,sunColor:w.sun}))gl.uniform3fv(skyUniforms[name],value);
 for(const [name,value] of Object.entries({aspect,clock:weatherClock,cloudCover:w.cloud,storm:w.storm,night:w.night,detail:graphicsHigh()?1:0}))gl.uniform1f(skyUniforms[name],value);
 gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);gl.enableVertexAttribArray(skyAttr);gl.vertexAttribPointer(skyAttr,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLES,0,6);
 gl.depthMask(true);gl.enable(gl.DEPTH_TEST);
}
function drawCrowd(w,matrix,shadows){
 if(!instancing){drawBuffer(fallbackCrowdBuffer,null,fallbackCrowdCount);return;}
 gl.useProgram(crowdProgram);applyWorldUniforms(crowdUniforms,w,matrix,shadows);
 gl.bindBuffer(gl.ARRAY_BUFFER,crowdBuffer);crowdAttrs.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,36,i*12);});
 gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);const step=graphicsHigh()?1:2;
 instanceAttrs.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,i===0?4:3,gl.FLOAT,false,28*step,i===0?0:16);instancing.vertexAttribDivisorANGLE(a,1);});
 instancing.drawArraysInstancedANGLE(gl.TRIANGLES,0,crowdData.length/9,Math.floor(crowdInstances.length/7/step));
 instanceAttrs.forEach(a=>{instancing.vertexAttribDivisorANGLE(a,0);gl.disableVertexAttribArray(a);});
 gl.useProgram(program);
}
function labelQuad(points,uvs,normal){for(const i of [0,1,2,0,2,3])vertex(points[i],normal,[-1,...uvs[i]]);}
function fieldLettering(){if(!faceAtlasReady)return;
 for(let z=10;z<=90;z+=10)for(const x of [-30,30]){
  const digit=Math.min(z,100-z)/10-1,u=digit/8;
  labelQuad([[x+1.5,.052,z-1.2],[x-1.5,.052,z-1.2],[x-1.5,.052,z-3.2],[x+1.5,.052,z-3.2]],[[u,.5],[u+.125,.5],[u+.125,.75],[u,.75]],[0,1,0]);
 }
 for(const sign of [-1,1]){const z=50+sign*69.56;
  labelQuad([[6*sign,11.7,z],[-6*sign,11.7,z],[-6*sign,8.3,z],[6*sign,8.3,z]],[[.625,.50],[.875,.50],[.875,.75],[.625,.75]],[0,0,-sign]);
 }
}
$('weather-select').addEventListener('change',e=>{weatherChoice=e.target.value;});
$('detail-select').addEventListener('change',e=>{detailChoice=e.target.value;});
function frame(ms){
 const elapsed=previous?Math.max(.001,(ms-previous)/1000):.016,dt=Math.min(.04,elapsed);previous=ms;
 frameCost=frameCost*.98+Math.min(80,elapsed*1000)*.02;
 if(mode!=='paused'&&!portraitBlocked())weatherClock+=dt;
 tick(dt);updateTouchHUD();updateAbilityBars();const high=graphicsHigh(),ratio=Math.min(window.devicePixelRatio||1,high?1.6:coarseGraphics()?1:1.15),w=Math.floor(innerWidth*ratio),h=Math.floor(innerHeight*ratio);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
 const menu=mode==='menu',grounded=!!tackle&&mode!=='play';
 const target=menu?[0,1.25,29]:[player.x*.98,grounded?.7:1.25,player.z+(grounded?1.3:6.5)];
 const wanted=menu?[-10,5.3,14]:[player.x,grounded?3.7:coarseGraphics()?4.3:3.55,player.z-(coarseGraphics()?7.5:6.6)];
 cam=cam.map((v,i)=>v+(wanted[i]-v)*Math.min(1,dt*6));
 const f=1/Math.tan(Math.PI/6),near=.1,far=350,proj=[f/(w/h),0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0],matrix=new Float32Array(mult(proj,view(cam,target)));
 const weather=sampleWeather(weatherClock,weatherChoice);
 $('weather-label').textContent=weather.label;
 gl.clearColor(...weather.horizon,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);drawSky(target,weather,w/h);
 const shadowPositions=new Float32Array(42);(menu?[{x:0,z:24}]:[player,...defenders]).slice(0,14).forEach((p,i)=>{shadowPositions[i*3]=p.x;shadowPositions[i*3+2]=p.z;});
 gl.useProgram(program);gl.uniformMatrix4fv(vp,false,matrix);applyWorldUniforms(uniforms,weather,matrix,shadowPositions);
 drawBuffer(staticBuffer,null,staticData.length/9);drawCrowd(weather,matrix,shadowPositions);
 verts.length=0;surface=0;fieldLettering();
 if(menu){footballer({x:0,z:24},true,0,0);for(let i=0;i<5;i++)footballer({x:-15+i*8,z:38+i*4},false,i,0);}
 else {footballer(player,true,player.gait||0,player.fall!==undefined?0:(player.runBlend||0));for(const d of defenders)footballer(d,false,d.gait||d.phase||0,d.moving&&mode==='play'&&d.stun<time?1:0);}
 drawBuffer(dynamicBuffer,verts.array(),verts.length/9,gl.DYNAMIC_DRAW);
 if(weather.storm>.01){
  gl.useProgram(rainProgram);gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.uniform1f(rainUniforms.clock,weatherClock);gl.uniform1f(rainUniforms.storm,weather.storm);gl.uniform1f(rainUniforms.aspect,w/h);
  gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);gl.enableVertexAttribArray(rainAttrs);gl.vertexAttribPointer(rainAttrs,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLES,0,6);gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);
 }
 requestAnimationFrame(frame);
}
selectAttacker(0);requestAnimationFrame(frame);
