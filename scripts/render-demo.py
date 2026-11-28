"""Render the physical insert and a magnifier that samples the actual map layers.
Requires Pillow and ffmpeg. Run from anywhere; --stills renders review frames only.
"""
from pathlib import Path
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont, ImageChops, ImageFilter
import json, math, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'scripts/demo-assets'; OUT=ROOT/'dist/mukodes'; REVIEW=ROOT.parent/'tmp/lens-demo'
REVIEW.mkdir(parents=True,exist_ok=True)
W,H=1600,1200; FPS=25; DURATION=26
INK='#29255c'; PINK='#bb1c5c'; CREAM='#fffaed'; YELLOW='#ffe45c'; MUTED='#625c70'
@lru_cache(None)
def font(s,b=False):return ImageFont.truetype(str(ROOT/'dist/assets/fonts'/('OpenSans-ExtraBold.ttf' if b else 'OpenSans-Regular.ttf')),s)
def center(b):return ((b[0]+b[2])/2,(b[1]+b[3])/2)
def ease(x):return (1-math.cos(math.pi*max(0,min(1,x))))/2
source=Image.open(A/'terkep.webp').convert('RGBA'); CW,CH=source.size
sx,sy=CW/761,CH/530
circles=json.loads((A/'psd_apertures.json').read_text());old=json.loads((A/'original_apertures.json').read_text())
selected={'Budapest':(69,'87'),'Győr':(44,'206'),'Pécs':(166,'175'),'Szeged':(151,'91'),'Debrecen':(68,'180')}
def nearest(b):
 x,y=(b[0]+b[2]-1)/2*sx,(b[1]+b[3]-1)/2*sy
 return min(circles,key=lambda c:(center(c['box'])[0]-x)**2+(center(c['box'])[1]-y)**2)
chosen={};ids={v[0] for v in selected.values()}
for idx,c in enumerate(old):
 x0,y0,x1,y1=c['box'];w=x1-x0;h=y1-y0
 if idx not in ids and (x0<94 or y0<30 or y1>517 or not .75<w/h<1.35 or c['area']<35 or c['density']>.86):continue
 circ=nearest(c['box']);cx,cy=center(circ['box']);ox,oy=(x0+x1-1)/2*sx,(y0+y1-1)/2*sy
 if (cx-ox)**2+(cy-oy)**2<28**2:chosen[circ['name']]=circ
windows={n:nearest(old[i]['box']) for n,(i,v) in selected.items()}
mask=Image.new('L',source.size);md=ImageDraw.Draw(mask)
for c in chosen.values():md.ellipse(c['box'],fill=255)
slot=[(x*sx,y*sy) for x,y in json.loads((A/'globe_slot.json').read_text())];md.polygon(slot,fill=255)
front=source.copy();front.putalpha(ImageChops.invert(mask))
printed=Image.new('RGBA',source.size);pd=ImageDraw.Draw(printed)
for n,c in windows.items():pd.text(center(c['box']),selected[n][1],font=font(23,True),fill='#262532',anchor='mm')
text=Image.new('RGBA',(250,70));d=ImageDraw.Draw(text);d.text((125,35),'Kecskemét',font=font(30,True),fill='#272532',anchor='mm')
text=text.crop(text.getbbox()).rotate(72,Image.Resampling.BICUBIC,expand=True)
gx,gy=(min(p[0] for p in slot)+max(p[0] for p in slot))/2,(min(p[1] for p in slot)+max(p[1] for p in slot))/2
printed.alpha_composite(text,(round(gx-text.width/2),round(gy-text.height/2)))
printed.putalpha(ImageChops.multiply(printed.getchannel('A'),mask))
DX=126; IX=20; IY=15; PW=CW-2*IX;PH=CH-2*IY
paper=Image.new('RGBA',(PW,PH),'#fffdf7');paper.alpha_composite(printed,(-IX-DX,-IY))
FW=1220; S=FW/CW; FH=round(CH*S); PX,PY=34,151
@lru_cache(4)
def native_map(v):
 im=Image.new('RGBA',(CW+DX+32,CH),CREAM)
 x=round(IX+DX*v);im.alpha_composite(paper,(x,IY))
 d=ImageDraw.Draw(im)
 d.rounded_rectangle((x+PW-4,round(CH*.43),x+PW+31,round(CH*.57)),radius=8,fill=PINK)
 im.alpha_composite(front,(0,0))
 return im
