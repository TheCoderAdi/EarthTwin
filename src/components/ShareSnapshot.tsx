import { useState } from "react";
import { toPng } from "html-to-image";
import { Camera, Download, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

type Props = {
  targetSelector: string;
  caption?: string;
};

async function snapshotWithWebGL(node: HTMLElement): Promise<string> {
  const canvases = Array.from(
    node.querySelectorAll("canvas"),
  ) as HTMLCanvasElement[];
  const canvasReplacements: {
    canvas: HTMLCanvasElement;
    img: HTMLImageElement;
  }[] = [];

  const svgs = Array.from(node.querySelectorAll("svg")) as SVGElement[];
  const svgReplacements: { svg: SVGElement; img: HTMLImageElement }[] = [];
  const hiddenDuringCapture: HTMLElement[] = [];

  try {
    const allNodes = Array.from(node.querySelectorAll("*")) as HTMLElement[];
    const labelNode = allNodes.find((n) =>
      (n.textContent || "").trim().startsWith("Carbon Score"),
    );
    if (labelNode) {
      const panel =
        labelNode.closest(".glass") ||
        labelNode.closest(".relative") ||
        labelNode.parentElement;
      if (panel && panel instanceof HTMLElement) {
        panel.style.display = "none";
        hiddenDuringCapture.push(panel);
      }
    }
  } catch {
    /* non-fatal */
  }

  window.dispatchEvent(new Event("resize"));
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => requestAnimationFrame(r));
  }

  for (const svg of svgs) {
    try {
      const serializer = new XMLSerializer();
      let svgStr = serializer.serializeToString(svg);
      if (!svgStr.match(/^<svg[^>]+xmlns="http/)) {
        svgStr = svgStr.replace(
          /^<svg/,
          '<svg xmlns="http://www.w3.org/2000/svg"',
        );
      }
      const w =
        (svg as unknown as HTMLElement).clientWidth ||
        Number(svg.getAttribute("width")) ||
        svg.ownerSVGElement?.clientWidth ||
        0;
      const h =
        (svg as unknown as HTMLElement).clientHeight ||
        Number(svg.getAttribute("height")) ||
        svg.ownerSVGElement?.clientHeight ||
        0;
      const img = document.createElement("img");
      const svg64 = btoa(unescape(encodeURIComponent(svgStr)));
      img.src = `data:image/svg+xml;base64,${svg64}`;
      // set dimensions if available
      if (w) img.width = Number(w);
      if (h) img.height = Number(h);
      img.style.cssText = (svg as unknown as HTMLElement).style?.cssText || "";
      img.style.width =
        (w && `${w}px`) ||
        (svg.getAttribute("width") ? `${svg.getAttribute("width")}px` : "auto");
      img.style.height =
        (h && `${h}px`) ||
        (svg.getAttribute("height")
          ? `${svg.getAttribute("height")}px`
          : "auto");
      img.style.display = "block";
      svg.parentElement?.insertBefore(img, svg);
      (svg as unknown as HTMLElement).style.display = "none";
      svgReplacements.push({ svg, img });
    } catch {
      // ignore
    }
  }

  for (const canvas of canvases) {
    let dataUrl = "";
    try {
      dataUrl = canvas.toDataURL("image/png");
    } catch {
      continue;
    }
    if (!dataUrl || dataUrl.length < 1000) continue;
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    const img = document.createElement("img");
    img.src = dataUrl;
    img.width = w;
    img.height = h;
    img.style.cssText = canvas.style.cssText || "";
    img.style.width = `${w}px`;
    img.style.height = `${h}px`;
    img.style.display = "block";
    canvas.parentElement?.insertBefore(img, canvas);
    canvas.style.display = "none";
    canvasReplacements.push({ canvas, img });
  }

  await Promise.all(
    [...canvasReplacements, ...svgReplacements].map(
      ({ img }) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );

  try {
    const url = await toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#05070d",
      skipFonts: true,
    });
    return url;
  } finally {
    for (const { canvas, img } of canvasReplacements) {
      canvas.style.display = "";
      img.remove();
    }
    for (const { svg, img } of svgReplacements) {
      (svg as unknown as HTMLElement).style.display = "";
      img.remove();
    }
    for (const el of hiddenDuringCapture) {
      el.style.display = "";
    }
  }
}

export default function ShareSnapshot({ targetSelector, caption }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const capture = async () => {
    const node = document.querySelector(targetSelector) as HTMLElement | null;
    if (!node) {
      toast({
        title: "Could not capture",
        description: "Snapshot target not found.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setDataUrl(null);
    setOpen(true);
    try {
      const url = await snapshotWithWebGL(node);
      setDataUrl(url);
    } catch (e) {
      console.error(e);
      toast({
        title: "Snapshot failed",
        description: "Try again in a moment.",
        variant: "destructive",
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `earthtwin-${Date.now()}.png`;
    a.click();
  };

  const share = async () => {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "earthtwin.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (d: { files: File[] }) => boolean;
      };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My EarthTwin",
          text: caption ?? "I just simulated my digital twin of Earth 🌍",
        });
        return;
      }
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      toast({
        title: "Copied to clipboard",
        description: "Paste it anywhere to share.",
      });
    } catch {
      download();
    }
  };

  console.log({ dataUrl });

  return (
    <>
      <Button
        data-tour="share-btn"
        variant="ghost"
        size="sm"
        onClick={capture}
        className="gap-2 border border-primary/30 hover:bg-primary/10"
      >
        <Camera className="h-4 w-4 text-primary" /> Share
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[92vw] max-w-[92vw] sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Your EarthTwin snapshot</DialogTitle>
            <DialogDescription>
              Preview, download, or share your simulated planet.
            </DialogDescription>
          </DialogHeader>
          <div className="relative min-h-[280px] overflow-hidden rounded-lg border border-border bg-background/50">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Capturing your
                planet…
              </div>
            )}
            {dataUrl && (
              <img src={dataUrl} alt="EarthTwin snapshot" className="w-full" />
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={download}
              disabled={!dataUrl}
              className="gap-2"
            >
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button
              onClick={share}
              disabled={!dataUrl}
              className="gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground"
            >
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
