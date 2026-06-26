import React, { useState, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Node, 
  Edge, 
  ReactFlowProvider, 
  useReactFlow, 
  useNodesState, 
  useEdgesState 
} from 'reactflow';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import 'reactflow/dist/style.css';

// Custom Node Renderer Component to show beautiful micro-frontends inside the infinite canvas
const CustomCanvasNode = ({ data }: any) => (
  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-200 min-w-[220px]">
    <div className="border-b border-slate-800 pb-2 mb-2">
      <p className="text-xs font-bold tracking-wider text-emerald-400 uppercase">{data.label}</p>
    </div>
    <p className="text-sm text-slate-400 font-medium whitespace-pre-wrap">{data.content}</p>
  </div>
);

const nodeTypes = {
  input: CustomCanvasNode,
  default: CustomCanvasNode,
};

function EphemeraCanvas() {
  const [prompt, setPrompt] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const { screenToFlowPosition } = useReactFlow();

  const triggerSpatialParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("prompt", prompt);

      const response = await fetch("http://localhost:8000/api/parse", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      
      setNodes(data.nodes);
      setEdges(data.edges);
    } catch (err) {
      console.error("Canvas rendering execution interrupted:", err);
    } finally {
      setLoading(false);
    }
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();

    if (reactFlowWrapper.current) {
      const files = Array.from(event.dataTransfer.files);
      const newNodes: Node[] = [];

      if (files.length > 0) {
        // Handle multiple file drops (any datatype)
        files.forEach((file, index) => {
          const position = screenToFlowPosition({
            x: event.clientX + index * 30,
            y: event.clientY + index * 30,
          });

          const formattedSize = file.size > 1024 * 1024 
            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
            : `${(file.size / 1024).toFixed(2)} KB`;

          newNodes.push({
            id: `node-file-${Date.now()}-${index}`,
            type: 'default',
            position,
            data: { 
              label: `Dropped File`, 
              content: `Name: ${file.name}\nSize: ${formattedSize}\nType: ${file.type || 'unknown'}` 
            },
          });
        });
      } else {
        // Handle dropping text / URLs or other data types
        const types = event.dataTransfer.types;
        let index = 0;
        types.forEach((type) => {
          const data = event.dataTransfer.getData(type);
          if (data && data.trim()) {
            const position = screenToFlowPosition({
              x: event.clientX + index * 30,
              y: event.clientY + index * 30,
            });

            let contentStr = data;
            let titleStr = `Dropped ${type}`;
            if (type === 'text/plain' && data.startsWith('http')) {
              titleStr = 'Dropped Link';
            }

            newNodes.push({
              id: `node-data-${Date.now()}-${index}`,
              type: 'default',
              position,
              data: { 
                label: titleStr, 
                content: contentStr.length > 200 ? contentStr.substring(0, 200) + '...' : contentStr 
              },
            });
            index++;
          }
        });
      }

      if (newNodes.length > 0) {
        setNodes((nds) => nds.concat(newNodes));
      }
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans">
      
      {/* Structural Control Sidebar */}
      <div className="w-80 border-r border-slate-900 bg-slate-900/40 p-6 flex flex-col gap-6 backdrop-blur-md z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-emerald-400" size={18} />
            <h1 className="text-lg font-bold text-white tracking-tight">Ephemera</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">Infinite Spatial Orchestrator</p>
        </div>

        <form onSubmit={triggerSpatialParse} className="flex flex-col gap-3">
          <label className="text-xs text-slate-400 font-bold tracking-wider uppercase">User Intent Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Deploy Acme updates, assign tasks to Anirudh..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 text-slate-200 resize-none h-28"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/10"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            Assemble Workspace
          </button>
        </form>
      </div>

      {/* Infinite Canvas Main Viewport */}
      <div 
        ref={reactFlowWrapper}
        className="flex-1 h-full relative bg-slate-950"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {nodes.length === 0 && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10 pointer-events-none">
            <div className="p-4 rounded-full bg-slate-900/50 border border-slate-800 text-slate-600 mb-4">
              <Sparkles size={32} />
            </div>
            <h3 className="text-slate-400 font-semibold mb-1">Workspace Currently Dormant</h3>
            <p className="text-xs text-slate-600 max-w-xs">Submit an intent or drop files/data here to dynamically synthesize layout cards.</p>
          </div>
        )}

        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes} 
          fitView
        >
          <Background color="#334155" gap={16} size={1} />
          <Controls className="bg-slate-900 border-slate-800 text-slate-200 fill-slate-200" />
          <MiniMap className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden" maskColor="rgba(15, 23, 42, 0.6)" />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <EphemeraCanvas />
    </ReactFlowProvider>
  );
}
