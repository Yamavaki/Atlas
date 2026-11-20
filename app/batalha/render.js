// Atlas - Modo Batalha: renderizador WebGL2. Uma chamada de desenho por andar (malha unica + matriz de texturas),
// terreno com mistura de 4 texturas na placa, luz acumulada num alvo separado e composicao final com a grade.
import {gerarArtes,materialDe,objetoDe} from "./arte.js";
import {malhaAndar,malhaLuzes,VERT,N_OBJ,escreveObjeto,escreveLuz,tingeDD,LUZ_IND} from "./malha.js";
import {deB64} from "./formato.js";
const VS=`#version 300 es
layout(location=0) in vec2 aP;layout(location=1) in vec2 aU;layout(location=2) in float aL;layout(location=3) in vec4 aC;layout(location=4) in vec3 aA;
uniform vec4 uCam;uniform vec2 uRes;out vec2 vU;out float vL;out vec4 vC;flat out vec3 vA;
void main(){vec2 p=(aP-uCam.xy)*uCam.z*2./uRes;gl_Position=vec4(p.x,-p.y,0.,1.);vU=aU;vL=aL;vC=aC;vA=aA;}`;
const FS=`#version 300 es
precision mediump float;precision mediump sampler2DArray;in vec2 vU;in float vL;in vec4 vC;flat in vec3 vA;uniform sampler2DArray uT;uniform float uEsc;uniform float uModo;out vec4 o;
uniform sampler2DArray uR;uniform sampler2DArray uMt;uniform sampler2DArray uFx;vec4 samp(vec2 u,float l,float b){if(l>767.5)return texture(uFx,vec3(u,l-768.),b);if(l>511.5)return texture(uMt,vec3(u,l-512.),b);if(l>255.5)return texture(uR,vec3(u,l-256.),b);return texture(uT,vec3(u,l),b);}
vec3 aHsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);return vec3(abs(q.z+(q.w-q.y)/(6.*d+1e-6)),d/(q.x+1e-6),q.x);}
vec3 deHsv(vec3 c){vec3 p=abs(fract(c.xxx+vec3(1.,2./3.,1./3.))*6.-3.);return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y);}
void main(){bool sb=vA.x<-1.5;if(sb!=(uModo>.5))discard;if(sb){float a=vL>-.5?samp(vU,vL,1.).a:1.;a=clamp(a*(1.+vA.y*6.),0.,1.)*vC.a;o=vec4(0.,0.,0.,a);return;}vec4 c=vec4(vC.rgb*vC.a,vC.a);if(vL>-.5){vec4 t=samp(vU,vL,0.);if(vL>511.5&&vL<767.5){if(fract(vL)>.1)t.a=1.;else t.rgb*=t.a;}
 if(vA.x!=0.||vA.y!=1.||vA.z!=1.){vec3 r=t.a>.001?t.rgb/t.a:vec3(0.);vec3 h=aHsv(r);h.x=fract(h.x+vA.x+1.);h.y=clamp(h.y*vA.y,0.,1.);t.rgb=clamp(deHsv(h)*vA.z,0.,1.)*t.a;}
 c*=t;}o=vec4(c.rgb*uEsc,c.a);}`;
const VT=`#version 300 es
layout(location=0) in vec2 aP;uniform vec4 uCam;uniform vec2 uRes;out vec2 vW;
void main(){vec2 p=(aP-uCam.xy)*uCam.z*2./uRes;gl_Position=vec4(p.x,-p.y,0.,1.);vW=aP;}`;
const FT=`#version 300 es
precision mediump float;precision mediump sampler2DArray;in vec2 vW;uniform sampler2DArray uT;uniform sampler2D uS;uniform vec4 uLay;uniform vec4 uKT;uniform vec2 uTam;uniform float uEsc;out vec4 o;
uniform sampler2DArray uR;uniform sampler2DArray uMt;uniform sampler2DArray uFx;vec4 samp(vec2 u,float l,float b){if(l>767.5)return texture(uFx,vec3(u,l-768.),b);if(l>511.5)return texture(uMt,vec3(u,l-512.),b);if(l>255.5)return texture(uR,vec3(u,l-256.),b);return texture(uT,vec3(u,l),b);}
void main(){vec4 w=texture(uS,vW/uTam);float s=w.r+w.g+w.b+w.a;if(s<.004){w=vec4(1.,0.,0.,0.);s=1.;}w/=s;
 vec3 c=samp(vW*uKT.x,uLay.x,0.).rgb*w.r+samp(vW*uKT.y,uLay.y,0.).rgb*w.g+samp(vW*uKT.z,uLay.z,0.).rgb*w.b+samp(vW*uKT.w,uLay.w,0.).rgb*w.a;o=vec4(c*uEsc,1.);}`;
