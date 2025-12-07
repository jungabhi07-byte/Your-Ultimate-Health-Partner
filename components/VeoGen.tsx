import React, { useState } from 'react';
import { Upload, Video, Loader2, Play } from 'lucide-react';
import { generateVeoVideo } from '../services/geminiService';

const VeoGen: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Animate this image in a cinematic style, slow motion');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        setVideoUrl(null); // Reset previous video
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;

    setIsGenerating(true);
    try {
      // Remove data:image/png;base64, prefix if present for the API call if needed
      // but generateVeoVideo expects the raw base64 string without header usually?
      // actually @google/genai imageBytes usually expects base64 without prefix.
      const base64Data = selectedImage.split(',')[1];
      
      const url = await generateVeoVideo(base64Data, prompt, aspectRatio);
      setVideoUrl(url);
    } catch (error) {
      console.error("Video generation failed", error);
      alert("Failed to generate video. Ensure you have selected a paid API key via the pop-up.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Video className="h-6 w-6 text-purple-600" />
          Motivation Visualizer
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Bring your transformation journey to life with AI video generation.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Upload Area */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
          {selectedImage ? (
            <div className="relative w-full max-w-xs aspect-video rounded-lg overflow-hidden shadow-md">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => { setSelectedImage(null); setVideoUrl(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Upload a photo to animate</span>
              <span className="text-xs text-gray-400 mt-1">JPG or PNG</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Animation Prompt</label>
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm p-2 border"
            />
          </div>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input 
                type="radio" 
                name="aspect" 
                checked={aspectRatio === '16:9'} 
                onChange={() => setAspectRatio('16:9')}
                className="text-purple-600 focus:ring-purple-500" 
              />
              Landscape (16:9)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input 
                type="radio" 
                name="aspect" 
                checked={aspectRatio === '9:16'} 
                onChange={() => setAspectRatio('9:16')}
                className="text-purple-600 focus:ring-purple-500" 
              />
              Portrait (9:16)
            </label>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedImage || isGenerating}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating Video (this takes ~1 min)...
              </>
            ) : (
              <>
                <Video className="h-4 w-4" /> Generate Video
              </>
            )}
          </button>
        </div>

        {/* Video Result */}
        {videoUrl && (
          <div className="mt-6 animate-fadeIn">
             <h4 className="text-sm font-medium text-gray-900 mb-2">Your AI Video</h4>
             <video 
                src={videoUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full rounded-lg shadow-lg"
             />
             <p className="mt-2 text-xs text-gray-500 text-center">Generated with Veo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VeoGen;