import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useEngineStore, selectCurrentState } from '../../store/engineStore';
import { parseAndGenerateHistory, defaultCode } from '../../parser/javaEngine';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Moon, Sun, Box, Layout, PlayCircle, Info, Lightbulb } from 'lucide-react';

export const CodePanel = () => {
  const { 
    history, 
    currentIndex, 
    isPlaying, 
    speed, 
    theme, 
    viewMode, 
    toggleTheme, 
    toggleViewMode, 
    togglePlay, 
    stepForward, 
    stepBack, 
    reset, 
    setHistory, 
    setSpeed,
    setExplanation,
    setIndex
  } = useEngineStore();
  
  const currentState = useEngineStore(selectCurrentState);
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Inspector Resizing
  const [inspectorHeight, setInspectorHeight] = useState(300);
  const [isResizingInspector, setIsResizingInspector] = useState(false);
  const codePanelRef = useRef<HTMLDivElement>(null);
  const lastY = useRef<number>(0);


  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        stepForward();
      }, 2000 / speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, stepForward]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingInspector || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newHeight = rect.bottom - e.clientY;
      setInspectorHeight(Math.max(100, Math.min(newHeight, rect.height * 0.9)));
    };

    const handleMouseUp = () => {
      setIsResizingInspector(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizingInspector) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingInspector]);

  const handleInspectorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingInspector(true);
    lastY.current = e.clientY;
  };

  useEffect(() => {
    if (editorRef.current && currentState?.currentLine) {
      const editor = editorRef.current;
      const monaco = window.monaco;

      if (monaco) {
        editor.deltaDecorations([], [
          {
            range: new monaco.Range(currentState.currentLine, 1, currentState.currentLine, 1),
            options: {
              isWholeLine: true,
              className: theme === 'dark' ? 'bg-neonBlue/20' : 'bg-blue-200',
              glyphMarginClassName: 'bg-neonBlue'
            }
          }
        ]);
        editor.revealLineInCenter(currentState.currentLine);
      }
    }
  }, [currentIndex, currentState?.currentLine, theme]);

  useEffect(() => {
    const handleReset = () => {
      if (editorRef.current) {
        editorRef.current.setSelections([{ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }]);
        editorRef.current.revealLine(1);
      }
    };
    window.addEventListener('jvm-reset', handleReset);
    return () => window.removeEventListener('jvm-reset', handleReset);
  }, []);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    window.monaco = monaco;
    
    editor.onMouseDown((e: any) => {
      const targetLine = e.target.position?.lineNumber;
      if (targetLine) {
        const stepIndex = history.findIndex(s => s.currentLine === targetLine);
        if (stepIndex !== -1) {
          setIndex(stepIndex);
        }
      }
    });
  };

  const handleRun = () => {
    if (editorRef.current) {
      const code = editorRef.current.getValue();
      localStorage.setItem('jvm_code', code);
      const newHistory = parseAndGenerateHistory(code);
      setHistory(newHistory);
      reset();
    }
  };

  const showExplanation = () => {
    setExplanation({
      title: "How Code Execution Works",
      type: "general",
      content: "Java code is compiled into bytecode (.class files) which the JVM executes.\n\nEach line of code corresponds to specific JVM instructions. When you press PLAY, the simulation steps through these instructions, visualizing how they affect the Call Stack (methods), the Heap (objects), and Metaspace (classes)."
    });
  };

  return (
    <div ref={containerRef} className={`flex flex-col h-full w-full border-r ${theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200 shadow-xl'}`}>
      
      {/* Top Toolbar */}
      <div className={`flex items-center justify-between p-3 border-b z-10 ${theme === 'dark' ? 'border-white/10 glass' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center space-x-1">
          <button onClick={() => stepBack()} disabled={currentIndex === 0} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-600'} disabled:opacity-30`}>
            <SkipBack size={18} />
          </button>
          <button onClick={() => togglePlay()} className="p-2.5 rounded-xl bg-neonBlue/20 text-neonBlue hover:bg-neonBlue/30 transition-all shadow-lg shadow-neonBlue/10">
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <button onClick={() => stepForward()} disabled={currentIndex === history.length - 1} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-600'} disabled:opacity-30`}>
            <SkipForward size={18} />
          </button>
          <button onClick={() => { reset(); handleRun(); }} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}>
            <RotateCcw size={18} />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className={`bg-transparent border rounded-lg p-1.5 text-xs font-bold outline-none transition-all ${theme === 'dark' ? 'border-white/10 text-gray-300' : 'border-gray-300 text-gray-700'}`}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1.0x</option>
            <option value={2}>2.0x</option>
            <option value={4}>4.0x</option>
          </select>
          <button onClick={() => toggleTheme()} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-grow relative group">
        <Editor
          height="100%"
          defaultLanguage="java"
          defaultValue={localStorage.getItem('jvm_code') || defaultCode}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          loading={
            <div className={`flex flex-col items-center justify-center h-full w-full ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>
              <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
              <div className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                Preparing Editor
              </div>
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            readOnly: isPlaying,
            glyphMargin: true,
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            fontFamily: "'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
          }}
          onMount={handleEditorDidMount}
        />
      </div>

      {/* Enhanced Inspector HUD (Resizable) */}
      <div 
        style={{ height: inspectorHeight }}
        className={`flex flex-col border-t relative ${theme === 'dark' ? 'bg-gray-900/90 border-white/10' : 'bg-gray-50 border-gray-200'} ${isResizingInspector ? '' : 'transition-[height] duration-300 ease-out'}`}
      >
        {/* Vertical Resize Handle */}
        <div 
          onMouseDown={handleInspectorMouseDown}
          className="absolute top-0 left-0 w-full h-14 -translate-y-7 cursor-ns-resize z-[1000] flex items-center justify-center group pointer-events-auto"
        >
          <div className={`w-24 h-1.5 rounded-full transition-all duration-300 ${
            isResizingInspector 
              ? 'bg-blue-500 w-48 scale-x-110 shadow-[0_0_20px_rgba(59,130,246,0.8)]' 
              : theme === 'dark' 
                ? 'bg-white/20 group-hover:bg-neonBlue group-hover:w-32' 
                : 'bg-black/20 group-hover:bg-blue-500 group-hover:w-32'
          }`} />
          {!isResizingInspector && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-32 h-8 rounded-full bg-blue-500/10 animate-pulse" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className={`text-[10px] uppercase tracking-[0.2em] font-black ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            Execution Inspector
          </h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={showExplanation}
              className={`flex items-center gap-1.5 text-[10px] font-bold uppercase transition-all px-2 py-1 rounded-md ${
                theme === 'dark' ? 'text-neonBlue bg-neonBlue/10 hover:bg-neonBlue/20' : 'text-blue-600 bg-blue-100 hover:bg-blue-200'
              }`}
            >
              <Info size={12} />
              How it works
            </button>
            <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border animate-pulse-glow ${
              Object.keys(currentState?.heap ?? {}).length > 15 ? 'text-red-400 bg-red-400/10 border-red-400/20' : 
              Object.keys(currentState?.heap ?? {}).length > 8 ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
              'text-green-400 bg-green-400/10 border-green-400/20'
            }`}>
              {Object.keys(currentState?.heap ?? {}).length > 15 ? '⚠ High Load' : 
               Object.keys(currentState?.heap ?? {}).length > 8 ? '⚡ Normal' : '✓ Optimal'}
            </div>
          </div>
        </div>
        
        <div className={`flex-grow rounded-2xl p-4 border overflow-y-auto custom-scrollbar ${
          theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-gray-100 shadow-inner'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`mt-1 w-2 h-2 rounded-full animate-pulse ${theme === 'dark' ? 'bg-neonBlue shadow-[0_0_8px_rgba(0,243,255,0.8)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'}`} />
            <div className="flex-grow">
              <p className={`text-sm leading-relaxed font-medium mb-3 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                <span className="font-black text-neonBlue mr-2 opacity-80">Step {currentState?.step ?? 0}:</span>
                {currentState?.description || 'Ready to visualize. Load a class or run the code.'}
              </p>
              
              {currentState?.bytecode && (
                <div className={`mt-2 p-3 rounded-lg border font-mono text-[11px] leading-relaxed whitespace-pre-wrap shadow-inner ${theme === 'dark' ? 'bg-[#020617] border-white/5 text-emerald-400' : 'bg-gray-900 border-gray-800 text-emerald-400'}`}>
                  <div className={`text-[8px] font-sans font-bold uppercase tracking-widest mb-1.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    Live Bytecode Translator
                  </div>
                  {currentState.bytecode}
                </div>
              )}
              
              {currentState && (
                <div className="mt-4 flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-gray-500 font-bold">Stack Segment</span>
                      <span className={`text-xs font-mono ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>{currentState.threads[0]?.frames.length ?? 0} Active Frames</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-gray-500 font-bold">Heap Segment</span>
                      <span className={`text-xs font-mono ${theme === 'dark' ? 'text-pink-300' : 'text-pink-600'}`}>{Object.keys(currentState.heap).length} Living Objects</span>
                    </div>
                  </div>
                  
                  <div className={`p-2.5 rounded-xl text-[10px] leading-relaxed border ${
                    theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1 font-bold uppercase tracking-wider">
                      <Lightbulb size={12} />
                      JVM Pro Tip
                    </div>
                    {currentState.threads[0]?.frames.length > 5 ? "Deep stack detected. Watch for potential StackOverflowError if recursion continues." : 
                     Object.keys(currentState.heap).length > 10 ? "Heap density increasing. The Garbage Collector will prioritize objects with no active references." :
                     "Method frames are short-lived. Objects in the Heap survive until all references from the Stack are cleared."}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

declare global {
  interface Window {
    monaco: any;
  }
}