// camada de textura: amostra a textura (escala, giro, deslocamento), ajusta a cor e usa a mascara como opacidade
const FK=`#version 300 es
precision highp float;precision mediump sampler2DArray;in vec2 vW;uniform sampler2DArray uT;uniform sampler2D uM;uniform float uLay;uniform sampler2DArray uR;uniform sampler2DArray uMt;uniform sampler2DArray uFx;vec4 samp(vec2 u,float l,float b){if(l>767.5)return texture(uFx,vec3(u,l-768.),b);if(l>511.5)return texture(uMt,vec3(u,l-512.),b);if(l>255.5)return texture(uR,vec3(u,l-256.),b);return texture(uT,vec3(u,l),b);}uniform vec4 uXf;uniform vec3 uHsb;uniform vec3 uCor;uniform float uCon;uniform float uOp;uniform vec2 uTam;uniform float uEsc;out vec4 o;
vec3 aHsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);return vec3(abs(q.z+(q.w-q.y)/(6.*d+1e-6)),d/(q.x+1e-6),q.x);}
vec3 deHsv(vec3 c){vec3 p=abs(fract(c.xxx+vec3(1.,2./3.,1./3.))*6.-3.);return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y);}
void main(){float m=texture(uM,vW/uTam).r*uOp;if(m<.002)discard;vec2 p=vW+uXf.zw;vec2 u=vec2(p.x*uXf.y+p.y*uXf.x,-p.x*uXf.x+p.y*uXf.y);vec3 c=samp(u,uLay,0.).rgb;
 if(uHsb.x!=0.||uHsb.y!=1.){vec3 h=aHsv(c);h.x=fract(h.x+uHsb.x+1.);h.y=clamp(h.y*uHsb.y,0.,1.);c=deHsv(h);}
 c=clamp((c-.5)*uCon+.5,0.,1.)*uHsb.z*uCor;o=vec4(c*uEsc*m,m);}`;
const VL=`#version 300 es
layout(location=0) in vec2 aP;layout(location=1) in vec2 aQ;layout(location=2) in vec4 aC;layout(location=3) in float aK;layout(location=4) in vec2 aT;uniform vec4 uCam;uniform vec2 uRes;out vec2 vQ;out vec4 vC;flat out float vK;flat out vec2 vT;
void main(){vec2 p=(aP-uCam.xy)*uCam.z*2./uRes;gl_Position=vec4(p.x,-p.y,0.,1.);vQ=aQ;vC=aC;vK=aK;vT=aT;}`;
// luz plena ate o nucleo; depois a penumbra, que cai suave ate o alcance
const FL=`#version 300 es
precision mediump float;precision mediump sampler2DArray;in vec2 vQ;in vec4 vC;flat in float vK;flat in vec2 vT;uniform sampler2DArray uL;uniform float uTempo;out vec4 o;
void main(){if(vT.x>-.5){if(abs(vQ.x)>=1.||abs(vQ.y)>=1.)discard;float c=cos(vT.y),s=sin(vT.y);vec2 r=vec2(c*vQ.x+s*vQ.y,-s*vQ.x+c*vQ.y),uv=r*.5+.5;float L=floor(vT.x+.5);vec3 t=texture(uL,vec3(uv,L)).rgb;
  if(fract(vT.x)>.1){float T=uTempo;vec3 t2=texture(uL,vec3(uv+.035*vec2(sin(T*.9+uv.y*11.),cos(T*.7+uv.x*9.)),L)).rgb,t3=texture(uL,vec3(uv+.03*vec2(cos(T*.6-uv.y*8.),sin(T*.8+uv.x*13.)),L)).rgb;t=(t2+t3)*.62;}
  o=vec4(vC.rgb*t*vC.a*.5,1.);return;}
 float d=length(vQ);if(d>=1.)discard;float a;if(vK<0.){a=1.-smoothstep(0.,1.,d);}else{float k=vK,nuc=1.-smoothstep(k-.06,k+.04,d),t=clamp((d-k)/max(1.-k,.001),0.,1.),pen=.62*(1.-t)*(1.-t)*(1.-t*.35);a=max(nuc,pen);}o=vec4(vC.rgb*a*vC.a*.5,1.);}`;
const VC=`#version 300 es
layout(location=0) in vec2 aP;out vec2 vU;void main(){gl_Position=vec4(aP,0.,1.);vU=aP*.5+.5;}`;
const FC=`#version 300 es
precision highp float;in vec2 vU;uniform sampler2D uA;uniform sampler2D uB;uniform vec4 uCam;uniform vec2 uRes;uniform vec2 uTam;uniform vec4 uGrade;uniform float uLuz;out vec4 o;
void main(){vec3 c=texture(uA,vU).rgb;if(uLuz>.5)c=min(c*texture(uB,vU).rgb*2.,vec3(1.));
 vec2 w=uCam.xy+vec2(gl_FragCoord.x-uRes.x*.5,uRes.y*.5-gl_FragCoord.y)/uCam.z;
 if(uGrade.a>0.&&w.x>=0.&&w.y>=0.&&w.x<=uTam.x&&w.y<=uTam.y){vec2 f=abs(fract(w-.5)-.5)*uCam.z;float l=1.-clamp(min(f.x,f.y)-.25,0.,1.);c=mix(c,uGrade.rgb,l*uGrade.a*clamp(uCam.z/14.,0.,1.));}
 o=vec4(c,1.);}`;
