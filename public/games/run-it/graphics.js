// Rendering only: weather never changes collisions, skills or difficulty.
export const weatherPresets=[
 {id:'clear',label:'Clear afternoon',zenith:[.10,.34,.66],horizon:[.72,.85,.91],sun:[1.0,.91,.74],direction:[-.55,.73,.40],ambient:.47,power:.73,cloud:.16,storm:0,night:0,fog:.0018},
 {id:'clouds',label:'Cloudy',zenith:[.27,.44,.62],horizon:[.76,.80,.83],sun:[.88,.94,1.0],direction:[-.55,.60,.40],ambient:.57,power:.38,cloud:.65,storm:0,night:0,fog:.0027},
 {id:'sunset',label:'Sunset',zenith:[.17,.16,.37],horizon:[1.0,.46,.23],sun:[1.0,.50,.22],direction:[-.82,.16,.50],ambient:.35,power:.83,cloud:.36,storm:0,night:.27,fog:.0025},
 {id:'storm',label:'Storm',zenith:[.055,.075,.13],horizon:[.30,.35,.40],sun:[.68,.77,.91],direction:[-.48,.44,.63],ambient:.31,power:.12,cloud:.97,storm:1,night:.72,fog:.005},
 {id:'night',label:'Night under lights',zenith:[.018,.025,.075],horizon:[.12,.16,.27],sun:[.60,.72,1.0],direction:[.46,.76,-.40],ambient:.27,power:.14,cloud:.2,storm:0,night:1,fog:.0028}
];
export function sampleWeather(seconds,choice='auto'){
 const cycle=40, i=choice==='auto'?Math.floor(seconds/cycle)%weatherPresets.length:Math.max(0,weatherPresets.findIndex(w=>w.id===choice));
 const a=weatherPresets[i],b=weatherPresets[(i+1)%weatherPresets.length];
 let blend=choice==='auto'?Math.max(0,Math.min(1,(seconds%cycle-28)/12)):0;blend=blend*blend*(3-2*blend);
 const result={id:a.id,label:blend>.5?b.label:a.label};
 for(const key of ['zenith','horizon','sun','direction'])result[key]=a[key].map((v,j)=>v+(b[key][j]-v)*blend);
 for(const key of ['ambient','power','cloud','storm','night','fog'])result[key]=a[key]+(b[key]-a[key])*blend;
 return result;
}
export const worldVertexShader=`
attribute vec3 p,n,c;
uniform mat4 vp;
uniform float clock;
varying vec3 world,normal,color;
varying float material;
void main(){
 material=length(n)-1.0;normal=normalize(n);color=c;world=p;
 if(material>4.5&&material<5.5){
  float sway=sin(clock*1.65+p.x*.065+p.z*.13);
  world.x+=sway*.035;world.y+=sin(clock*2.1+p.x*.09+p.z*.055)*.025;
 }
 gl_Position=vp*vec4(world,1.0);
}`;
export const worldFragmentShader=`
precision highp float;
varying vec3 world,normal,color;varying float material;
uniform vec3 eye,sunDirection,sunColor,fogColor;
uniform float ambient,power,wet,night,fogDensity,clock;
uniform sampler2D faces;
uniform vec3 shadows[14];
uniform int shadowCount;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){
 vec3 base=color,N=normalize(normal),V=normalize(eye-world);float spec=.045,rough=26.0;
 if(color.r<-.5){vec4 sampleColor=texture2D(faces,color.gb);if(sampleColor.a<.04)discard;base=sampleColor.rgb;spec=.11;rough=36.0;}
 if(material>.5&&material<1.5){
  float distance=length(eye-world),detail=1.0-smoothstep(15.,60.,distance);
  float grain=noise(world.xz*105.),blades=noise(world.xz*vec2(370.,32.));
  float stripe=step(.5,fract((world.z+10.)/10.));
  base=mix(vec3(.105,.29,.067),vec3(.14,.35,.085),stripe);
  base*=.88+.15*noise(world.xz*2.4)+detail*(grain-.5)*.27;
  base+=vec3(.028,.046,.008)*(blades-.5)*detail;
  N=normalize(N+vec3((grain-.5)*.19,0.,(blades-.5)*.14)*detail);
  spec=.035+wet*.25;rough=45.;
 }else if(material>1.5&&material<2.5){
  float weave=(sin(world.x*780.)*sin(world.y*810.)+sin(world.z*700.)*.4)*.013;
  base*=.98+weave;spec=.09+wet*.11;rough=38.;
 }else if(material>2.5&&material<3.5){spec=.14+wet*.1;rough=31.;}
 vec3 L=normalize(sunDirection);float direct=max(0.,dot(N,L));
 float sky=.7+.3*max(N.y,0.);
 vec3 light=vec3(.80,.88,1.0)*ambient*sky+sunColor*direct*power;
 vec3 stadiumLightA=normalize(vec3(-63.,34.,-8.)-world);
 vec3 stadiumLightB=normalize(vec3(63.,34.,-8.)-world);
 vec3 stadiumLightC=normalize(vec3(-63.,34.,108.)-world);
 vec3 stadiumLightD=normalize(vec3(63.,34.,108.)-world);
 float flood=max(0.,dot(N,stadiumLightA))+max(0.,dot(N,stadiumLightB))+max(0.,dot(N,stadiumLightC))+max(0.,dot(N,stadiumLightD));
 float floodPower=.04+night*.38+wet*.12;
 light+=vec3(.80,.90,1.)*flood*floodPower;
 vec3 fieldLight=world.z>50.?stadiumLightC:stadiumLightA;
 light+=vec3(.12,.20,.08)*max(0.,-N.y)*.22;
 float highlight=pow(max(0.,dot(N,normalize(L+V))),rough)*spec*power;
 highlight+=pow(max(0.,dot(N,normalize(fieldLight+V))),rough)*spec*night*.7;
 float shadow=1.;
 if(world.y<.1){
  for(int i=0;i<14;i++){
   if(i>=shadowCount)break;
   vec2 delta=world.xz-shadows[i].xz;
   float contact=exp(-dot(delta,delta)*2.6)*.46;
   vec2 offset=-L.xz*.75;vec2 stretch=delta-offset;
   float castShadow=exp(-dot(stretch,stretch)*1.0)*.23*power;
   shadow*=1.-max(contact,castShadow);
  }
 }
 vec3 lit=base*light*shadow+highlight;
 if(material>3.5&&material<4.5)lit=base*(1.38+night*2.1+wet*.45);
 float fog=1.-exp(-max(0.,length(eye-world)-38.)*fogDensity);
 lit=mix(lit,fogColor,min(.75,fog));
 lit=lit/(lit+vec3(.52))*1.12;lit=pow(max(lit,vec3(0.)),vec3(.94));
 gl_FragColor=vec4(lit,1.);
}`;
export const skyVertexShader=`attribute vec2 pos;varying vec2 uv;void main(){uv=pos;gl_Position=vec4(pos,1.,1.);}`;
export const skyFragmentShader=`
precision highp float;varying vec2 uv;
uniform vec3 forward,right,up,zenith,horizon,sunDirection,sunColor;
uniform float aspect,clock,cloudCover,storm,night,detail;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float f=0.,a=.5;for(int i=0;i<5;i++){if(i>2&&detail<.5)break;f+=a*noise(p);p=p*2.03+17.4;a*=.5;}return f;}
void main(){
 vec3 ray=normalize(forward+right*uv.x*aspect*.57735+up*uv.y*.57735);
 vec3 sky=mix(horizon,zenith,pow(max(ray.y,0.),.45));
 float sun=max(0.,dot(ray,normalize(sunDirection)));
 sky+=sunColor*pow(sun,20.)*.19*(1.-storm);
 sky+=sunColor*smoothstep(.9994,.9998,sun)*(1.-storm)*.8;
 vec2 cloudUV=ray.xz/(max(ray.y,.035)+.14)*2.5+vec2(clock*.008,clock*.003);
 float cloud=fbm(cloudUV);float fine=noise(cloudUV*16.);
 float mask=smoothstep(.80-cloudCover*.51,.94-cloudCover*.48,cloud+fine*.05);
 mask*=smoothstep(-.035,.10,ray.y);
 float relief=fbm(cloudUV+vec2(.13,.06));
 vec3 cloudColor=mix(vec3(.96,.97,1.),horizon,.26+night*.4)*(1.-storm*.54-night*.34);
 cloudColor*=.72+.40*relief;
 sky=mix(sky,cloudColor,mask*.93);
 if(night>.7&&storm<.4){float star=step(.9988,hash(floor(ray.xz/max(ray.y,.08)*550.)));sky+=star*smoothstep(.04,.4,ray.y)*night*.40*(1.-mask);}
 // Rain is confined to storms, uses two depths, and never flashes the screen.
 if(storm>.01){
  vec2 q=uv*vec2(100.*aspect,18.);q.x+=uv.y*3.5;
  float row=floor(q.x),speed=13.+hash(vec2(row,2.))*8.;
  float trail=fract(q.y+clock*speed+hash(vec2(row,9.))*10.);
  float rain=step(.94,fract(q.x))*smoothstep(.80,.99,trail)*step(.52,hash(vec2(row,6.)));
  sky=mix(sky,vec3(.69,.77,.85),rain*storm*.23);
 }
 gl_FragColor=vec4(sky,1.);
}`;
export const crowdVertexShader=worldVertexShader
 .replace('attribute vec3 p,n,c;','attribute vec3 p,n,c;attribute vec4 instancePose;attribute vec3 instanceColor;')
 .replace('material=length(n)-1.0;normal=normalize(n);color=c;world=p;',`material=length(n)-1.0;
 float cs=cos(instancePose.w),sn=sin(instancePose.w);
 mat3 turn=mat3(cs,0.,-sn,0.,1.,0.,sn,0.,cs);
 normal=normalize(turn*n);color=c;
 if(c.r<.18&&c.b>.30)color=instanceColor;else if(c.r>.45&&c.b<.5)color*=.72+instanceColor.r*.44;
 world=turn*p+instancePose.xyz;`);
export const rainFragmentShader=`precision mediump float;varying vec2 uv;uniform float clock,storm,aspect;
 float hash(float p){return fract(sin(p*127.1)*43758.5453);}
 void main(){vec2 q=uv*vec2(110.*aspect,12.);q.x+=uv.y*4.;float row=floor(q.x);float trail=fract(q.y+clock*(15.+hash(row)*12.)+hash(row+30.)*10.);float rain=step(.96,fract(q.x))*smoothstep(.68,.98,trail)*step(.55,hash(row+17.));gl_FragColor=vec4(.74,.82,.90,rain*storm*.16);}`;