base=Image.new('RGBA',(W,H),CREAM);d=ImageDraw.Draw(base);d.rectangle((0,0,W,6),fill=PINK)
d.text((35,26),'RetroTérkép',font=font(32,True),fill=INK)
d.text((375,26),'VÁLASSZ VÁROST. OLVASD LE A TÁVOLSÁGOT.',font=font(27,True),fill=INK)
d.text((375,76),'A betétlap jobbra csúszik · a nagyító mutatja a részleteket',font=font(23),fill=MUTED)
d.text((35,1152),'Szemléltető minta · Az öt kiemelt távolság közelítő bemutatóadat.',font=font(19),fill=MUTED)
shadow=Image.new('RGBA',(W,H));sd=ImageDraw.Draw(shadow);sd.rounded_rectangle((PX+4,PY+8,PX+FW+11,PY+FH+11),radius=4,fill=(41,37,92,65));base=Image.alpha_composite(base,shadow.filter(ImageFilter.GaussianBlur(9)))
# Focus includes the actual city label and its neighbouring aperture.
points={'Kecskemét':(gx,gy)}
shifts={'Budapest':(-40,-8),'Győr':(17,5),'Pécs':(-26,-8),'Szeged':(-20,-3),'Debrecen':(25,-10)}
for name,c in windows.items():
 x,y=center(c['box']);dx,dy=shifts[name];points[name]=(x+dx/S,y+dy/S)
# Each stop lasts long enough to read; travel is eased, never an abrupt jump.
stops=[('Kecskemét',3.3),('Budapest',6.5),('Győr',9.5),('Pécs',12.5),('Szeged',15.5),('Debrecen',18.5)]
def lens_state(t):
 if t<2.1 or t>22:return None
 if t<3.3:return ('Kecskemét',points['Kecskemét'],ease((t-2.1)/.5))
 previous=stops[0][0]
 for name,start in stops[1:]:
  if t<start:return (previous,points[previous],1)
  if t<start+.85:
   q=ease((t-start)/.85);a=points[previous];b=points[name]
   return (name,(a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q),1)
  previous=name
 return (previous,points[previous],1-ease((t-21.2)/.8))
def magnifier(im,scene,point,opacity):
 cx,cy=PX+point[0]*S,PY+point[1]*S
 r=146;zoom=2.25;radius_native=r/(S*zoom)
 crop=scene.crop((round(point[0]-radius_native),round(point[1]-radius_native),round(point[0]+radius_native),round(point[1]+radius_native))).resize((r*2,r*2),Image.Resampling.LANCZOS)
 circle=Image.new('L',(r*2,r*2));ImageDraw.Draw(circle).ellipse((0,0,r*2-1,r*2-1),fill=255);crop.putalpha(circle)
 layer=Image.new('RGBA',(W,H));ld=ImageDraw.Draw(layer)
 # Upper-facing handle at low stops keeps it away from the caption.
 angle=.80 if cy<610 else -.80;ux,uy=math.cos(angle),math.sin(angle)
 a=(cx+ux*(r-3),cy+uy*(r-3));b=(cx+ux*(r+110),cy+uy*(r+110))
 sh=Image.new('RGBA',(W,H));shd=ImageDraw.Draw(sh)
 shd.line((a[0]+9,a[1]+14,b[0]+9,b[1]+14),fill=(20,18,35,95),width=44)
 shd.ellipse((cx-r+8,cy-r+12,cx+r+8,cy+r+12),fill=(20,18,35,85))
 layer=Image.alpha_composite(layer,sh.filter(ImageFilter.GaussianBlur(11)));ld=ImageDraw.Draw(layer)
 ld.line((*a,*b),fill='#1b1926',width=39);ld.ellipse((b[0]-19,b[1]-19,b[0]+19,b[1]+19),fill='#1b1926')
 ld.line((a[0]-4,a[1]-4,b[0]-4,b[1]-4),fill='#565260',width=8)
 for offset,color in [(9,'#282532'),(6,'#c7c4cd'),(2,'#514d5b')]:
  ld.ellipse((cx-r-offset,cy-r-offset,cx+r+offset,cy+r+offset),fill=color)
 layer.alpha_composite(crop,(round(cx-r),round(cy-r)));ld=ImageDraw.Draw(layer)
 ld.arc((cx-r-5,cy-r-5,cx+r+5,cy+r+5),195,285,fill='#ffffff',width=4)
 ld.arc((cx-r+11,cy-r+11,cx+r-11,cy+r-11),205,253,fill=(255,255,255,130),width=3)
 if opacity<1:layer.putalpha(layer.getchannel('A').point(lambda a:round(a*opacity)))
 return Image.alpha_composite(im,layer)
