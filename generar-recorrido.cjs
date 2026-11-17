const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
process.chdir(__dirname);
function run(args) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('FFmpeg failed');
}
const words = ['CONECTAR', 'IMPULSAR', 'TRANSFORMAR'];
const filters = words.map((word, i) => {
  const start = 0.6 + i * 0.9;
  const alpha = `if(lt(t,0.4),1,if(lt(t,${start}),0,if(lt(t,${start + 0.3}),(t-${start})/0.3,if(lt(t,${start + 0.85}),1,if(lt(t,${start + 1.2}),1-(t-${start + 0.85})/0.35,if(gt(t,4.2),min(1,(t-4.2)/0.4),0))))))`;
  return `drawtext=fontfile='C\\:/Windows/Fonts/arialbd.ttf':text='${word}':fontsize=20:fontcolor=${i === 1 ? '0x388bff' : 'white'}:x=${[28, 225, 414][i]}:y=27:alpha='${alpha}'`;
});
filters.push("drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='|':fontsize=64:fontcolor=0xd81928:shadowcolor=0x388bff:shadowx=3:shadowy=0:x='if(lt(t,0.4),28,(t-0.4)/4*660-20)':y=1:alpha='if(lt(t,0.4),0,if(gt(t,4.4),0,1))'");
const source = ['-f', 'lavfi', '-i', 'color=c=0x111214:s=640x84:r=15:d=5'];
run([...source, '-vf', filters.join(',') + ',split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a', '-loop', '-1', 'linea-daisy.gif']);
run(['-i', 'linea-daisy.gif', '-frames:v', '1', 'linea-daisy-estatica.png']);
for (const name of ['facebook', 'instagram']) {
  run(['-i', `${name}-lima.png`, '-vf', "lutrgb=r='if(gt(val,80),255,17)':g='if(gt(val,80),255,18)':b='if(gt(val,40),255,20)'", `${name}-blanco.png`]);
}
run(['-i', 'linea-daisy.gif', '-vf', 'fps=1,tile=5x1', '-frames:v', '1', 'linea-daisy-secuencia.png']);
for (const name of ['linea-daisy.gif', 'linea-daisy-estatica.png']) console.log(name, fs.statSync(path.join(__dirname, name)).size, 'bytes');