// desfoque gaussiano numa direcao (13 amostras), so o alfa
const FB=`#version 300 es
precision highp float;in vec2 vU;uniform sampler2D uS;uniform vec2 uD;out vec4 o;
void main(){float s=0.,w=0.;for(int i=-6;i<=6;i++){float f=float(i),k=exp(-f*f/18.);s+=texture(uS,vU+uD*f).a*k;w+=k;}o=vec4(0.,0.,0.,s/w);}`;
const FSo=`#version 300 es
precision highp float;in vec2 vU;uniform sampler2D uS;out vec4 o;void main(){o=vec4(0.,0.,0.,texture(uS,vU).a);}`;
// formas de luz do Atlas, desenhadas uma vez: [chave, nome, tela, animada]
function formasLuz(){const S=256,mk=fn=>{const c=document.createElement("canvas");c.width=S;c.height=S;const g=c.getContext("2d"),im=g.createImageData(S,S),d=im.data;for(let y=0;y<S;y++)for(let x=0;x<S;x++){const u=(x+.5)/S*2-1,v=(y+.5)/S*2-1,k=Math.max(0,Math.min(1,fn(u,v,Math.hypot(u,v),Math.atan2(v,u))))*255,i=(y*S+x)*4;d[i]=d[i+1]=d[i+2]=k;d[i+3]=255}g.putImageData(im,0,0);return c};
  const cai=r=>{const t=Math.max(0,Math.min(1,1-r));return t*t*(3-2*t)},ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
  // ruido de valor (semente fixa) para folhas e fragmentos
  const P=new Uint8Array(512);{let s=1234567;const p=[...Array(256).keys()];for(let i=255;i>0;i--){s=(s*16807)%2147483647;const j=s%(i+1);[p[i],p[j]]=[p[j],p[i]]}for(let i=0;i<512;i++)P[i]=p[i&255]}
  const h2=(x,y)=>P[(P[x&255]+y)&255]/255,rv=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,a=h2(xi,yi),b=h2(xi+1,yi),c=h2(xi,yi+1),d=h2(xi+1,yi+1),ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy},fbm=(x,y)=>rv(x,y)*.55+rv(x*2.1,y*2.1)*.28+rv(x*4.3,y*4.3)*.17;
  const cone=ab=>(u,v,r,a)=>{const lado=1-ss(ab*.82,ab,Math.abs(a));return cai(r)*lado*ss(0,.06,r+.02)};
  return [["atlas:luz/cone","Cone",mk(cone(.62))],["atlas:luz/farol","Farol",mk(cone(.3))],
    ["atlas:luz/folhas","Entre folhas",mk((u,v,r)=>{const n=fbm(u*5+3,v*5+7),m=ss(.42,.58,n);return cai(r*.95)*(.18+.82*m)})],
    // cauticas: a rede clara entre celulas (Voronoi F2-F1), um pouco torta
    ["atlas:luz/caustica","Água (cáusticas)",mk((u,v,r)=>{const x=u*4.5+.37*Math.sin(v*5.1),y=v*4.5+.37*Math.sin(u*4.3),xi=Math.floor(x),yi=Math.floor(y);let f1=9,f2=9;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const cx=xi+i,cy=yi+j,px=cx+h2(cx+50,cy+50),py=cy+h2(cx+91,cy+17),d=Math.hypot(px-x,py-y);if(d<f1){f2=f1;f1=d}else if(d<f2)f2=d}
      const c=1-ss(0,.22,f2-f1);return cai(r)*(.3+.85*c)}),1],
    ["atlas:luz/janela","Janela",mk((u,v,r)=>{const x=(u+.15)*1.1,y=v*1.1,dentro=Math.abs(x)<.62&&Math.abs(y)<.62,mold=Math.abs(x)<.03||Math.abs(y)<.03;return dentro&&!mold?cai(r*.9)*(1-ss(.5,.62,Math.max(Math.abs(x),Math.abs(y)))*.6):cai(r)*.08})],
    ["atlas:luz/persiana","Persiana",mk((u,v,r)=>{const lin=.5+.5*Math.cos(v*30);return cai(r)*(.12+.88*ss(.35,.65,lin))})],
    ["atlas:luz/fragmentos","Fragmentos",mk((u,v,r,a)=>{const n=fbm(Math.cos(a)*2+5,Math.sin(a)*2+5);return cai(r/(.7+.5*n))})],
    ["atlas:luz/anel","Anel",mk((u,v,r)=>Math.max(0,1-Math.abs(r-.62)/.22)*.95+cai(r)*.15)]]}
