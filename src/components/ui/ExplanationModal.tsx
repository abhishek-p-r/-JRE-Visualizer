import { useEngineStore } from '../../store/engineStore';
import { X, Info, Lightbulb, BookOpen, Cpu, Activity } from 'lucide-react';

export const ExplanationModal = () => {
  const { explanation, setExplanation, theme } = useEngineStore();
  const dark = theme === 'dark';

  if (!explanation) return null;

  const getIcon = () => {
    switch (explanation.type) {
      case 'stack': return <Cpu className="text-blue-400" size={24} />;
      case 'heap': return <Lightbulb className="text-pink-400" size={24} />;
      case 'metaspace': return <BookOpen className="text-purple-400" size={24} />;
      default: return <Info className="text-neonBlue" size={24} />;
    }
  };

  const getDetails = () => {
    switch (explanation.type) {
      case 'stack': return {
        desc: "The Stack is where method execution happens. Each thread has its own Stack. When a method is called, a new 'Frame' is pushed onto the stack. It stores local variables and partial results.",
        capacity: "Capacity is limited by the -Xss JVM parameter. Typically 1MB per thread. Exceeding this causes StackOverflowError.",
        tip: "LIFO (Last-In-First-Out) architecture ensures lightning-fast allocation/deallocation."
      };
      case 'heap': return {
        desc: "The Heap is the 'Global Warehouse'. All class instances and arrays are stored here. It is shared among all threads and managed by the Garbage Collector.",
        capacity: "Managed via -Xms (initial) and -Xmx (max). When full, the JVM triggers GC to reclaim space.",
        tip: "This is where 'Objects' live. References from the Stack point to these objects."
      };
      case 'metaspace': return {
        desc: "Metaspace stores Class Metadata: method data, constant pool, and static variables. It replaced the old 'PermGen' and grows dynamically using native memory.",
        capacity: "Limited by MaxMetaspaceSize. If not set, it can consume all available system RAM.",
        tip: "Blueprint storage for every class loaded into the JVM."
      };
      default: return {
        desc: explanation.content,
        capacity: "Managed dynamically by the JRE Environment.",
        tip: "Integral part of the Java Runtime execution engine."
      };
    }
  };

  const details = getDetails();

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 ${dark ? 'bg-[#020617]' : 'bg-[#f8fafc]'} animate-fade-in`} style={{ zIndex: 999999 }}>
      <div 
        className={`relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up ${
          dark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'
        }`}
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-neonBlue via-purple-500 to-neonPink" />
        
        <div className="p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
                {getIcon()}
              </div>
              <div>
                <h2 className={`text-2xl font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                  {explanation.title}
                </h2>
                <div className="text-[10px] font-black text-neonBlue tracking-widest uppercase opacity-60">Architecture_Analysis</div>
              </div>
            </div>
            <button 
              onClick={() => setExplanation(null)}
              className={`p-2 rounded-full transition-colors ${
                dark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div className={`text-lg leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
              {details.desc}
            </div>

            <div className={`p-6 rounded-2xl ${dark ? 'bg-blue-500/5 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-blue-400" />
                <span className="text-xs font-black uppercase tracking-wider text-blue-400">Capacity & Limits</span>
              </div>
              <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-700'}`}>{details.capacity}</p>
            </div>

            <div className={`p-6 rounded-2xl ${dark ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={14} className="text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Expert Insight</span>
              </div>
              <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-700'}`}>{details.tip}</p>
            </div>
          </div>

          <button 
            onClick={() => setExplanation(null)}
            className="w-full mt-10 py-5 rounded-2xl bg-gradient-to-r from-neonBlue to-purple-600 text-white font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)]"
          >
            Acknowledge & Resume
          </button>
        </div>
      </div>
    </div>
  );
};
