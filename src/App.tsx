import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Upload, Download, Image as ImageIcon, Type, Layout, Package, Layers, SlidersHorizontal } from 'lucide-react';

interface LabelData {
  name: string;
  varietal: string;
  process: string;
  origin: string;
  tastingNotes: string;
}

interface LayoutSettings {
  titleY: number;
  titleFontSize: number;
  gridY: number;
  rowSpacing: number;
  leftColX: number;
  rightColX: number;
  detailsFontSize: number;
  lineHeight: number;
}

interface MockupLabelSettings {
  enabled: boolean;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  blendMode: GlobalCompositeOperation;
}

type AspectRatio = 'original' | '1:1' | '4:5' | '16:9';

const defaultData: LabelData = {
  name: 'Bombarderen de Cikurayyan',
  varietal: 'Ateng Super, Yellow Bourbon',
  process: 'Anaerobic Honey',
  origin: 'Sukahurip, Garut, West Java',
  tastingNotes: 'Blueberry, Black Cherry, Lime, Longan, Sweet Aftertaste'
};

const defaultSettings: LayoutSettings = {
  titleY: 28,
  titleFontSize: 175,
  gridY: 45,
  rowSpacing: 20,
  leftColX: 15,
  rightColX: 60,
  detailsFontSize: 65,
  lineHeight: 1.4,
};

const defaultMockupLabels: MockupLabelSettings[] = [
  { enabled: true, x: 34, y: 65.5, scale: 22, rotation: 0, opacity: 100, blendMode: 'source-over' }
];

function getTitleColor(name: string) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('bloementuin')) return '#8f342a';
  if (lowerName.includes('fruittuin')) return '#8f1c3f';
  if (lowerName.includes('bombarderen')) return '#8f2a7e';
  return '#8f342a'; // default
}

const Slider = ({ label, value, min, max, onChange, step = 1 }: { label: string, value: number, min: number, max: number, onChange: (v: number) => void, step?: number }) => (
  <div className="group">
    <div className="flex justify-between mb-2 items-center">
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{value}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step}
      value={value} 
      onChange={e => onChange(Number(e.target.value))} 
      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all"
    />
  </div>
);

const InputField = ({ label, value, onChange, multiline = false }: { label: string, value: string, onChange: (v: string) => void, multiline?: boolean }) => (
  <div>
    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
    {multiline ? (
      <textarea 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none shadow-sm" 
        rows={3} 
      />
    ) : (
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" 
      />
    )}
  </div>
);

import { useHistory } from './useHistory';

