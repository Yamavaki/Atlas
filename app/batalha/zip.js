// Atlas - zip simples, usado no exportar e no catalogo. Sem compressao, a nao ser na entrada com cd (dados ja comprimidos em deflate)
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=u=>{let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
// comprime em deflate cru (o do zip) quando o navegador sabe; senao devolve null e a entrada vai sem compressao
export async function deflate(u8){if(typeof CompressionStream!=="function")return null;try{const s=new Blob([u8]).stream().pipeThrough(new CompressionStream("deflate-raw"));return new Uint8Array(await new Response(s).arrayBuffer())}catch{return null}}
export function zip(arqs){const enc=new TextEncoder(),partes=[],dir=[];let off=0;
  for(const a of arqs){const nome=enc.encode(a.nome),d=a.dados,c=crc32(d),z=a.cd&&a.cd.length<d.length?a.cd:null,cd=z||d,mt=z?8:0,h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,mt,true);h.setUint32(14,c,true);h.setUint32(18,cd.length,true);h.setUint32(22,d.length,true);h.setUint16(26,nome.length,true);
    partes.push(new Uint8Array(h.buffer),nome,cd);const e=new DataView(new ArrayBuffer(46));e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x0800,true);e.setUint16(10,mt,true);e.setUint32(16,c,true);e.setUint32(20,cd.length,true);e.setUint32(24,d.length,true);e.setUint16(28,nome.length,true);e.setUint32(42,off,true);dir.push(new Uint8Array(e.buffer),nome);off+=30+nome.length+cd.length}
  let tam=0;for(const x of dir)tam+=x.length;const f=new DataView(new ArrayBuffer(22));f.setUint32(0,0x06054b50,true);f.setUint16(8,arqs.length,true);f.setUint16(10,arqs.length,true);f.setUint32(12,tam,true);f.setUint32(16,off,true);
  return new Blob([...partes,...dir,new Uint8Array(f.buffer)],{type:"application/zip"})}
