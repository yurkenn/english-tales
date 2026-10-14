// Original geometric cover illustrations. No external artwork or fonts.
// macOS, from native-android: swift backend/tools/generate-classic-covers.swift
import AppKit
func col(_ h:UInt32)->NSColor { NSColor(srgbRed:CGFloat(h>>16&255)/255,green:CGFloat(h>>8&255)/255,blue:CGFloat(h&255)/255,alpha:1) }
func oval(_ x:CGFloat,_ y:CGFloat,_ w:CGFloat,_ h:CGFloat,_ c:NSColor){c.setFill();NSBezierPath(ovalIn:NSRect(x:x,y:y,width:w,height:h)).fill()}
func box(_ x:CGFloat,_ y:CGFloat,_ w:CGFloat,_ h:CGFloat,_ c:NSColor,_ r:CGFloat=0){c.setFill();NSBezierPath(roundedRect:NSRect(x:x,y:y,width:w,height:h),xRadius:r,yRadius:r).fill()}
func poly(_ pts:[(CGFloat,CGFloat)],_ c:NSColor){let p=NSBezierPath();p.move(to:NSPoint(x:pts[0].0,y:pts[0].1));for(x,y) in pts.dropFirst(){p.line(to:NSPoint(x:x,y:y))};p.close();c.setFill();p.fill()}
func line(_ x:CGFloat,_ y:CGFloat,_ a:CGFloat,_ b:CGFloat,_ c:NSColor,_ w:CGFloat=8){let p=NSBezierPath();p.move(to:NSPoint(x:x,y:y));p.line(to:NSPoint(x:a,y:b));p.lineWidth=w;p.lineCapStyle = .round;c.setStroke();p.stroke()}
func bird(_ x:CGFloat,_ y:CGFloat,_ s:CGFloat,_ c:NSColor){poly([(x,y),(x-75*s,y+65*s),(x-25*s,y+15*s),(x+5*s,y+30*s),(x+65*s,y+60*s),(x+35*s,y+5*s),(x+70*s,y-12*s),(x+15*s,y-8*s),(x-30*s,y-40*s)],c)}
let cream=col(0xF5E5BE),gold=col(0xDBAA50),ink=col(0x162B35),red=col(0xCE4E3F)
let scenes:[(String,UInt32,UInt32)]=[("tortoise_hare",0x164B48,0x89AE83),("lion_mouse",0x9D4D2E,0xE0B05B),("fox_grapes",0x4C3A62,0xC78C75),("ants_grasshopper",0xB65A32,0xE6BE79),("red_riding_hood",0x193F42,0x56867C),("cinderella",0x253D63,0x7B99B2),("bremen_musicians",0x294964,0xDFB977),("hansel_gretel",0x593D4B,0xD2987D),("happy_prince",0x203E5B,0x8AA8BC),("selfish_giant",0x334C4C,0x9FAD86),("gift_magi",0x6F343A,0xDBAB73),("after_twenty_years",0x233B4B,0x779290)]
for (i,scene) in scenes.enumerated(){
 let(slug,b,a)=scene,bg=col(b),accent=col(a)
 let rep=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:600,pixelsHigh:900,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
 let ctx=NSGraphicsContext(bitmapImageRep:rep)!;NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=ctx;ctx.shouldAntialias=true
 box(0,0,600,900,bg);box(22,22,556,856,cream.withAlphaComponent(0.07),12)
 for n in 0..<380{oval(CGFloat((n*173+47)%600),CGFloat((n*257+19)%900),2,2,cream.withAlphaComponent(0.08))}
 oval(85,290,430,430,accent.withAlphaComponent(0.22));line(58,280,542,280,accent.withAlphaComponent(0.6),2)
 switch i {
 case 0: // Hare and tortoise, separate levels of the race.
  for x in stride(from:100,through:480,by:55){box(CGFloat(x),356,28,5,cream)}
  oval(170,385,180,110,gold);oval(320,415,55,45,cream)
  for x in [190,290]{oval(CGFloat(x),370,38,28,cream)}
  for x in [215,260,305]{line(CGFloat(x),405,CGFloat(x)-10,475,bg,4)}
  oval(260,568,150,75,cream);oval(382,612,56,57,cream);oval(391,651,16,76,cream);oval(415,648,16,83,cream);oval(421,642,6,6,ink);line(275,581,220,558,cream,14)
 case 1: // Lion's mane and tiny mouse.
  oval(145,440,310,300,gold);oval(212,485,175,180,cream)
  for t in stride(from:0.0,to:6.28,by:0.39){line(CGFloat(300+cos(t)*142),CGFloat(590+sin(t)*140),CGFloat(300+cos(t)*165),CGFloat(590+sin(t)*165),accent,14)}
  oval(250,585,14,14,ink);oval(335,585,14,14,ink);poly([(284,551),(316,551),(300,530)],ink);line(300,530,300,507,ink,4)
  oval(402,365,62,35,cream);oval(440,392,25,25,cream);line(407,375,370,390,cream,3);oval(457,383,4,4,ink)
 case 2: // Fox looking up at the grapes.
  line(390,710,410,493,accent,9);line(390,692,490,720,accent,6)
  for(x,y) in [(365,640),(400,635),(434,640),(380,606),(419,603),(399,573)]{oval(CGFloat(x),CGFloat(y),38,44,cream)}
  poly([(165,420),(120,568),(186,523),(250,557),(282,432),(225,378)],gold);poly([(122,561),(167,535),(150,505)],red);poly([(248,550),(237,514),(272,504)],red);poly([(170,443),(240,443),(213,390)],cream);oval(168,480,9,9,ink);oval(238,480,9,9,ink);oval(209,408,12,12,ink)
 case 3: // Grain, ants and grasshopper.
  for x in stride(from:160,through:430,by:55){line(CGFloat(x),360,CGFloat(x)-12,565,cream,4);for y in stride(from:440,through:540,by:26){oval(CGFloat(x)-24,CGFloat(y),22,12,gold);oval(CGFloat(x)-3,CGFloat(y)+10,22,12,gold)}}
  for x in [195,280,365]{for j in 0..<3{oval(CGFloat(x+j*10),335,14,14,ink)};line(CGFloat(x),340,CGFloat(x)-12,328,ink,3)}
  oval(275,631,115,35,ink);line(300,631,263,589,ink,6);line(350,631,382,593,ink,6);line(289,648,230,705,ink,5)
 case 4: // Red hood among trees.
  for x in [110,225,420,500]{box(CGFloat(x),300,18,420,ink);poly([(CGFloat(x)-55,500),(CGFloat(x)+10,760),(CGFloat(x)+77,500)],accent)}
  poly([(238,372),(265,572),(302,618),(341,568),(380,372)],red);oval(272,537,58,63,cream);poly([(254,547),(300,630),(350,547)],red);box(342,375,64,50,gold,8);line(350,421,391,421,gold,9);line(310,380,310,302,ink,16)
 case 5: // Grimm's golden slipper and hazel branch.
  poly([(145,470),(205,497),(270,439),(398,420),(449,447),(453,395),(363,375),(260,384),(186,425)],gold);poly([(190,426),(215,425),(206,375),(189,375)],gold)
  line(210,570,395,735,accent,8);for(x,y) in [(246,600),(279,640),(325,674)]{oval(CGFloat(x)-24,CGFloat(y),49,22,gold)};bird(385,603,0.55,cream)
 case 6: // Four stacked musicians.
  box(200,368,180,75,cream,25);box(211,319,16,65,cream);box(349,319,16,65,cream);oval(163,422,70,82,cream);box(175,485,14,64,cream,7);box(201,487,14,55,cream,7)
  box(236,453,119,64,gold,20);oval(335,488,53,48,gold);poly([(344,529),(346,550),(367,525)],gold)
  oval(260,535,80,60,cream);oval(304,583,50,47,cream);poly([(305,612),(309,639),(327,620)],cream);poly([(331,620),(352,641),(350,610)],cream)
  oval(282,638,57,44,red);oval(324,672,30,32,red);poly([(348,691),(373,681),(350,675)],gold);line(290,643,265,697,red,7)
 case 7: // Bread and cake house, sugar windows.
  box(155,362,285,210,cream,12);poly([(126,560),(298,704),(468,560)],red);box(275,365,74,120,bg,30);box(190,469,55,60,gold,10);box(361,469,51,60,gold,10)
  for x in stride(from:150,through:440,by:45){oval(CGFloat(x),552,30,30,gold)};for(x,y) in [(180,607),(234,650),(365,620)]{oval(CGFloat(x),CGFloat(y),28,28,cream)};for(x,y) in [(290,332),(267,311),(251,290)]{oval(CGFloat(x),CGFloat(y),13,9,gold)}
 case 8: // Golden statue and swallow.
  box(276,355,51,219,gold);box(235,332,132,35,accent);oval(270,585,66,70,gold);poly([(273,644),(278,682),(298,658),(317,684),(337,647)],gold);poly([(298,584),(244,494),(359,494)],gold);line(320,539,381,570,gold,16);oval(284,616,8,8,accent);oval(310,616,8,8,accent);bird(415,482,0.65,cream)
 case 9: // A blossoming garden opens again.
  box(153,332,38,200,accent);box(393,332,38,200,accent);for(x,y) in [(170,570),(411,570),(239,652),(347,652)]{oval(CGFloat(x)-66,CGFloat(y)-50,135,135,accent)}
  line(172,390,270,626,gold,9);line(410,395,328,632,gold,9);oval(286,452,54,60,cream);poly([(263,356),(282,458),(327,458),(355,356)],cream)
  for(x,y) in [(164,601),(228,650),(378,620),(423,540),(333,665)]{oval(CGFloat(x),CGFloat(y),25,25,cream);oval(CGFloat(x)+8,CGFloat(y)+8,9,9,gold)};bird(291,701,0.4,cream)
 case 10: // Watch case, chain and combs.
  oval(131,420,198,198,gold);oval(149,438,162,162,bg);oval(207,611,45,43,gold);oval(218,622,23,22,bg)
  for n in 0..<11{oval(CGFloat(318+n*9),CGFloat(589-n*8),20,29,gold);oval(CGFloat(322+n*9),CGFloat(595-n*8),11,15,bg)}
  for y in [366,695]{box(333,CGFloat(y),142,20,cream,9);for x in stride(from:343,through:462,by:17){box(CGFloat(x),CGFloat(y)-36,7,43,cream,3)}}
 default: // Street lamp and waiting silhouette, without spoiling the identity.
  box(334,320,140,323,ink);poly([(334,643),(404,691),(474,643)],ink);box(355,333,98,276,accent.withAlphaComponent(0.22));line(197,335,197,669,gold,10);poly([(160,675),(234,675),(222,737),(172,737)],gold);box(155,738,85,10,gold);poly([(176,666),(215,666),(330,324),(61,324)],gold.withAlphaComponent(0.12));oval(356,481,46,49,ink);poly([(351,477),(327,344),(425,344),(399,479)],ink);oval(443,373,5,5,red)
 }
 NSGraphicsContext.restoreGraphicsState()
 let out=URL(fileURLWithPath:"app/src/main/res/drawable-nodpi/cover_classic_\(slug).png");try rep.representation(using:.png,properties:[:])!.write(to:out);print(out.lastPathComponent)
}
