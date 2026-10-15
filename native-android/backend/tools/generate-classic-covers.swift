// Original fallback covers for the two O. Henry stories only.
// Historical artwork is sourced separately in content/classic-sources.json.
// macOS, from native-android: swift backend/tools/generate-classic-covers.swift
import AppKit
func col(_ h:UInt32)->NSColor { NSColor(srgbRed:CGFloat(h>>16&255)/255,green:CGFloat(h>>8&255)/255,blue:CGFloat(h&255)/255,alpha:1) }
func oval(_ x:CGFloat,_ y:CGFloat,_ w:CGFloat,_ h:CGFloat,_ c:NSColor){c.setFill();NSBezierPath(ovalIn:NSRect(x:x,y:y,width:w,height:h)).fill()}
func box(_ x:CGFloat,_ y:CGFloat,_ w:CGFloat,_ h:CGFloat,_ c:NSColor,_ r:CGFloat=0){c.setFill();NSBezierPath(roundedRect:NSRect(x:x,y:y,width:w,height:h),xRadius:r,yRadius:r).fill()}
func poly(_ pts:[(CGFloat,CGFloat)],_ c:NSColor){let p=NSBezierPath();p.move(to:NSPoint(x:pts[0].0,y:pts[0].1));for(x,y) in pts.dropFirst(){p.line(to:NSPoint(x:x,y:y))};p.close();c.setFill();p.fill()}
func line(_ x:CGFloat,_ y:CGFloat,_ a:CGFloat,_ b:CGFloat,_ c:NSColor,_ w:CGFloat=8){let p=NSBezierPath();p.move(to:NSPoint(x:x,y:y));p.line(to:NSPoint(x:a,y:b));p.lineWidth=w;p.lineCapStyle = .round;c.setStroke();p.stroke()}
let cream=col(0xF5E5BE),gold=col(0xDBAA50),ink=col(0x162B35),red=col(0xCE4E3F)
let scenes:[(String,UInt32,UInt32)]=[("gift_magi",0x6F343A,0xDBAB73),("after_twenty_years",0x233B4B,0x779290)]
for (i,scene) in scenes.enumerated(){
 let(slug,b,a)=scene,bg=col(b),accent=col(a)
 let rep=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:600,pixelsHigh:900,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
 let ctx=NSGraphicsContext(bitmapImageRep:rep)!;NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=ctx;ctx.shouldAntialias=true
 box(0,0,600,900,bg);box(22,22,556,856,cream.withAlphaComponent(0.07),12)
 for n in 0..<380{oval(CGFloat((n*173+47)%600),CGFloat((n*257+19)%900),2,2,cream.withAlphaComponent(0.08))}
 oval(85,290,430,430,accent.withAlphaComponent(0.22));line(58,280,542,280,accent.withAlphaComponent(0.6),2)
 switch i {
 case 0: // Watch case, chain and combs.
  oval(131,420,198,198,gold);oval(149,438,162,162,bg);oval(207,611,45,43,gold);oval(218,622,23,22,bg)
  for n in 0..<11{oval(CGFloat(318+n*9),CGFloat(589-n*8),20,29,gold);oval(CGFloat(322+n*9),CGFloat(595-n*8),11,15,bg)}
  for y in [366,695]{box(333,CGFloat(y),142,20,cream,9);for x in stride(from:343,through:462,by:17){box(CGFloat(x),CGFloat(y)-36,7,43,cream,3)}}
 default: // Street lamp and waiting silhouette, without spoiling the identity.
  box(334,320,140,323,ink);poly([(334,643),(404,691),(474,643)],ink);box(355,333,98,276,accent.withAlphaComponent(0.22));line(197,335,197,669,gold,10);poly([(160,675),(234,675),(222,737),(172,737)],gold);box(155,738,85,10,gold);poly([(176,666),(215,666),(330,324),(61,324)],gold.withAlphaComponent(0.12));oval(356,481,46,49,ink);poly([(351,477),(327,344),(425,344),(399,479)],ink);oval(443,373,5,5,red)
 }
 NSGraphicsContext.restoreGraphicsState()
 let out=URL(fileURLWithPath:"backend/content/covers/cover_classic_\(slug).png");try rep.representation(using:.png,properties:[:])!.write(to:out);print(out.lastPathComponent)
}
