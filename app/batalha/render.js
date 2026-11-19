// Atlas - Modo Batalha: renderizador WebGL2. Uma chamada de desenho por andar (malha unica + matriz de texturas),
// terreno com mistura de 4 texturas na placa, luz acumulada num alvo separado e composicao final com a grade.
import {gerarArtes,materialDe,objetoDe} from "./arte.js";
import {malhaAndar,malhaLuzes,VERT,N_OBJ,escreveObjeto,escreveLuz} from "./malha.js";
import {deB64} from "./formato.js";
const VS=`#version 300 es
layout(location=0) in vec2 aP;layout(location=1) in vec2 aU;layout(location=2) in float aL;layout(location=3) in vec4 aC;layout(location=4) in vec3 aA;
uniform vec4 uCam;uniform vec2 uRes;out vec2 vU;out float vL;out vec4 vC;flat out vec3 vA;
void main(){vec2 p=(aP-uCam.xy)*uCam.z*2./uRes;gl_Position=vec4(p.x,-p.y,0.,1.);vU=aU;vL=aL;vC=aC;vA=aA;}`;
const FS=`#version 300 es
precision mediump float;precision mediump sampler2DArray;in vec2 vU;in float vL;in vec4 vC;flat in vec3 vA;uniform sampler2DArray uT;uniform float uEsc;out vec4 o;
vec3 aHsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);return vec3(abs(q.z+(q.w-q.y)/(6.*d+1e-6)),d/(q.x+1e-6),q.x);}
vec3 deHsv(vec3 c){vec3 p=abs(fract(c.xxx+vec3(1.,2./3.,1./3.))*6.-3.);return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y);}
void main(){vec4 c=vec4(vC.rgb*vC.a,vC.a);if(vL>-.5){vec4 t=texture(uT,vec3(vU,vL));
 if(vA.x!=0.||vA.y!=1.||vA.z!=1.){vec3 r=t.a>.001?t.rgb/t.a:vec3(0.);vec3 h=aHsv(r);h.x=fract(h.x+vA.x+1.);h.y=clamp(h.y*vA.y,0.,1.);t.rgb=clamp(deHsv(h)*vA.z,0.,1.)*t.a;}
 c*=t;}o=vec4(c.rgb*uEsc,c.a);}`;
const VT=`#version 300 es
layout(location=0) in vec2 aP;uniform vec4 uCam;uniform vec2 uRes;out vec2 vW;
void main(){vec2 p=(aP-uCam.xy)*uCam.z*2./uRes;gl_Position=vec4(p.x,-p.y,0.,1.);vW=aP;}`;
const FT=`#version 300 es
precision mediump float;precision mediump sampler2DArray;in vec2 vW;uniform sampler2DArray uT;uniform sampler2D uS;uniform vec4 uLay;uniform vec2 uTam;uniform float uEsc;out vec4 o;
void main(){vec4 w=texture(uS,vW/uTam);float s=w.r+w.g+w.b+w.a;if(s<.004){w=vec4(1.,0.,0.,0.);s=1.;}w/=s;vec2 u=vW*.5;
 vec3 c=texture(uT,vec3(u,uLay.x)).rgb*w.r+texture(uT,vec3(u,uLay.y)).rgb*w.g+texture(uT,vec3(u,uLay.z)).rgb*w.b+texture(uT,vec3(u,uLay.w)).rgb*w.a;o=vec4(c*uEsc,1.);}`;