export default function App() {
  const [activeTab, setActiveTab] = useState<'label' | 'mockup'>('label');
  
  const { state: appState, set: setAppState, undo, redo, canUndo, canRedo } = useHistory({
    data: defaultData,
    settings: defaultSettings,
    mockupType: 'double' as 'single' | 'double',
    mockupAspectRatio: '4:5' as AspectRatio,
    mockupImageScale: 80,
    mockupLabels: defaultMockupLabels
  });

  const { data, settings, mockupType, mockupAspectRatio, mockupImageScale, mockupLabels } = appState;

  const setData = (newData: LabelData) => setAppState(prev => ({ ...prev, data: newData }));
  const setSettings = (newSettings: LayoutSettings) => setAppState(prev => ({ ...prev, settings: newSettings }));
  const setMockupType = (newType: 'single' | 'double') => setAppState(prev => ({ ...prev, mockupType: newType }));
  const setMockupAspectRatio = (newRatio: AspectRatio) => setAppState(prev => ({ ...prev, mockupAspectRatio: newRatio }));
  const setMockupImageScale = (newScale: number) => setAppState(prev => ({ ...prev, mockupImageScale: newScale }));
  const setMockupLabels = (newLabels: MockupLabelSettings[]) => setAppState(prev => ({ ...prev, mockupLabels: newLabels }));

  const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(null);
  const [mockupImage, setMockupImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg'>('png');
  const [exportQuality, setExportQuality] = useState<number>(0.9);

  const [generatedBackground, setGeneratedBackground] = useState<HTMLImageElement | null>(null);
  const [bgMode, setBgMode] = useState<'renaissance' | 'gradient'>('renaissance');
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);

  const getColorsFromNotes = (notes: string) => {
    const colorMap: { [key: string]: string } = {
      'blueberry': '#3c4a70', // Muted indigo
      'cherry': '#5e1914',    // Deep madder red
      'lime': '#6b8e23',      // Olive green
      'longan': '#c2a378',    // Antique parchment
      'sweet': '#d4a5a5',     // Dusty rose
      'banana': '#d4af37',    // Gold/Ochre
      'creamy': '#f5e6d3',    // Warm ivory
      'tropical': '#b35a2d',  // Burnt orange
      'floral': '#c28e8e',    // Muted floral
      'flower': '#c28e8e',    // Muted floral
      'honey': '#c68e17',     // Warm amber
      'chocolate': '#4a2c2a', // Sepia brown
      'nutty': '#704214',     // Umber
      'caramel': '#966919',   // Raw sienna
      'citrus': '#c5a059',    // Warm yellow
      'berry': '#6b3e5a'      // Deep plum
    };

    const lowerNotes = notes.toLowerCase();
    const colors: string[] = [];
    
    Object.keys(colorMap).forEach(key => {
      if (lowerNotes.includes(key)) {
        colors.push(colorMap[key]);
      }
    });

    // Fallback colors if no matches (Warm Renaissance neutrals)
    if (colors.length === 0) colors.push('#d7ccc8', '#efebe9');
    if (colors.length === 1) colors.push(colors[0] + 'aa'); // Add a slightly transparent version

    return colors;
  };

  const generateGradient = () => {
    setIsGeneratingBg(true);
    setBgError(null);
    
    try {
      const colors = getColorsFromNotes(data.tastingNotes);
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color);
      });

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add some texture/noise
      for (let i = 0; i < 10000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
        ctx.fillRect(x, y, size, size);
      }

      const img = new Image();
      img.onload = () => {
        setGeneratedBackground(img);
        setIsGeneratingBg(false);
      };
      img.src = canvas.toDataURL('image/png');
    } catch (err) {
      setBgError("Failed to generate gradient.");
      setIsGeneratingBg(false);
    }
  };

  const labelCanvasRef = useRef<HTMLCanvasElement>(null);
  const mockupCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setImage: (img: HTMLImageElement) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setIsUploading(false);
        };
        img.onerror = () => {
          setUploadError("Failed to load image.");
          setIsUploading(false);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        setUploadError("Failed to read file.");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateBackground = async () => {
    if (!data.tastingNotes) return;
    setIsGeneratingBg(true);
    setBgError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const getCategoryPrompt = () => {
        const name = data.name.toLowerCase();
        const notes = data.tastingNotes.toLowerCase();
        
        if (name.includes('bloementuin') || notes.includes('floral') || notes.includes('flower')) {
          return "a lush Renaissance-style flower garden (Bloementuin) with vibrant blooms, soft lighting, and classical Dutch still life aesthetic";
        }
        if (name.includes('fruittuin') || notes.includes('fruity') || notes.includes('fruit') || notes.includes('berry') || notes.includes('banana')) {
          return "a bountiful Renaissance-style fruit orchard (Fruittuin) with overflowing baskets of tropical and classical fruits, rich textures, and warm sunlight";
        }
        if (name.includes('bombarderen') || notes.includes('funky') || notes.includes('experimental')) {
          return "a dramatic and experimental Renaissance-style scene (Bombarderen) with bold colors, dynamic composition, and surreal artistic elements";
        }
        return `a Renaissance-style scene featuring themes of ${data.tastingNotes}`;
      };

      const categoryPrompt = getCategoryPrompt();
      const prompt = `A high-quality Renaissance oil painting background for a product mockup, featuring ${categoryPrompt}. Artistic, masterpiece, rich colors, classical composition, slightly blurred background style to make the product in front pop. The center area should be relatively clear of busy details to allow the product packaging to stand out. No text, no people.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });
      
      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
      
      if (imageUrl) {
        const img = new Image();
        img.onload = () => {
          setGeneratedBackground(img);
          setIsGeneratingBg(false);
        };
        img.onerror = () => {
          setBgError("Failed to load generated image.");
          setIsGeneratingBg(false);
        };
        img.src = imageUrl;
      } else {
        setBgError("No image generated.");
        setIsGeneratingBg(false);
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      setBgError(error?.message || "Failed to generate background.");
      setIsGeneratingBg(false);
    }
  };

  const drawLabel = () => {
    const canvas = labelCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (templateImage) {
      ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
    } else {
      // Placeholder background
      ctx.fillStyle = '#e8e4d9';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#c4b59d';
      ctx.lineWidth = 20 * scale;
      ctx.strokeRect(40 * scale, 40 * scale, canvas.width - 80 * scale, canvas.height - 80 * scale);
    }

    const titleColor = getTitleColor(data.name);
    ctx.font = `italic 700 ${settings.titleFontSize * scale}px "Playfair Display", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const titleX = canvas.width / 2;
    const titleY = canvas.height * (settings.titleY / 100);

    // 3D / Shadow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowOffsetX = 4 * scale;
    ctx.shadowOffsetY = 4 * scale;
    ctx.shadowBlur = 6 * scale;
    ctx.fillStyle = titleColor;
    ctx.fillText(data.name, titleX, titleY);

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2 * scale;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.strokeText(data.name, titleX - 2 * scale, titleY - 2 * scale);
    ctx.fillStyle = titleColor;
    ctx.fillText(data.name, titleX, titleY);

    // Details
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const col1X = canvas.width * (settings.leftColX / 100);
    const col2X = canvas.width * (settings.rightColX / 100);
    const row1Y = canvas.height * (settings.gridY / 100);
    const row2Y = canvas.height * ((settings.gridY + settings.rowSpacing) / 100);
    
    const labelFont = `bold ${settings.detailsFontSize * scale}px "Inter", sans-serif`;
    const valueFont = `normal ${settings.detailsFontSize * scale}px "Inter", sans-serif`;
    const textColor = '#333333';

    const drawDetail = (label: string, value: string, x: number, y: number) => {
      ctx.fillStyle = textColor;
      ctx.font = labelFont;
      ctx.fillText(label, x, y);
      
      ctx.font = valueFont;
      const maxWidth = canvas.width * 0.35;
      const words = value.split(' ');
      let line = '';
      let currentY = y + (settings.detailsFontSize * scale * settings.lineHeight);
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line.trim(), x, currentY);
          line = words[n] + ' ';
          currentY += (settings.detailsFontSize * scale * settings.lineHeight);
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), x, currentY);
    };

    drawDetail('Varietal:', data.varietal, col1X, row1Y);
    drawDetail('Process:', data.process, col2X, row1Y);
    drawDetail('Tasting notes:', data.tastingNotes, col1X, row2Y);
    drawDetail('Origin:', data.origin, col2X, row2Y);
  };

  const drawMockup = () => {
    const canvas = mockupCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    const labelCanvas = labelCanvasRef.current;
    if (!canvas || !ctx || !labelCanvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw AI Generated Background first
    if (generatedBackground) {
      const bgRatio = generatedBackground.width / generatedBackground.height;
      const canvasRatio = canvas.width / canvas.height;
      let bgDrawWidth, bgDrawHeight, bgOffsetX, bgOffsetY;

      if (bgRatio > canvasRatio) {
        bgDrawHeight = canvas.height;
        bgDrawWidth = generatedBackground.width * (bgDrawHeight / generatedBackground.height);
        bgOffsetX = (canvas.width - bgDrawWidth) / 2;
        bgOffsetY = 0;
      } else {
        bgDrawWidth = canvas.width;
        bgDrawHeight = generatedBackground.height * (bgDrawWidth / generatedBackground.width);
        bgOffsetX = 0;
        bgOffsetY = (canvas.height - bgDrawHeight) / 2;
      }
      ctx.drawImage(generatedBackground, bgOffsetX, bgOffsetY, bgDrawWidth, bgDrawHeight);

      // Add a subtle vignette and lighting to highlight the center
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.1,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    let drawWidth = canvas.width;
    let drawHeight = canvas.height;
    let offsetX = 0;
    let offsetY = 0;

    if (mockupImage) {
      // Calculate cover dimensions
      const imgRatio = mockupImage.width / mockupImage.height;
      const canvasRatio = canvas.width / canvas.height;
      const scaleFactor = mockupImageScale / 100;

      if (imgRatio > canvasRatio) {
        // Image is wider than canvas
        drawHeight = canvas.height * scaleFactor;
        drawWidth = mockupImage.width * (drawHeight / mockupImage.height);
        offsetX = (canvas.width - drawWidth) / 2;
      } else {
        // Image is taller than canvas
        drawWidth = canvas.width * scaleFactor;
        drawHeight = mockupImage.height * (drawWidth / mockupImage.width);
        offsetY = (canvas.height - drawHeight) / 2;
      }

      ctx.drawImage(mockupImage, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#d1d5db';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Upload Mockup Template', canvas.width / 2, canvas.height / 2);
    }

    // Draw labels on mockup
    mockupLabels.forEach(label => {
      if (!label.enabled) return;

      ctx.save();
      
      // Calculate position and size relative to the drawn image dimensions
      const x = offsetX + drawWidth * (label.x / 100);
      const y = offsetY + drawHeight * (label.y / 100);
      const labelWidth = drawWidth * (label.scale / 100);
      const labelHeight = labelWidth * (labelCanvas.height / labelCanvas.width);

      ctx.translate(x, y);
      ctx.rotate((label.rotation * Math.PI) / 180);
      
      // Add a soft drop shadow behind the packaging to ground it in the scene
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 40 * (label.scale / 100);
      ctx.shadowOffsetX = 10 * (label.scale / 100);
      ctx.shadowOffsetY = 20 * (label.scale / 100);

      ctx.globalAlpha = label.opacity / 100;
      ctx.globalCompositeOperation = label.blendMode;

      // Draw centered on the translation point
      ctx.drawImage(
        labelCanvas, 
        -labelWidth / 2, 
        -labelHeight / 2, 
        labelWidth, 
        labelHeight
      );

      ctx.restore();
    });
  };

  useEffect(() => {
    // Load default template image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setTemplateImage(img);
    };
    img.src = `/label_template.png?v=${Date.now()}`;
  }, []);

  useEffect(() => {
    // Load default mockup image based on type
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setMockupImage(img);
    };
    // Add cache buster to ensure updated images are loaded
    const cacheBuster = Date.now();
    img.src = mockupType === 'double' ? `/mockup_double.png?v=${cacheBuster}` : `/mockup_single.png?v=${cacheBuster}`;
    
    // Update default labels based on type
    if (mockupType === 'single') {
      setMockupLabels([
        { enabled: true, x: 41.5, y: 62.5, scale: 32.5, rotation: 25, opacity: 100, blendMode: 'source-over' }
      ]);
    } else {
      setMockupLabels([
        { enabled: true, x: 34, y: 65.5, scale: 22, rotation: 0, opacity: 100, blendMode: 'source-over' }
      ]);
    }
  }, [mockupType]);

  useEffect(() => {
    if (labelCanvasRef.current) {
      if (templateImage) {
        labelCanvasRef.current.width = templateImage.width * scale;
        labelCanvasRef.current.height = templateImage.height * scale;
      } else {
        labelCanvasRef.current.width = 1920 * scale;
        labelCanvasRef.current.height = 1080 * scale;
      }
    }
    document.fonts.ready.then(() => {
      drawLabel();
      if (activeTab === 'mockup') {
        drawMockup();
      }
    });
  }, [data, templateImage, settings, scale, activeTab, generatedBackground]);

  useEffect(() => {
    if (mockupCanvasRef.current) {
      let targetWidth = 1080;
      let targetHeight = 1080;

      if (mockupImage) {
        if (mockupAspectRatio === 'original') {
          targetWidth = mockupImage.width;
          targetHeight = mockupImage.height;
        } else if (mockupAspectRatio === '1:1') {
          targetWidth = 1080;
          targetHeight = 1080;
        } else if (mockupAspectRatio === '4:5') {
          targetWidth = 1080;
          targetHeight = 1350;
        } else if (mockupAspectRatio === '16:9') {
          targetWidth = 1920;
          targetHeight = 1080;
        }
      }

      mockupCanvasRef.current.width = targetWidth;
      mockupCanvasRef.current.height = targetHeight;
    }
    drawMockup();
  }, [mockupImage, mockupLabels, activeTab, mockupAspectRatio, mockupImageScale]);

  const handleDownload = () => {
    const canvas = activeTab === 'label' ? labelCanvasRef.current : mockupCanvasRef.current;
    if (!canvas) return;
    
    const mimeType = exportFormat === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = exportFormat === 'jpg' ? exportQuality : undefined;
    const dataUrl = canvas.toDataURL(mimeType, quality);
    
    const link = document.createElement('a');
    const prefix = activeTab === 'label' ? 'Label' : 'Mockup';
    link.download = `${prefix}_${data.name.replace(/\s+/g, '_')}.${exportFormat}`;
    link.href = dataUrl;
    link.click();
  };

  const updateMockupLabel = (index: number, updates: Partial<MockupLabelSettings>) => {
    const newLabels = [...mockupLabels];
    newLabels[index] = { ...newLabels[index], ...updates };
    setMockupLabels(newLabels);
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {/* Hidden div to preload fonts */}
      <div style={{ visibility: 'hidden', position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontStyle: 'italic' }}>preload</span>
        <span style={{ fontFamily: 'Inter', fontWeight: 400 }}>preload</span>
        <span style={{ fontFamily: 'Inter', fontWeight: 700 }}>preload</span>
      </div>

      {/* Sidebar */}
      <div className="w-[420px] bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-gray-100 flex flex-col h-full z-10 relative">
        {/* Header */}
        <div className="shrink-0 p-6 border-b border-gray-100 bg-white/90 backdrop-blur-md z-20">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl shadow-sm">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                Ootophia Studio
              </h1>
              <p className="text-sm text-gray-500 mt-2 font-medium">Label & Mockup Generator</p>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={undo} 
                disabled={!canUndo}
                className={`p-2 rounded-lg transition-all ${canUndo ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300'}`}
                title="Undo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
              </button>
              <button 
                onClick={redo} 
                disabled={!canRedo}
                className={`p-2 rounded-lg transition-all ${canRedo ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300'}`}
                title="Redo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex mt-6 bg-gray-100/50 p-1 rounded-xl">
            <button 
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'label' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('label')}
            >
              Label Editor
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'mockup' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('mockup')}
            >
              Mockup Generator
            </button>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
          {activeTab === 'label' ? (
            <>
              {/* Template Upload */}
              <section>
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-gray-400" /> Label Template
                </h2>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-200 border-dashed rounded-2xl cursor-pointer bg-gray-50/50 hover:bg-gray-50 hover:border-blue-400 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium"><span className="text-blue-600">Click to upload</span> label template</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setTemplateImage)} />
                  </label>
                </div>
              </section>

              {/* Data Inputs */}
              <section>
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Type className="w-4 h-4 text-gray-400" /> Coffee Details
                </h2>
                <div className="space-y-5">
                  <InputField label="Product Lineup Name" value={data.name} onChange={v => setData({...data, name: v})} />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Varietal" value={data.varietal} onChange={v => setData({...data, varietal: v})} />
                    <InputField label="Process" value={data.process} onChange={v => setData({...data, process: v})} />
                  </div>
                  <InputField label="Origin" value={data.origin} onChange={v => setData({...data, origin: v})} />
                  <InputField label="Tasting Notes" value={data.tastingNotes} onChange={v => setData({...data, tastingNotes: v})} multiline />
                </div>
              </section>

              {/* Layout Settings */}
              <section>
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Layout className="w-4 h-4 text-gray-400" /> Layout Adjustments
                </h2>
                <div className="space-y-6 bg-white border border-gray-100 shadow-sm p-6 rounded-2xl">
                  <Slider label="Title Y Position" value={settings.titleY} min={10} max={90} onChange={v => setSettings({...settings, titleY: v})} />
                  <Slider label="Title Font Size" value={settings.titleFontSize} min={40} max={300} onChange={v => setSettings({...settings, titleFontSize: v})} />
                  <div className="h-px bg-gray-100 my-4" />
                  <Slider label="Grid Y Position" value={settings.gridY} min={10} max={90} onChange={v => setSettings({...settings, gridY: v})} />
                  <Slider label="Row Spacing" value={settings.rowSpacing} min={5} max={40} onChange={v => setSettings({...settings, rowSpacing: v})} />
                  <div className="h-px bg-gray-100 my-4" />
                  <Slider label="Left Column X" value={settings.leftColX} min={5} max={50} onChange={v => setSettings({...settings, leftColX: v})} />
                  <Slider label="Right Column X" value={settings.rightColX} min={50} max={95} onChange={v => setSettings({...settings, rightColX: v})} />
                  <Slider label="Details Font Size" value={settings.detailsFontSize} min={16} max={120} onChange={v => setSettings({...settings, detailsFontSize: v})} />
                </div>
              </section>
            </>
          ) : (
            <>
              {/* Mockup Upload */}
              <section>
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" /> Mockup Template
                </h2>
                
                <div className="flex gap-2 mb-4 p-1 bg-gray-100/50 rounded-xl">
                  <button 
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mockupType === 'single' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => {
                      setMockupType('single');
                      setMockupImageScale(100);
                    }}
                  >
                    Single Pouch
                  </button>
                  <button 
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mockupType === 'double' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => {
                      setMockupType('double');
                      setMockupImageScale(80);
                    }}
                  >
                    Double Pouch
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Frame Aspect Ratio</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['4:5', '1:1', '16:9', 'original'] as AspectRatio[]).map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setMockupAspectRatio(ratio)}
                        className={`py-2 text-xs font-bold rounded-lg transition-all border ${mockupAspectRatio === ratio ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {ratio === 'original' ? 'Orig' : ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <Slider label="Image Scale" value={mockupImageScale} min={50} max={150} onChange={setMockupImageScale} />
                </div>

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-200 border-dashed rounded-2xl cursor-pointer bg-gray-50/50 hover:bg-gray-50 hover:border-blue-400 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium"><span className="text-blue-600">Click to upload</span> custom mockup</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setMockupImage)} />
                  </label>
                </div>
              </section>

              {/* AI Background Generation */}
              <section>
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-400" /> Mockup Scene Background
                </h2>
                <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-2xl">
                  <div className="flex gap-2 mb-4 p-1 bg-gray-50 rounded-xl border border-gray-100">
                    <button 
                      onClick={() => setBgMode('renaissance')}
                      className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${bgMode === 'renaissance' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Renaissance
                    </button>
                    <button 
                      onClick={() => setBgMode('gradient')}
                      className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${bgMode === 'gradient' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Gradient
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    {bgMode === 'renaissance' 
                      ? "Generate a Renaissance-style scene based on the product category (Bloementuin, Fruittuin, or Bombarderen)."
                      : "Generate a smooth color gradient derived from your coffee's tasting notes."}
                  </p>
                  
                  <button 
                    onClick={bgMode === 'renaissance' ? generateBackground : generateGradient}
                    disabled={isGeneratingBg || !data.tastingNotes}
                    className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    {isGeneratingBg ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        {bgMode === 'renaissance' ? 'Generate Mockup Background' : 'Generate Gradient Background'}
                      </>
                    )}
                  </button>
                  {bgError && <p className="text-xs text-red-500 font-medium mt-2">{bgError}</p>}
                </div>
              </section>

              {/* Mockup Labels Settings */}
              <section>
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gray-400" /> Label Placement
                </h2>
                
                {mockupLabels.map((label, index) => (
                  <div key={index} className="mb-6 bg-white border border-gray-100 shadow-sm p-5 rounded-2xl">
                    <div className="space-y-5">
                      <Slider label="Position X" value={label.x} min={0} max={100} step={0.1} onChange={v => updateMockupLabel(index, { x: v })} />
                      <Slider label="Position Y" value={label.y} min={0} max={100} step={0.1} onChange={v => updateMockupLabel(index, { y: v })} />
                      <Slider label="Scale" value={label.scale} min={5} max={100} step={0.1} onChange={v => updateMockupLabel(index, { scale: v })} />
                      <Slider label="Rotation" value={label.rotation} min={-180} max={180} onChange={v => updateMockupLabel(index, { rotation: v })} />
                      <Slider label="Opacity" value={label.opacity} min={0} max={100} onChange={v => updateMockupLabel(index, { opacity: v })} />
                      
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Blend Mode</label>
                        <select 
                          value={label.blendMode}
                          onChange={e => updateMockupLabel(index, { blendMode: e.target.value as GlobalCompositeOperation })}
                          className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        >
                          <option value="source-over">Normal</option>
                          <option value="multiply">Multiply</option>
                          <option value="overlay">Overlay</option>
                          <option value="screen">Screen</option>
                          <option value="darken">Darken</option>
                          <option value="color-burn">Color Burn</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="shrink-0 p-6 border-t border-gray-100 bg-gray-50/80 backdrop-blur-md space-y-5 z-20">
          {activeTab === 'label' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Export Scale</label>
                <span className="text-[10px] font-medium text-gray-400 bg-gray-200/50 px-2 py-0.5 rounded-full">112.4 x 53.89 mm</span>
              </div>
              <div className="flex gap-2 p-1 bg-gray-200/50 rounded-xl">
                {[1, 2, 4, 8].map(s => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${scale === s ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Export Format</label>
            </div>
            <div className="flex gap-2 p-1 bg-gray-200/50 rounded-xl mb-3">
              <button
                onClick={() => setExportFormat('png')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${exportFormat === 'png' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
              >
                PNG
              </button>
              <button
                onClick={() => setExportFormat('jpg')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${exportFormat === 'jpg' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
              >
                JPG
              </button>
            </div>
            
            {exportFormat === 'jpg' && (
              <Slider label="JPG Quality" value={exportQuality} min={0.1} max={1.0} step={0.1} onChange={setExportQuality} />
            )}
          </div>

          <button onClick={handleDownload} className="w-full py-3.5 px-4 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-gray-900/20 active:scale-[0.98]">
            <Download className="w-5 h-5" />
            Download {activeTab === 'label' ? 'Label' : 'Mockup'}
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 p-8 flex flex-col items-center justify-center overflow-hidden bg-[#f3f4f6]" style={{ backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="w-full h-full flex items-center justify-center relative">
          {/* Label Canvas (Hidden in Mockup Mode, but still rendered for drawing) */}
          <canvas 
            ref={labelCanvasRef} 
            className={`max-w-full max-h-full object-contain shadow-2xl rounded-sm ring-1 ring-black/5 ${activeTab === 'mockup' ? 'hidden' : 'block'}`}
            style={{ width: 'auto', height: 'auto' }}
          />
          
          {/* Mockup Canvas */}
          <canvas 
            ref={mockupCanvasRef} 
            className={`max-w-full max-h-full object-contain shadow-2xl rounded-sm ring-1 ring-black/5 ${activeTab === 'label' ? 'hidden' : 'block'}`}
            style={{ width: 'auto', height: 'auto' }}
          />

          {activeTab === 'label' && !templateImage && !isUploading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-gray-900/80 text-white px-6 py-3 rounded-full backdrop-blur-md font-medium flex items-center gap-2 shadow-xl">
                <Upload className="w-5 h-5" />
                Upload template to see final result
              </div>
            </div>
          )}

          {activeTab === 'mockup' && !mockupImage && !isUploading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-gray-900/80 text-white px-6 py-3 rounded-full backdrop-blur-md font-medium flex items-center gap-2 shadow-xl">
                <Package className="w-5 h-5" />
                Upload mockup template to begin
              </div>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/50 backdrop-blur-sm z-50">
              <div className="bg-white px-6 py-4 rounded-2xl font-medium flex items-center gap-3 shadow-xl border border-gray-100">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-800">Processing image...</span>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
              <div className="bg-red-50 text-red-600 px-6 py-3 rounded-full font-medium flex items-center gap-2 shadow-xl border border-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {uploadError}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

