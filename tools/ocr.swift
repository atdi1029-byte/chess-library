// OCR every work/pages/NNN.png with the macOS Vision framework.
// Writes work/ocr/NNN.json: [{t: text, x, y, w, h}] with y measured from the top (0..1).
import Foundation
import Vision
import AppKit

let args = CommandLine.arguments
let inDir = args[1], outDir = args[2]
let fm = FileManager.default
let files = (try! fm.contentsOfDirectory(atPath: inDir)).filter { $0.hasSuffix(".png") }.sorted()
for f in files {
    let outPath = "\(outDir)/\(f.replacingOccurrences(of: ".png", with: ".json"))"
    if fm.fileExists(atPath: outPath) { continue }
    guard let img = NSImage(contentsOfFile: "\(inDir)/\(f)"),
          let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
    // The newest model can fail to load from a command-line tool; fall back to older ones.
    var req = VNRecognizeTextRequest()
    var done = false
    for (rev, level, correct) in [(3, VNRequestTextRecognitionLevel.accurate, true), (3, .accurate, false),
                                  (2, .accurate, false), (1, .accurate, false), (3, .fast, false)] {
        req = VNRecognizeTextRequest()
        req.revision = rev
        req.recognitionLevel = level
        req.usesLanguageCorrection = correct
        do { try VNImageRequestHandler(cgImage: cg, options: [:]).perform([req]); done = true } catch { continue }
        if done { break }
    }
    if !done { FileHandle.standardError.write("OCR FAILED \(f)\n".data(using: .utf8)!); continue }
    var rows: [[String: Any]] = []
    for o in (req.results ?? []) {
        guard let c = o.topCandidates(1).first else { continue }
        let b = o.boundingBox
        rows.append(["t": c.string, "x": b.minX, "y": 1 - b.maxY, "w": b.width, "h": b.height])
    }
    rows.sort { ($0["y"] as! CGFloat) < ($1["y"] as! CGFloat) }
    let data = try! JSONSerialization.data(withJSONObject: rows, options: [])
    try! data.write(to: URL(fileURLWithPath: outPath))
}
print("ocr done:", files.count)