// camada de textura: amostra a textura (escala, giro, deslocamento), ajusta a cor e usa a mascara como opacidade
const FK=`#version 300 es
precision highp float;precision mediump sampler2DArray;in vec2 vW;uniform sampler2DArray uT;uniform sampler2D uM;uniform float uLay;uniform vec4 uXf;uniform vec3 uHsb;uniform vec3 uCor;uniform float uCon;uniform float uOp;uniform vec2 uTam;uniform float uEsc;out vec4 o;
vec3 aHsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);return vec3(abs(q.z+(q.w-q.y)/(6.*d+1e-6)),d/(q.x+1e-6),q.x);}
vec3 deHsv(vec3 c){vec3 p=abs(fract(c.xxx+vec3(1.,2./3.,1./3.))*6.-3.);return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y);}
void main(){float m=texture(uM,vW/uTam).r*uOp;if(m<.002)discard;vec2 p=vW+uXf.zw;vec2 u=vec2(p.x*uXf.y+p.y*uXf.x,-p.x*uXf.x+p.y*uXf.y);vec3 c=texture(uT,vec3(u,uLay)).rgb;
 if(uHsb.x!=0.||uHsb.y!=1.){vec3 h=aHsv(c);h.x=fract(h.x+uHsb.x+1.);h.y=clamp(h.y*uHsb.y,0.,1.);c=deHsv(h);}
 c=clamp((c-.5)*uCon+.5,0.,1.)*uHsb.z*uCor;o=vec4(c*uEsc*m,m);}`;
const VL=`#version 300 es
layout(location=0) in vec2 aP;layout(location=1) in vec2 aQ;layout(location=2) in vec4 aC;layout(location=3) in float aK;uniform vec4 uCam;uniform vec2 uRes;out vec2 vQ;out vec4 vC;flat out float vK;
void main(){vec2 p=(aP-uCam.xy)*uCam.z*2./uRes;gl_Position=vec4(p.x,-p.y,0.,1.);vQ=aQ;vC=aC;vK=aK;}`;
// luz plena ate o nucleo; depois a penumbra, que cai suave ate o alcance
const FL=`#version 300 es
precision mediump float;in vec2 vQ;in vec4 vC;flat in float vK;out vec4 o;
void main(){float d=length(vQ);if(d>=1.)discard;float k=vK,nuc=1.-smoothstep(k-.06,k+.04,d),t=clamp((d-k)/max(1.-k,.001),0.,1.),pen=.62*(1.-t)*(1.-t)*(1.-t*.35),a=max(nuc,pen);o=vec4(vC.rgb*a*vC.a,1.);}`;
const VC=`#version 300 es
layout(location=0) in vec2 aP;out vec2 vU;void main(){gl_Position=vec4(aP,0.,1.);vU=aP*.5+.5;}`;
const FC=`#version 300 es
precision highp float;in vec2 vU;uniform sampler2D uA;uniform sampler2D uB;uniform vec4 uCam;uniform vec2 uRes;uniform vec2 uTam;uniform vec4 uGrade;uniform float uLuz;out vec4 o;
void main(){vec3 c=texture(uA,vU).rgb;if(uLuz>.5)c*=min(texture(uB,vU).rgb,vec3(1.7));
 vec2 w=uCam.xy+vec2(gl_FragCoord.x-uRes.x*.5,uRes.y*.5-gl_FragCoord.y)/uCam.z;
 if(uGrade.a>0.&&w.x>=0.&&w.y>=0.&&w.x<=uTam.x&&w.y<=uTam.y){vec2 f=abs(fract(w-.5)-.5)*uCam.z;float l=1.-clamp(min(f.x,f.y)-.25,0.,1.);c=mix(c,uGrade.rgb,l*uGrade.a*clamp(uCam.z/14.,0.,1.));}
 o=vec4(c,1.);}`;