export function criaRender(canvas){const gl=canvas.getContext("webgl2",{antialias:false,alpha:false,powerPreference:"high-performance"});if(!gl)return null;
  const prog=(vs,fs)=>{const p=gl.createProgram();for(const [t,s] of[[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));gl.attachShader(p,sh)}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));const U={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const u=gl.getActiveUniform(p,i);U[u.name]=gl.getUniformLocation(p,u.name)}return {p,U}};
  const PM=prog(VS,FS),PT=prog(VT,FT),PL=prog(VL,FL),PC=prog(VC,FC),PK=prog(VT,FK),PB=prog(VC,FB),PSo=prog(VC,FSo);
  const ANI=gl.getExtension("EXT_texture_filter_anisotropic"),MAXT=gl.getParameter(gl.MAX_TEXTURE_SIZE)||4096;const aniso=()=>{if(ANI)gl.texParameterf(gl.TEXTURE_2D_ARRAY,ANI.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(ANI.MAX_TEXTURE_MAX_ANISOTROPY_EXT)))};
  // matriz de texturas com as artes proprias
  const t0=performance.now(),ART=gerarArtes((w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c}),G=ART.quadros.length;let TA=null,TR=null,TMt=null,TFx=null,LADO=ART.T,NREAIS=0,CAMADAS_R=0;if(G>255)throw new Error("artes demais");
  // matriz de texturas: as artes do Atlas e, depois delas, as artes do PC usadas no mapa (Artes do PC)
  const ehMat=c=>/\/textures\/(terrain|patterns|textures|materials?|tilesets)\//.test(c);
  const ehFaixa=c=>/\/textures\/(walls|paths)\//.test(c);
  const novaMatriz=(S,n)=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D_ARRAY,t);gl.texStorage3D(gl.TEXTURE_2D_ARRAY,Math.log2(S)+1,gl.RGBA8,S,S,Math.max(1,n));gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MAG_FILTER,gl.LINEAR);return t};
  // artes do Atlas: uma vez so
  TA=novaMatriz(ART.T,G);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);ART.quadros.forEach((cv,i)=>gl.texSubImage3D(gl.TEXTURE_2D_ARRAY,0,0,0,i,ART.T,ART.T,1,gl.RGBA,gl.UNSIGNED_BYTE,cv));gl.generateMipmap(gl.TEXTURE_2D_ARRAY);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  // artes do PC: objetos e portas no tamanho original, empacotados em folhas de 2048 px; chaos e faixas (paredes, caminhos) com uma camada propria de 1024 px que repete
  function montaMatriz(reais){const L=[...(reais||new Map())].filter(x=>x[1]);for(const k in ART.indice)if(/^(r|a|h|w|rc):/.test(k))delete ART.indice[k];
    if(TR){gl.deleteTexture(TR);TR=null}if(TMt){gl.deleteTexture(TMt);TMt=null}if(TFx){gl.deleteTexture(TFx);TFx=null}
    const ehLuzP=p=>/\/textures\/lights\//.test(p);montaLuzes(L.filter(([p])=>ehLuzP(p)).map(([p,v])=>[p,v.bm||v]));
    const objs=L.filter(([p])=>!ehMat(p)&&!ehFaixa(p)&&!ehLuzP(p)),mats=L.filter(([p])=>ehMat(p)),fxs=L.filter(([p])=>ehFaixa(p));for(const [p,v] of L){const w=v.w||v.width,h=v.h||v.height;ART.indice["a:"+p]=w/Math.max(1,h);ART.indice["h:"+p]=h;ART.indice["w:"+p]=w}
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    const S=2048,P=12,lim=S-2*P,folhas=[];let x=P,y=P,hl=0,f=null;const nova=()=>{f=[];folhas.push(f);x=P;y=P;hl=0};
    const ord=objs.map(([p,bm])=>{const k=Math.min(1,lim/Math.max(bm.width,bm.height));return {p,bm,w:Math.max(1,Math.round(bm.width*k)),h:Math.max(1,Math.round(bm.height*k))}}).sort((a,b)=>b.h-a.h);
    for(const it of ord){if(!f)nova();if(x+it.w+P>S){x=P;y+=hl+2*P;hl=0}if(y+it.h+P>S){nova()}it.x=x;it.y=y;it.f=folhas.length-1;f.push(it);x+=it.w+2*P;hl=Math.max(hl,it.h)}
    if(folhas.length){TR=novaMatriz(S,folhas.length);const cv=document.createElement("canvas");cv.width=S;cv.height=S;const g=cv.getContext("2d");g.imageSmoothingQuality="high";
      folhas.forEach((F,k)=>{g.clearRect(0,0,S,S);for(const it of F){g.drawImage(it.bm,it.x,it.y,it.w,it.h);ART.indice["r:"+it.p]=256+k;ART.indice["rc:"+it.p]=[it.x/S,it.y/S,(it.x+it.w)/S,(it.y+it.h)/S]}gl.texSubImage3D(gl.TEXTURE_2D_ARRAY,0,0,0,k,S,S,1,gl.RGBA,gl.UNSIGNED_BYTE,cv)});gl.generateMipmap(gl.TEXTURE_2D_ARRAY)}
    if(mats.length){const S2=1024;TMt=novaMatriz(S2,mats.length);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_WRAP_T,gl.REPEAT);const cv=document.createElement("canvas");cv.width=S2;cv.height=S2;const g=cv.getContext("2d");g.imageSmoothingQuality="high";
      // cruas (alfa do terreno e altura): sobem sem pre-multiplicar; o sombreador usa so a cor no chao e multiplica o alfa nos padroes
      aniso();mats.forEach(([p,v],j)=>{if(v.cru&&v.bm.width===S2&&v.bm.height===S2){gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texSubImage3D(gl.TEXTURE_2D_ARRAY,0,0,0,j,S2,S2,1,gl.RGBA,gl.UNSIGNED_BYTE,v.bm);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true)}
        else{const bm=v.bm||v;g.clearRect(0,0,S2,S2);g.drawImage(bm,0,0,S2,S2);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texSubImage3D(gl.TEXTURE_2D_ARRAY,0,0,0,j,S2,S2,1,gl.RGBA,gl.UNSIGNED_BYTE,cv);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true)}ART.indice["r:"+p]=512+j+(/\/textures\/terrain\//.test(p)?.25:0);ART.indice["rc:"+p]=[0,0,1,1]});gl.generateMipmap(gl.TEXTURE_2D_ARRAY)}
    // paredes e caminhos: camadas largas e baixas (a imagem inteira ocupa a largura, sem perder detalhe no comprimento), repetindo
    if(fxs.length){let FW=512;const mw=Math.max(...fxs.map(([,bm])=>bm.width));while(FW<mw&&FW<Math.min(4096,MAXT))FW*=2;if(fxs.length>24)FW=Math.min(FW,2048);const FH=256;
      TFx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D_ARRAY,TFx);gl.texStorage3D(gl.TEXTURE_2D_ARRAY,Math.log2(FW)+1,gl.RGBA8,FW,FH,fxs.length);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);aniso();
      const cv=document.createElement("canvas");cv.width=FW;cv.height=FH;const g=cv.getContext("2d");g.imageSmoothingQuality="high";
      fxs.forEach(([p,bm],j)=>{g.clearRect(0,0,FW,FH);g.drawImage(bm,0,0,FW,FH);gl.texSubImage3D(gl.TEXTURE_2D_ARRAY,0,0,0,j,FW,FH,1,gl.RGBA,gl.UNSIGNED_BYTE,cv);ART.indice["r:"+p]=768+j;ART.indice["rc:"+p]=[0,0,1,1]});gl.generateMipmap(gl.TEXTURE_2D_ARRAY)}
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);NREAIS=L.length;CAMADAS_R=folhas.length+mats.length+fxs.length;LADO=S}
  const VAZIA=novaMatriz(1,1);
  // formas de luz (256 px, cinza: branco = luz). As do Atlas sao desenhadas aqui; as dos pacotes entram depois delas
  const FORMAS=formasLuz();let TL=null;
  function montaLuzes(pac){if(TL)gl.deleteTexture(TL);for(const k in LUZ_IND)delete LUZ_IND[k];const L=FORMAS.map(f=>[f[0],f[2]]).concat(pac||[]),S=256;TL=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D_ARRAY,TL);gl.texStorage3D(gl.TEXTURE_2D_ARRAY,9,gl.RGBA8,S,S,L.length);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const cv=document.createElement("canvas");cv.width=S;cv.height=S;const g=cv.getContext("2d");gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    L.forEach(([k,im],j)=>{g.clearRect(0,0,S,S);g.drawImage(im,0,0,S,S);gl.texSubImage3D(gl.TEXTURE_2D_ARRAY,0,0,0,j,S,S,1,gl.RGBA,gl.UNSIGNED_BYTE,cv);LUZ_IND[k]=j});gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.generateMipmap(gl.TEXTURE_2D_ARRAY)}
  montaLuzes([]);
  const ligaT=U=>{gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D_ARRAY,TA);gl.uniform1i(U.uT,0);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D_ARRAY,TR||VAZIA);gl.uniform1i(U.uR,2);gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D_ARRAY,TMt||VAZIA);gl.uniform1i(U.uMt,3);gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D_ARRAY,TFx||VAZIA);gl.uniform1i(U.uFx,4);gl.activeTexture(gl.TEXTURE0)};
  // escala de um chao do PC: 256 px por quadrado (Dungeondraft); as artes do Atlas repetem a cada 2 quadrados
  const kuvT=t=>{const w=t>=0&&ART.indice["w:"+M.texturas[t]];return w&&ART.indice["r:"+M.texturas[t]]!=null?256/w:.5};
  montaMatriz(null);const tArte=performance.now()-t0;
  const quadVAO=gl.createVertexArray();gl.bindVertexArray(quadVAO);const qb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,qb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  let alvoA=null,alvoB=null,alvoS=null,alvoS2=null,W=0,H=0,W2=0,H2=0,TES=null;const alvo=(w,h)=>{w=w||W;h=h||H;const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA8,w,h);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);return {t,f}};
  const tam=()=>{if(canvas.width===W&&canvas.height===H&&alvoA)return;W=canvas.width;H=canvas.height;W2=Math.max(1,Math.ceil(W/2));H2=Math.max(1,Math.ceil(H/2));for(const a of[alvoA,alvoB,alvoS,alvoS2])if(a){gl.deleteTexture(a.t);gl.deleteFramebuffer(a.f)}alvoA=alvo();alvoB=alvo();alvoS=alvo(W2,H2);alvoS2=alvo(W2,H2)};
  let M=null,AND=[];
  // mascaras das camadas: uma textura R8 por camada, criada na hora do desenho e trocada se o buffer mudar
  const MAS=new Map(),branca=(()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,1,1,0,gl.RED,gl.UNSIGNED_BYTE,new Uint8Array([255]));return t})();
  const filtro=()=>{gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)};
  const mascaraDe=c=>{if(!c.m)return branca;let e=MAS.get(c);if(e&&e.buf===c.m&&e.w===c.mw&&e.h===c.mh)return e.t;if(e)gl.deleteTexture(e.t);const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,c.mw,c.mh,0,gl.RED,gl.UNSIGNED_BYTE,c.m);filtro();MAS.set(c,{t,buf:c.m,w:c.mw,h:c.mh});return t};
  function subeMascara(c,ret){const e=MAS.get(c);if(!e||e.buf!==c.m){mascaraDe(c);return}const [x,y,w,h]=ret;if(w<=0||h<=0)return;gl.bindTexture(gl.TEXTURE_2D,e.t);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.pixelStorei(gl.UNPACK_ROW_LENGTH,c.mw);gl.pixelStorei(gl.UNPACK_SKIP_PIXELS,x);gl.pixelStorei(gl.UNPACK_SKIP_ROWS,y);
    gl.texSubImage2D(gl.TEXTURE_2D,0,x,y,w,h,gl.RED,gl.UNSIGNED_BYTE,c.m);gl.pixelStorei(gl.UNPACK_ROW_LENGTH,0);gl.pixelStorei(gl.UNPACK_SKIP_PIXELS,0);gl.pixelStorei(gl.UNPACK_SKIP_ROWS,0)}
  const limpaMascaras=()=>{const vivas=new Set();for(const A of M.andares)for(const c of A.camadas||[])vivas.add(c);for(const [c,e] of MAS)if(!vivas.has(c)){gl.deleteTexture(e.t);MAS.delete(c)}};
  const BLEND={normal:()=>gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA),multiplicar:()=>gl.blendFunc(gl.DST_COLOR,gl.ONE_MINUS_SRC_ALPHA),clarear:()=>gl.blendFunc(gl.ONE_MINUS_DST_COLOR,gl.ONE),somar:()=>gl.blendFunc(gl.ONE,gl.ONE)};
  function camadas(i,cam,esc){const A=M.andares[i];if(!A||!A.camadas||!A.camadas.length)return false;gl.useProgram(PK.p);const U=PK.U;gl.uniform4f(U.uCam,cam.x,cam.y,cam.z,0);gl.uniform2f(U.uRes,W,H);gl.uniform2f(U.uTam,M.larg,M.alt);gl.uniform1f(U.uEsc,esc);
    ligaT(U);gl.uniform1i(U.uM,1);gl.bindVertexArray(carregar.vaoM);gl.enable(gl.BLEND);
    for(const c of A.camadas){if(c.vis===false||c.op<=0)continue;gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,mascaraDe(c));const e=kuvT(c.t)/(c.esc||1),g=c.gt||0;
      gl.uniform1f(U.uLay,camArte(c.t));gl.uniform4f(U.uXf,Math.sin(g)*e,Math.cos(g)*e,c.ox||0,c.oy||0);gl.uniform3f(U.uHsb,(c.mz||0)/360,c.sat==null?1:c.sat,c.bri==null?1:c.bri);gl.uniform1f(U.uCon,c.con==null?1:c.con);const k=c.cor||[1,1,1];gl.uniform3f(U.uCor,k[0],k[1],k[2]);gl.uniform1f(U.uOp,c.op==null?1:c.op);
      (BLEND[c.modo]||BLEND.normal)();gl.drawArrays(gl.TRIANGLES,0,6)}return true}
  const solta=a=>{if(!a)return;gl.deleteVertexArray(a.vao);gl.deleteBuffer(a.buf);if(a.vaoZ){gl.deleteVertexArray(a.vaoZ);gl.deleteBuffer(a.bufZ)}if(a.vaoT){gl.deleteVertexArray(a.vaoT);gl.deleteBuffer(a.bufT)}if(a.vaoL){gl.deleteVertexArray(a.vaoL);gl.deleteBuffer(a.bufL)}if(a.splat)gl.deleteTexture(a.splat)};
  const camArte=t=>{const r=t>=0&&ART.indice["r:"+M.texturas[t]];if(r!=null&&r!==false)return r;const k="m:"+(t<0?"neutro":materialDe(M.texturas[t]));return ART.indice[k]==null?ART.indice["m:neutro"]:ART.indice[k]};
  // monta (ou refaz) um andar: malha, luzes e terreno
  function refazAndar(i){const A=M.andares[i];solta(AND[i]);ART.indice["sombra:mapa"]=M.sombra||null;const m=malhaAndar(A,M.texturas,ART.indice,ART.recorte),o={n:m.n,nl:m.nl,terr:null,amb:A.ambiente,cpu:m.verts,onde:m.onde,luzes:m.luzes,cacheL:m.cache,nz:m.nz,nt:m.nt,grupos:m.grupos||[]};
    o.vao=gl.createVertexArray();gl.bindVertexArray(o.vao);o.buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o.buf);gl.bufferData(gl.ARRAY_BUFFER,m.verts,gl.DYNAMIC_DRAW);const S=VERT*4;
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,S,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,2,gl.FLOAT,false,S,8);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,1,gl.FLOAT,false,S,16);gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,4,gl.FLOAT,false,S,20);gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,3,gl.FLOAT,false,S,36);
    if(m.nt){o.vaoT=gl.createVertexArray();gl.bindVertexArray(o.vaoT);o.bufT=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o.bufT);gl.bufferData(gl.ARRAY_BUFFER,m.telhados,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,S,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,2,gl.FLOAT,false,S,8);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,1,gl.FLOAT,false,S,16);gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,4,gl.FLOAT,false,S,20);gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,3,gl.FLOAT,false,S,36)}
    if(m.nz){o.vaoZ=gl.createVertexArray();gl.bindVertexArray(o.vaoZ);o.bufZ=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o.bufZ);gl.bufferData(gl.ARRAY_BUFFER,m.zonas,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,S,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,2,gl.FLOAT,false,S,8);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,1,gl.FLOAT,false,S,16);gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,4,gl.FLOAT,false,S,20);gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,3,gl.FLOAT,false,S,36)}
    {o.vaoL=gl.createVertexArray();gl.bindVertexArray(o.vaoL);o.bufL=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o.bufL);gl.bufferData(gl.ARRAY_BUFFER,m.luzes,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,44,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,2,gl.FLOAT,false,44,8);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,4,gl.FLOAT,false,44,16);gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,1,gl.FLOAT,false,44,32);gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,2,gl.FLOAT,false,44,36)}
    if(A.terreno){const T=A.terreno,px=deB64(T.splat);o.splat=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,o.splat);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,T.w,T.h,0,gl.RGBA,gl.UNSIGNED_BYTE,px.subarray(0,T.w*T.h*4));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);o.terr=T.tex.map(camArte);o.kterr=T.tex.map(kuvT)}
    AND[i]=o;return m.n}
  function carregar(mapa){AND.forEach(solta);AND=[];M=mapa;ART.indice["dd:origem"]=mapa.origem==="dungeondraft"?1:0;const t=performance.now();let verts=0;for(let i=0;i<mapa.andares.length;i++)verts+=refazAndar(i);
    // quadro do tamanho do mapa (terreno e fundo)
    if(carregar.vaoM){gl.deleteVertexArray(carregar.vaoM)}const vm=gl.createVertexArray();gl.bindVertexArray(vm);const bm=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bm);const w=mapa.larg,h=mapa.alt;gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,w,0,w,h,0,0,w,h,0,h]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);carregar.vaoM=vm;
    return {ms:performance.now()-t,verts}}
  // reescreve so os objetos e luzes dados, no lugar (arrastar 1 ou 3.000 sem refazer a malha). Devolve false se algum nao esta na malha.
  function atualiza(i,objs,luzes){const a=AND[i];if(!a)return false;const TEXS=M.texturas;
    if(objs&&objs.length){let mn=1e12,mx=-1;for(const o of objs){const off=a.onde.get(o);if(off==null)return false;if(o.s){const vi=off/VERT;if(!a.grupos.some(g=>vi>=g.v0&&vi<g.v1))return false}const k="o:"+objetoDe(TEXS[o.t]),r=ART.indice["r:"+TEXS[o.t]],l=r!=null?r:ART.indice[k]==null?ART.indice["m:neutro"]:ART.indice[k];escreveObjeto(a.cpu,off,r!=null?tingeDD(o,TEXS[o.t]):o,l,r!=null?ART.indice["rc:"+TEXS[o.t]]:ART.recorte[l]);if(off<mn)mn=off;if(off+N_OBJ>mx)mx=off+N_OBJ}
      gl.bindBuffer(gl.ARRAY_BUFFER,a.buf);gl.bufferSubData(gl.ARRAY_BUFFER,mn*4,a.cpu,mn,mx-mn)}
    if(luzes&&luzes.length){const z=malhaLuzes(M.andares[i],a.cacheL,M.texturas);a.cacheL=z.cache;a.luzes=z.verts;a.nl=z.n;gl.bindBuffer(gl.ARRAY_BUFFER,a.bufL);gl.bufferData(gl.ARRAY_BUFFER,z.verts,gl.DYNAMIC_DRAW)}
    return true}
  function andar(i,cam,esc){const a=AND[i];if(!a)return;const cu=[cam.x,cam.y,cam.z,0];
    if(camadas(i,cam,esc)){}else if(a.terr){gl.useProgram(PT.p);gl.uniform4fv(PT.U.uCam,cu);gl.uniform2f(PT.U.uRes,W,H);gl.uniform2f(PT.U.uTam,M.larg,M.alt);gl.uniform4fv(PT.U.uLay,a.terr);gl.uniform4fv(PT.U.uKT,a.kterr||[.5,.5,.5,.5]);gl.uniform1f(PT.U.uEsc,esc);ligaT(PT.U);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,a.splat);gl.uniform1i(PT.U.uS,1);gl.disable(gl.BLEND);gl.bindVertexArray(carregar.vaoM);gl.drawArrays(gl.TRIANGLES,0,6)}
    const prepM=()=>{gl.useProgram(PM.p);gl.uniform4fv(PM.U.uCam,cu);gl.uniform2f(PM.U.uRes,W,H);gl.uniform1f(PM.U.uEsc,esc);gl.uniform1f(PM.U.uModo,0);ligaT(PM.U);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.bindVertexArray(a.vao)};prepM();
    let cur=0;if(sombras&&esc===1)for(const g of a.grupos){if(g.v0>cur)gl.drawArrays(gl.TRIANGLES,cur,g.v0-cur);cur=g.v0;sombra(a,g,cam,cu);prepM()}
    if(a.n>cur)gl.drawArrays(gl.TRIANGLES,cur,a.n-cur)}
  // sombra de um grupo: silhuetas no alvo de meia resolucao (MAX: sombras que se cruzam nao escurecem mais), desfoque e composicao embaixo do grupo
  function sombra(a,g,cam,cu){gl.bindFramebuffer(gl.FRAMEBUFFER,alvoS.f);gl.viewport(0,0,W2,H2);gl.disable(gl.SCISSOR_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(PM.p);gl.uniform4fv(PM.U.uCam,cu);gl.uniform2f(PM.U.uRes,W,H);gl.uniform1f(PM.U.uEsc,1);gl.uniform1f(PM.U.uModo,1);ligaT(PM.U);gl.enable(gl.BLEND);gl.blendEquation(gl.MAX);gl.blendFunc(gl.ONE,gl.ONE);gl.bindVertexArray(a.vao);gl.drawArrays(gl.TRIANGLES,g.v0,g.v1-g.v0);gl.blendEquation(gl.FUNC_ADD);
    const sig=g.bl*.5*cam.z*.5;gl.disable(gl.BLEND);gl.bindVertexArray(quadVAO);
    if(sig>.6){const st=Math.min(sig/3,12);gl.useProgram(PB.p);gl.activeTexture(gl.TEXTURE0);gl.uniform1i(PB.U.uS,0);
      gl.bindFramebuffer(gl.FRAMEBUFFER,alvoS2.f);gl.bindTexture(gl.TEXTURE_2D,alvoS.t);gl.uniform2f(PB.U.uD,st/W2,0);gl.drawArrays(gl.TRIANGLES,0,6);
      gl.bindFramebuffer(gl.FRAMEBUFFER,alvoS.f);gl.bindTexture(gl.TEXTURE_2D,alvoS2.t);gl.uniform2f(PB.U.uD,0,st/H2);gl.drawArrays(gl.TRIANGLES,0,6)}
    gl.bindFramebuffer(gl.FRAMEBUFFER,alvoA.f);gl.viewport(0,0,W,H);if(TES){gl.enable(gl.SCISSOR_TEST);gl.scissor(TES[0],TES[1],TES[2],TES[3])}
    gl.useProgram(PSo.p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,alvoS.t);gl.uniform1i(PSo.U.uS,0);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.TRIANGLES,0,6)}
  let sombras=true;
  function desenhar(cam,i,opt){if(!M)return;tam();opt=opt||{};sombras=opt.sombras!==false;gl.viewport(0,0,W,H);gl.bindFramebuffer(gl.FRAMEBUFFER,alvoA.f);gl.clearColor(.105,.095,.08,1);gl.clear(gl.COLOR_BUFFER_BIT);
    // andar de cima sem terreno: mostra o de baixo esmaecido
    {const sx=Math.floor((0-cam.x)*cam.z+W/2),sy=Math.floor((0-cam.y)*cam.z+H/2),sw=Math.ceil(M.larg*cam.z)+1,sh=Math.ceil(M.alt*cam.z)+1;gl.enable(gl.SCISSOR_TEST);TES=[sx,H-(sy+sh),sw,sh];gl.scissor(sx,H-(sy+sh),sw,sh)}
    const temChao=k=>AND[k]&&(AND[k].terr||(M.andares[k].camadas&&M.andares[k].camadas.length));let base=i;while(base>0&&!temChao(base))base--;for(let k=base;k<i;k++)andar(k,cam,.45);andar(i,cam,1);const at=AND[i];if(opt.telhados!==false&&at&&at.nt){gl.useProgram(PM.p);gl.uniform1f(PM.U.uModo,0);gl.bindVertexArray(at.vaoT);gl.drawArrays(gl.TRIANGLES,0,at.nt)}
    gl.disable(gl.SCISSOR_TEST);TES=null;const a=AND[i];gl.bindFramebuffer(gl.FRAMEBUFFER,alvoB.f);const am=M.andares[i].ambiente||[1,1,1,1];gl.clearColor(am[0]*.5,am[1]*.5,am[2]*.5,1);gl.clear(gl.COLOR_BUFFER_BIT);
    if(opt.luz&&a.nz){gl.disable(gl.BLEND);gl.useProgram(PM.p);gl.uniform4f(PM.U.uCam,cam.x,cam.y,cam.z,0);gl.uniform2f(PM.U.uRes,W,H);gl.uniform1f(PM.U.uEsc,.5);gl.uniform1f(PM.U.uModo,0);ligaT(PM.U);gl.bindVertexArray(a.vaoZ);gl.drawArrays(gl.TRIANGLES,0,a.nz)}
    if(opt.luz&&a.nl){gl.useProgram(PL.p);gl.uniform4f(PL.U.uCam,cam.x,cam.y,cam.z,0);gl.uniform2f(PL.U.uRes,W,H);gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D_ARRAY,TL);gl.uniform1i(PL.U.uL,5);gl.activeTexture(gl.TEXTURE0);gl.uniform1f(PL.U.uTempo,(opt.tempo!=null?opt.tempo:performance.now()/1000)%1000);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.bindVertexArray(a.vaoL);gl.drawArrays(gl.TRIANGLES,0,a.nl)}
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.BLEND);gl.useProgram(PC.p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,alvoA.t);gl.uniform1i(PC.U.uA,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,alvoB.t);gl.uniform1i(PC.U.uB,1);
    gl.uniform4f(PC.U.uCam,cam.x,cam.y,cam.z,0);gl.uniform2f(PC.U.uRes,W,H);gl.uniform2f(PC.U.uTam,M.larg,M.alt);const g=M.grade&&M.grade.cor||[0,0,0,.5];gl.uniform4f(PC.U.uGrade,g[0],g[1],g[2],opt.grade?g[3]:0);gl.uniform1f(PC.U.uLuz,opt.luz?1:0);gl.bindVertexArray(quadVAO);gl.drawArrays(gl.TRIANGLES,0,6)}
  return {gl,carregar,refazAndar,atualiza,subeMascara,limpaMascaras,desenhar,tArte,artes:G,arte:ART,terminar:()=>gl.finish(),usarReais:m=>{montaMatriz(m);if(M)carregar(M)},formas:()=>FORMAS.map(f=>({k:f[0],nome:f[1],img:f[2],anim:!!f[3]})),reais:()=>NREAIS,camadasPC:()=>CAMADAS_R,lado:()=>LADO}}