def frame(t):
 if t<.8:v=0
 elif t<3.3:v=ease((t-.8)/2.5)
 elif t<22.3:v=1
 elif t<25:v=1-ease((t-22.3)/2.7)
 else:v=0
 scene=native_map(round(v,5));im=base.copy()
 im.alpha_composite(scene.resize((round(scene.width*S),FH),Image.Resampling.LANCZOS),(PX,PY))
 d=ImageDraw.Draw(im);d.rectangle((PX-1,PY-1,PX+FW+1,PY+FH+1),outline=INK,width=2)
 lens=lens_state(t);name=lens[0] if lens else None
 d.text((1320,169),'KIINDULÓ VÁROS',font=font(16,True),fill=MUTED)
 d.text((1320,203),'Kecskemét' if v==1 else 'Kiválasztás…',font=font(27,True),fill=PINK)
 d.line((1320,266,1566,266),fill='#d8cfdf',width=2)
 if name and name!='Kecskemét' and v==1:
  d.text((1320,301),'A NAGYÍTÓ ALATT',font=font(15,True),fill=MUTED)
  d.text((1320,343),name,font=font(27,True),fill=INK)
  d.text((1320,393),selected[name][1]+' km',font=font(38,True),fill=PINK)
 else:
  d.text((1320,307),'A földgömb\nnyílásában\nválasztható ki\na kiinduló város.',font=font(20),fill=INK,spacing=7)
 for j,(city,(_,value)) in enumerate(selected.items()):
  yy=544+j*78;active=city==name and v==1
  d.rounded_rectangle((1312,yy-9,1566,yy+54),radius=9,fill=YELLOW if active else '#f0eaf5')
  d.text((1326,yy),city,font=font(20,active),fill=INK)
  if v==1:d.text((1549,yy+29),value+' km',font=font(17,active),fill=PINK if active else MUTED,anchor='rm')
 if lens and lens[2]>0:im=magnifier(im,scene,lens[1],lens[2])
 d=ImageDraw.Draw(im)
 if t<3.3:phase='HÚZD JOBBRA A BETÉTLAPOT · VÁLASZD KI KECSKEMÉTET'
 elif t<6.5:phase='A FÖLDGÖMB NYÍLÁSÁBAN: KECSKEMÉT'
 elif t<22.3:phase='A VÁROS MELLETTI NYÍLÁSBAN OLVASHATÓ A KILOMÉTER'
 else:phase='A BETÉTLAP VISSZACSÚSZIK · ÚJ VÁROS VÁLASZTHATÓ'
 d.rounded_rectangle((34,1040,1566,1110),radius=11,fill=INK)
 d.text((800,1075),phase,font=font(25,True),fill=CREAM,anchor='mm')
 return im.convert('RGB')
for t in [0,2.3,4.4,7.9,10.8,13.8,16.8,19.8,24.5]:frame(t).save(REVIEW/f'frame-{t}.jpg',quality=93)
frame(7.9).save(OUT/'terkep-nagyitos-bemutato.webp',quality=93,method=6)
if '--stills' in sys.argv:sys.exit(0)
command=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'terkep-nagyitos-bemutato.mp4')]
process=subprocess.Popen(command,stdin=subprocess.PIPE)
for i in range(DURATION*FPS):
 process.stdin.write(frame(i/FPS).tobytes())
 if i%125==0:print(f'{i}/{DURATION*FPS}',flush=True)
process.stdin.close()
if process.wait()!=0:raise RuntimeError('ffmpeg failed')
print('Done:',OUT/'terkep-nagyitos-bemutato.mp4',flush=True)
