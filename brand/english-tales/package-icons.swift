import AppKit
let source = NSImage(contentsOfFile: CommandLine.arguments[1])!
let root = CommandLine.arguments[2]
func render(_ path: String, _ size: Int, _ scale: CGFloat, _ background: Bool, _ circle: Bool = false, _ rounded: Bool = false) {
    let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: size*4, bitsPerPixel: 32)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
    let rect = NSRect(x:0,y:0,width:size,height:size)
    if circle { NSBezierPath(ovalIn:rect).addClip() }
    if rounded { NSBezierPath(roundedRect:rect,xRadius:CGFloat(size)*0.22,yRadius:CGFloat(size)*0.22).addClip() }
    if background { NSColor(srgbRed:0.72,green:0.9,blue:0.98,alpha:1).setFill(); rect.fill() }
    NSGraphicsContext.current?.imageInterpolation = .high
    let width = CGFloat(size)*scale
    let height = width*source.size.height/source.size.width
    source.draw(in:NSRect(x:(CGFloat(size)-width)/2,y:(CGFloat(size)-height)/2,width:width,height:height),from:.zero,operation:.sourceOver,fraction:1)
    NSGraphicsContext.restoreGraphicsState()
    try! bitmap.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:path))
}
for (density,size,foreground) in [("mdpi",48,108),("hdpi",72,162),("xhdpi",96,216),("xxhdpi",144,324),("xxxhdpi",192,432)] {
    let dir = root+"/native-android/app/src/main/res/mipmap-"+density
    render(dir+"/ic_launcher.png",size,1.05,true)
    render(dir+"/ic_launcher_round.png",size,1.05,true,true)
    render(dir+"/ic_launcher_foreground.png",foreground,0.72,false)
}
render(root+"/brand/english-tales/app-icon-512.png",512,1.05,true)
render(root+"/brand/english-tales/icon-preview.png",512,1.05,true,false,true)
render(root+"/brand/english-tales/icon-round-preview.png",512,1.08,true,true)