export function criaRender(canvas){const gl=canvas.getContext("webgl2",{antialias:false,alpha:false,powerPreference:"high-performance"});if(!gl)return null;
  const prog=(vs,fs)=>{const p=gl.createProgram();for(const [t,s] of[[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));gl.attachShader(p,sh)}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));const U={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const u=gl.getActiveUniform(p,i);U[u.name]=gl.getUniformLocation(p,u.name)}return {p,U}};
  const PM=prog(VS,FS),PT=prog(VT,FT),PL=prog(VL,FL),PC=prog(VC,FC),PK=prog(VT,FK);
  // matriz de texturas com as artes proprias
  const t0=performance.now(),ART=gerarArtes((w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c}),TA=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D_ARRAY,TA);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
  gl.texStorage3D(gl.TEXTURE_2D_ARRAY,9,gl.RGBA8,ART.T,ART.T,ART.quadros.length);ART.quadros.forEach((cv,i)=>gl.texSubImage3D(gl.TEXTURE_2D_ARRAY,0,0,0,i,ART.T,ART.T,1,gl.RGBA,gl.UNSIGNED_BYTE,cv));gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);const tArte=performance.now()-t0;
  const quadVAO=gl.createVertexArray();gl.bindVertexArray(quadVAO);const qb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,qb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  let alvoA=null,alvoB=null,W=0,H=0;const alvo=()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA8,W,H);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);return {t,f}};
  const tam=()=>{if(canvas.width===W&&canvas.height===H&&alvoA)return;W=canvas.width;H=canvas.height;for(const a of[alvoA,alvoB])if(a){gl.deleteTexture(a.t);gl.deleteFramebuffer(a.f)}alvoA=alvo();alvoB=alvo()};
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
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D_ARRAY,TA);gl.uniform1i(U.uT,0);gl.uniform1i(U.uM,1);gl.bindVertexArray(carregar.vaoM);gl.enable(gl.BLEND);
    for(const c of A.camadas){if(c.vis===false||c.op<=0)continue;gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,mascaraDe(c));const e=.5/(c.esc||1),g=c.gt||0;
      gl.uniform1f(U.uLay,camArte(c.t));gl.uniform4f(U.uXf,Math.sin(g)*e,Math.cos(g)*e,c.ox||0,c.oy||0);gl.uniform3f(U.uHsb,(c.mz||0)/360,c.sat==null?1:c.sat,c.bri==null?1:c.bri);gl.uniform1f(U.uCon,c.con==null?1:c.con);const k=c.cor||[1,1,1];gl.uniform3f(U.uCor,k[0],k[1],k[2]);gl.uniform1f(U.uOp,c.op==null?1:c.op);
      (BLEND[c.modo]||BLEND.normal)();gl.drawArrays(gl.TRIANGLES,0,6)}return true}
  const solta=a=>{if(!a)return;gl.deleteVertexArray(a.vao);gl.deleteBuffer(a.buf);if(a.vaoZ){gl.deleteVertexArray(a.vaoZ);gl.deleteBuffer(a.bufZ)}if(a.vaoT){gl.deleteVertexArray(a.vaoT);gl.deleteBuffer(a.bufT)}if(a.vaoL){gl.deleteVertexArray(a.vaoL);gl.deleteBuffer(a.bufL)}if(a.splat)gl.deleteTexture(a.splat)};
  const camArte=t=>{const k="m:"+(t<0?"neutro":materialDe(M.texturas[t]));return ART.indice[k]==null?ART.indice["m:neutro"]:ART.indice[k]};
  // monta (ou refaz) um andar: malha, luzes e terreno
  function refazAndar(i){const A=M.andares[i];solta(AND[i]);const m=malhaAndar(A,M.texturas,ART.indice,ART.recorte),o={n:m.n,nl:m.nl,terr:null,amb:A.ambiente,cpu:m.verts,onde:m.onde,luzes:m.luzes,cacheL:m.cache,nz:m.nz,nt:m.nt};
    o.vao=gl.createVertexArray();gl.bindVertexArray(o.vao);o.buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o.buf);gl.bufferData(gl.ARRAY_BUFFER,m.verts,gl.DYNAMIC_DRAW);const S=VERT*4;
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,S,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,2,gl.FLOAT,false,S,8);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,1,gl.FLOAT,false,S,16);gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,4,gl.FLOAT,false,S,20);gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,3,gl.FLOAT,false,S,36);
    if(m.nt){o.vaoT=gl.createVertexArray();gl.bindVertexArray(o.vaoT);o.bufT=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o.bufT);gl.bufferData(gl.ARRAY_BUFFER,m.telhados,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,S,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,2,gl.FLOAT,false,S,8);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,1,gl.FLOAT,false,S,16);gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,4,gl.FLOAT,false,S,20);gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,3,gl.FLOAT,false,S,36)}
    if(m.nz){o.vaoZ=gl.createVertexArray();gl.bindVertexArray(o.vaoZ);o.bufZ=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o.bufZ);gl.bufferData(gl.ARRAY_BUFFER,m.zonas,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,S,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,2,gl.FLOAT,false,S,8);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,1,gl.FLOAT,false,S,16);gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,4,gl.FLOAT,false,S,20);gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,3,gl.FLOAT,false,S,36)}
    {o.vaoL=gl.createVertexArray();gl.bindVertexArray(o.vaoL);o.bufL=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o.bufL);gl.bufferData(gl.ARRAY_BUFFER,m.luzes,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,36,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,2,gl.FLOAT,false,36,8);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,4,gl.FLOAT,false,36,16);gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,1,gl.FLOAT,false,36,32)}
    if(A.terreno){const T=A.terreno,px=deB64(T.splat);o.splat=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,o.splat);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,T.w,T.h,0,gl.RGBA,gl.UNSIGNED_BYTE,px.subarray(0,T.w*T.h*4));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);o.terr=T.tex.map(camArte)}
    AND[i]=o;return m.n}
  function carregar(mapa){AND.forEach(solta);AND=[];M=mapa;const t=performance.now();let verts=0;for(let i=0;i<mapa.andares.length;i++)verts+=refazAndar(i);
    // quadro do tamanho do mapa (terreno e fundo)
    if(carregar.vaoM){gl.deleteVertexArray(carregar.vaoM)}const vm=gl.createVertexArray();gl.bindVertexArray(vm);const bm=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bm);const w=mapa.larg,h=mapa.alt;gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,w,0,w,h,0,0,w,h,0,h]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);carregar.vaoM=vm;
    return {ms:performance.now()-t,verts}}
  // reescreve so os objetos e luzes dados, no lugar (arrastar 1 ou 3.000 sem refazer a malha). Devolve false se algum nao esta na malha.
  function atualiza(i,objs,luzes){const a=AND[i];if(!a)return false;const TEXS=M.texturas;
    if(objs&&objs.length){let mn=1e12,mx=-1;for(const o of objs){const off=a.onde.get(o);if(off==null)return false;const k="o:"+objetoDe(TEXS[o.t]),l=ART.indice[k]==null?ART.indice["m:neutro"]:ART.indice[k];escreveObjeto(a.cpu,off,o,l,ART.recorte[l]);if(off<mn)mn=off;if(off+N_OBJ>mx)mx=off+N_OBJ}
      gl.bindBuffer(gl.ARRAY_BUFFER,a.buf);gl.bufferSubData(gl.ARRAY_BUFFER,mn*4,a.cpu,mn,mx-mn)}
    if(luzes&&luzes.length){const z=malhaLuzes(M.andares[i],a.cacheL,M.texturas);a.cacheL=z.cache;a.luzes=z.verts;a.nl=z.n;gl.bindBuffer(gl.ARRAY_BUFFER,a.bufL);gl.bufferData(gl.ARRAY_BUFFER,z.verts,gl.DYNAMIC_DRAW)}
    return true}
  function andar(i,cam,esc){const a=AND[i];if(!a)return;const cu=[cam.x,cam.y,cam.z,0];
    if(camadas(i,cam,esc)){}else if(a.terr){gl.useProgram(PT.p);gl.uniform4fv(PT.U.uCam,cu);gl.uniform2f(PT.U.uRes,W,H);gl.uniform2f(PT.U.uTam,M.larg,M.alt);gl.uniform4fv(PT.U.uLay,a.terr);gl.uniform1f(PT.U.uEsc,esc);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D_ARRAY,TA);gl.uniform1i(PT.U.uT,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,a.splat);gl.uniform1i(PT.U.uS,1);gl.disable(gl.BLEND);gl.bindVertexArray(carregar.vaoM);gl.drawArrays(gl.TRIANGLES,0,6)}
    gl.useProgram(PM.p);gl.uniform4fv(PM.U.uCam,cu);gl.uniform2f(PM.U.uRes,W,H);gl.uniform1f(PM.U.uEsc,esc);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D_ARRAY,TA);gl.uniform1i(PM.U.uT,0);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.bindVertexArray(a.vao);gl.drawArrays(gl.TRIANGLES,0,a.n)}
  function desenhar(cam,i,opt){if(!M)return;tam();opt=opt||{};gl.viewport(0,0,W,H);gl.bindFramebuffer(gl.FRAMEBUFFER,alvoA.f);gl.clearColor(.105,.095,.08,1);gl.clear(gl.COLOR_BUFFER_BIT);
    // andar de cima sem terreno: mostra o de baixo esmaecido
    {const sx=Math.floor((0-cam.x)*cam.z+W/2),sy=Math.floor((0-cam.y)*cam.z+H/2),sw=Math.ceil(M.larg*cam.z)+1,sh=Math.ceil(M.alt*cam.z)+1;gl.enable(gl.SCISSOR_TEST);gl.scissor(sx,H-(sy+sh),sw,sh)}
    const temChao=k=>AND[k]&&(AND[k].terr||(M.andares[k].camadas&&M.andares[k].camadas.length));let base=i;while(base>0&&!temChao(base))base--;for(let k=base;k<i;k++)andar(k,cam,.45);andar(i,cam,1);const at=AND[i];if(opt.telhados!==false&&at&&at.nt){gl.useProgram(PM.p);gl.bindVertexArray(at.vaoT);gl.drawArrays(gl.TRIANGLES,0,at.nt)}
    gl.disable(gl.SCISSOR_TEST);const a=AND[i];gl.bindFramebuffer(gl.FRAMEBUFFER,alvoB.f);const am=M.andares[i].ambiente||[1,1,1,1];gl.clearColor(am[0],am[1],am[2],1);gl.clear(gl.COLOR_BUFFER_BIT);
    if(opt.luz&&a.nz){gl.disable(gl.BLEND);gl.useProgram(PM.p);gl.uniform4f(PM.U.uCam,cam.x,cam.y,cam.z,0);gl.uniform2f(PM.U.uRes,W,H);gl.uniform1f(PM.U.uEsc,1);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D_ARRAY,TA);gl.uniform1i(PM.U.uT,0);gl.bindVertexArray(a.vaoZ);gl.drawArrays(gl.TRIANGLES,0,a.nz)}
    if(opt.luz&&a.nl){gl.useProgram(PL.p);gl.uniform4f(PL.U.uCam,cam.x,cam.y,cam.z,0);gl.uniform2f(PL.U.uRes,W,H);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.bindVertexArray(a.vaoL);gl.drawArrays(gl.TRIANGLES,0,a.nl)}
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.BLEND);gl.useProgram(PC.p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,alvoA.t);gl.uniform1i(PC.U.uA,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,alvoB.t);gl.uniform1i(PC.U.uB,1);
    gl.uniform4f(PC.U.uCam,cam.x,cam.y,cam.z,0);gl.uniform2f(PC.U.uRes,W,H);gl.uniform2f(PC.U.uTam,M.larg,M.alt);const g=M.grade&&M.grade.cor||[0,0,0,.5];gl.uniform4f(PC.U.uGrade,g[0],g[1],g[2],opt.grade?g[3]:0);gl.uniform1f(PC.U.uLuz,opt.luz?1:0);gl.bindVertexArray(quadVAO);gl.drawArrays(gl.TRIANGLES,0,6)}
  return {gl,carregar,refazAndar,atualiza,subeMascara,limpaMascaras,desenhar,tArte,artes:ART.quadros.length,arte:ART,terminar:()=>gl.finish()}}
