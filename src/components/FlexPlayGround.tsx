import React, { useMemo, useState } from "react";

// TailwindPlayground
// ------------------
// Drop this file into: src/pages/TailwindPlayground.tsx
// Then add a route in App.tsx (e.g. /tailwind-playground) and import it:
// import TailwindPlayground from './pages/TailwindPlayground';
// <Route path="/tailwind-playground" element={<TailwindPlayground/>} />

export default function TailwindPlayground() {
  const [direction, setDirection] = useState<"row" | "col">("row");
  const [justify, setJustify] = useState<
    "start" | "center" | "end" | "between" | "around"
  >("center");
  const [align, setAlign] = useState<"start" | "center" | "end">("center");

  const [padding, setPadding] = useState(4); // p-{n}
  const [gap, setGap] = useState(4); // gap-{n}
  const [borderRadius, setBorderRadius] = useState(2); // rounded-{n}
  const [textSize, setTextSize] = useState("base");
  const [bgColor, setBgColor] = useState("bg-white");
  const [cardColor, setCardColor] = useState("bg-blue-500");

  const breakpoints = [
    { key: "phone", label: "Phone (375px)", width: 375 },
    { key: "sm", label: "sm (640px)", width: 640 },
    { key: "md", label: "md (768px)", width: 768 },
    { key: "lg", label: "lg (1024px)", width: 1024 },
    { key: "xl", label: "xl (1280px)", width: 1280 },
    { key: "custom", label: "Custom", width: 900 },
  ];

  const [previewBp, setPreviewBp] = useState(breakpoints[0].key);
  const [customWidth, setCustomWidth] = useState(420);

  const previewWidth =
    previewBp === "custom"
      ? Math.max(240, Math.min(1600, customWidth))
      : breakpoints.find((b) => b.key === previewBp)?.width || 900;

  // map values to Tailwind classes
  const paddingClass = `p-${padding}`;
  const gapClass = `gap-${gap}`;
  const roundedClass = borderRadius === 0 ? "rounded-none" : `rounded-${borderRadius}`;
  const textClass = textSize;

  const tailwindDirection = direction === "row" ? "flex-row" : "flex-col";
  const tailwindJustify =
    justify === "start"
      ? "justify-start"
      : justify === "center"
      ? "justify-center"
      : justify === "end"
      ? "justify-end"
      : justify === "between"
      ? "justify-between"
      : "justify-around";
  const tailwindAlign =
    align === "start" ? "items-start" : align === "center" ? "items-center" : "items-end";

  const generatedClasses = `flex ${tailwindDirection} ${tailwindJustify} ${tailwindAlign} ${gapClass} ${paddingClass}`;

  const sampleButtons = [
    { label: "Primary", classes: "px-4 py-2 rounded shadow text-white bg-blue-600" },
    { label: "Ghost", classes: "px-4 py-2 rounded border text-gray-700 bg-white" },
  ];

  const colorOptions = [
    "bg-white",
    "bg-gray-50",
    "bg-slate-50",
    "bg-blue-50",
    "bg-amber-50",
  ];

  const cardOptions = [
    "bg-blue-500",
    "bg-green-500",
    "bg-rose-500",
    "bg-indigo-500",
    "bg-emerald-500",
  ];

  // helper: convert small numbers to 'p-0..p-8' valid Tailwind scale (0..8)
  const padOptions = Array.from({ length: 9 }, (_, i) => i); // 0..8
  const gapOptions = Array.from({ length: 9 }, (_, i) => i); // 0..8
  const radiusOptions = [0, 1, 2, 3, 4, 6, 8];

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // small visual confirmation
      alert("Copied classes to clipboard: " + text);
    } catch (e) {
      console.warn("Copy failed", e);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Tailwind Visual Learning Playground</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Controls Column */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Layout controls</h2>
            <div className="flex gap-2 flex-wrap mb-3">
              <button
                className={`px-3 py-1 rounded ${direction === "row" ? "bg-blue-600 text-white" : "border"}`}
                onClick={() => setDirection("row")}
              >
                row
              </button>
              <button
                className={`px-3 py-1 rounded ${direction === "col" ? "bg-blue-600 text-white" : "border"}`}
                onClick={() => setDirection("col")}
              >
                col
              </button>
            </div>

            <div className="mb-3">
              <label className="block text-sm text-gray-600">Justify</label>
              <div className="flex gap-2 flex-wrap mt-2">
                {(["start", "center", "end", "between", "around"] as const).map((j) => (
                  <button
                    key={j}
                    onClick={() => setJustify(j)}
                    className={`px-2 py-1 rounded ${justify === j ? "bg-green-600 text-white" : "border"}`}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm text-gray-600">Align</label>
              <div className="flex gap-2 mt-2">
                {(["start", "center", "end"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAlign(a)}
                    className={`px-2 py-1 rounded ${align === a ? "bg-purple-600 text-white" : "border"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <hr className="my-3" />

            <h2 className="font-semibold mb-2">Spacing & sizing</h2>
            <div className="mb-2">
              <label className="text-sm text-gray-600">Padding: p-{padding}</label>
              <input type="range" min={0} max={8} value={padding} onChange={(e) => setPadding(Number(e.target.value))} className="w-full" />
            </div>
            <div className="mb-2">
              <label className="text-sm text-gray-600">Gap: gap-{gap}</label>
              <input type="range" min={0} max={8} value={gap} onChange={(e) => setGap(Number(e.target.value))} className="w-full" />
            </div>

            <div className="mb-2">
              <label className="text-sm text-gray-600">Border radius: {roundedClass}</label>
              <select value={borderRadius} onChange={(e) => setBorderRadius(Number(e.target.value))} className="w-full mt-2 border rounded p-1 text-sm">
                {radiusOptions.map((r) => (
                  <option key={r} value={r}>{r === 0 ? "none" : `rounded-${r}`}</option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label className="text-sm text-gray-600">Text size</label>
              <select value={textSize} onChange={(e) => setTextSize(e.target.value)} className="w-full mt-2 border rounded p-1 text-sm">
                <option value="text-xs">text-xs</option>
                <option value="text-sm">text-sm</option>
                <option value="text-base">text-base</option>
                <option value="text-lg">text-lg</option>
                <option value="text-xl">text-xl</option>
              </select>
            </div>

            <hr className="my-3" />

            <div className="mb-2">
              <label className="text-sm text-gray-600">Background (page)</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {colorOptions.map((c) => (
                  <button key={c} className={`px-3 py-1 rounded border ${bgColor === c ? "ring-2 ring-offset-2 ring-sky-500" : ""}`} onClick={() => setBgColor(c)}>{c.replace("bg-", "")}</button>
                ))}
              </div>
            </div>

            <div className="mb-2">
              <label className="text-sm text-gray-600">Card color</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {cardOptions.map((c) => (
                  <button key={c} className={`px-3 py-1 rounded border ${cardColor === c ? "ring-2 ring-offset-2 ring-sky-500" : ""}`} onClick={() => setCardColor(c)}>{c.replace("bg-", "")}</button>
                ))}
              </div>
            </div>

            <hr className="my-3" />

            <h2 className="font-semibold mb-2">Preview width / breakpoints</h2>
            <div className="flex gap-2 flex-wrap">
              {breakpoints.map((b) => (
                <button key={b.key} onClick={() => setPreviewBp(b.key)} className={`px-2 py-1 rounded ${previewBp === b.key ? "bg-sky-600 text-white" : "border"}`}>{b.key}</button>
              ))}
            </div>
            {previewBp === "custom" && (
              <div className="mt-2">
                <input type="range" min={240} max={1600} value={customWidth} onChange={(e) => setCustomWidth(Number(e.target.value))} className="w-full" />
                <div className="text-xs text-gray-500">Width: {customWidth}px</div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button onClick={() => copyToClipboard(generatedClasses)} className="px-3 py-2 bg-sky-600 text-white rounded">Copy classes</button>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-3 py-2 border rounded">Top</button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2">
            <div className={`p-4 rounded ${bgColor}`} style={{ width: previewWidth, transition: 'width 200ms ease' }}>
              <div className={`flex ${tailwindDirection} ${tailwindJustify} ${tailwindAlign} ${gapClass} ${paddingClass}`}>
                <div className={`${cardColor} ${roundedClass} text-white p-4 min-w-[160px]` }>
                  <div className={`${textClass} font-bold`}>Card title</div>
                  <div className="text-sm mt-2">This is a sample card. Use controls to change spacing, alignment and colors.</div>
                  <div className="mt-3 flex gap-2">
                    {sampleButtons.map((b) => (
                      <button key={b.label} className={`${b.classes} ${roundedClass}`}>{b.label}</button>
                    ))}
                  </div>
                </div>

                <div className={`${cardColor} ${roundedClass} text-white p-4 min-w-[160px]`}>
                  <div className={`${textClass} font-bold`}>Another card</div>
                  <div className="text-sm mt-2">Cards stretch or stack depending on the axis and responsive width.</div>
                </div>

                <div className={`${cardColor} ${roundedClass} text-white p-4 min-w-[160px]`}>
                  <div className={`${textClass} font-bold`}>Third</div>
                  <div className="text-sm mt-2">Try `direction: col` and small width to see stacking behavior.</div>
                </div>
              </div>

              <div className="mt-6 bg-white p-3 rounded border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Generated Tailwind classes (copyable)</div>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-auto">{generatedClasses} {textClass} {roundedClass}</pre>
                  </div>

                  <div className="text-right text-xs text-gray-600">
                    <div>Preview width: <strong>{previewWidth}px</strong></div>
                    <div className="mt-2">Try responsive prefixes: <code className="bg-gray-100 p-1 rounded text-xs">md:flex-row</code></div>
                  </div>
                </div>
              </div>

              {/* Mobile Carousel example (show current + next partially) */}
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Mobile carousel example</h3>
                <div className="w-[320px] overflow-hidden border rounded">
                  <div className="flex space-x-3 p-3" style={{ transform: 'translateX(0px)' }}>
                    <div className="w-56 bg-white rounded shadow p-3">Current (center)</div>
                    <div className="w-44 bg-gray-100 rounded p-3">Next (partial)</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">This demonstrates the "peek" pattern often used on mobile carousels.</div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
