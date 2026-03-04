import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2,
  CheckSquare, 
  Grid, 
  Type, 
  Save,
  Layout,
  FileText,
  Copy,
  X,
  Download,
  Upload,
  Droplet,
  ChevronRight,
  MinusCircle,
  Link as LinkIcon,
  Image as ImageIcon,
  Type as FontIcon
} from 'lucide-react';

/**
 * FILE: App.jsx
 * LOCATION: src/App.jsx
 * INSTRUCTION: This is the main component file for your GitHub repository.
 */

const App = () => {
  const [blocks, setBlocks] = useState([]);
  const [globalNote, setGlobalNote] = useState('');
  const [brandName, setBrandName] = useState('My Workspace');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedData = localStorage.getItem('xonfox_vault_v11_neon');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setBlocks(parsed.blocks || []);
      setGlobalNote(parsed.globalNote || '');
      setBrandName(parsed.brandName || 'My Workspace');
    }
  }, []);

  const handleAutoHeight = (e) => {
    e.target.style.height = 'inherit';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const saveData = () => {
    const dataToSave = { blocks, globalNote, brandName };
    localStorage.setItem('xonfox_vault_v11_neon', JSON.stringify(dataToSave));
    alert("Saved Successfully!");
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ blocks, globalNote, brandName }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${brandName.replace(/\s+/g, '_')}_data.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (event) => {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0], "UTF-8");
    fileReader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        setBlocks(json.blocks || []);
        setGlobalNote(json.globalNote || '');
        setBrandName(json.brandName || 'Imported Workspace');
      } catch (err) {
        alert("Invalid file format!");
      }
    };
  };

  const addBlock = (type) => {
    const baseBlock = {
      id: Date.now().toString(),
      type,
      title: type.toUpperCase() + ' SECTION',
    };

    let specificData = {};
    switch (type) {
      case 'text': specificData = { content: '' }; break;
      case 'checklist': specificData = { items: [{ id: Date.now(), text: '', completed: false }] }; break;
      case 'table': specificData = { rows: [['COL 1', 'COL 2'], ['', '']] }; break;
      case 'color': specificData = { swatches: [{ id: 's1', hex: '#FF3F7F', label: 'Primary' }] }; break;
      case 'font': specificData = { fonts: [{ id: 'f1', family: 'Inter', usage: 'Headings', weight: 'Bold' }] }; break;
      case 'link': specificData = { links: [{ id: 'l1', url: 'https://', platform: 'Website' }] }; break;
      case 'logo': specificData = { images: [] }; break;
      default: break;
    }

    setBlocks([...blocks, { ...baseBlock, ...specificData }]);
  };

  const deleteBlock = (id) => {
    if(window.confirm("Delete this section permanently?")) {
      setBlocks(blocks.filter(b => b.id !== id));
    }
  };

  const updateBlock = (id, updates) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      alert("Copied!");
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : 'rgb(0,0,0)';
  };

  return (
    <div className="min-h-screen bg-[#450693] text-[#000000] p-4 pb-44 font-sans selection:bg-[#FFC400] selection:text-black">
      
      {/* HEADER */}
      <header className="max-w-4xl mx-auto mb-10 bg-[#FFFFFF] p-6 rounded-2xl border-4 border-[#000000] shadow-[8px_8px_0px_0px_#111827]">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="bg-[#8C00FF] p-3 rounded-xl text-white border-2 border-black shadow-[3px_3px_0px_0px_#000000]">
              <Layout size={24} strokeWidth={3} />
            </div>
            <input 
              className="bg-transparent border-none outline-none text-2xl font-black tracking-tighter text-[#450693] w-full focus:ring-0 placeholder:text-[#D1D5DB]"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="WORKSPACE NAME"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-[#F3F4F6] p-2 rounded-xl border-2 border-black">
            <button onClick={() => fileInputRef.current.click()} className="p-2 hover:bg-white rounded-lg border-2 border-transparent hover:border-black text-[#450693] transition-all" title="Import">
              <Upload size={20} />
              <input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" />
            </button>
            <button onClick={exportData} className="p-2 hover:bg-white rounded-lg border-2 border-transparent hover:border-black text-[#450693] transition-all" title="Export">
              <Download size={20} />
            </button>
            <div className="w-[2px] h-6 bg-[#D1D5DB] mx-1"></div>
            <button 
              onClick={saveData}
              className="bg-[#FF3F7F] hover:bg-[#ff1f69] text-white px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_#000000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
            >
              SAVE DATA
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-12">
        
        {/* MAIN CANVAS */}
        <section className="bg-[#111827] rounded-3xl p-8 border-4 border-[#000000] shadow-[15px_15px_0px_0px_#8C00FF]">
          <div className="flex items-center justify-between mb-6 border-b-2 border-[#1F2937] pb-4">
            <div className="flex items-center gap-2 text-[#FFC400] font-black text-xs uppercase tracking-[0.2em]">
              <FileText size={18} strokeWidth={3} />
              <span>Project Vision</span>
            </div>
          </div>
          <textarea 
            className="w-full min-h-[160px] bg-transparent text-xl leading-relaxed outline-none resize-none placeholder:text-[#374151] text-[#F9FAFB] font-bold overflow-hidden"
            placeholder="Describe your brand strategy..."
            value={globalNote}
            onInput={handleAutoHeight}
            onChange={(e) => setGlobalNote(e.target.value)}
          />
        </section>

        {/* CONTENT BLOCKS */}
        <div className="grid grid-cols-1 gap-12">
          {blocks.map((block) => (
            <div key={block.id} className="bg-[#FFFFFF] rounded-2xl p-8 border-4 border-[#000000] relative shadow-[10px_10px_0px_0px_#111827]">
              <button onClick={() => deleteBlock(block.id)} className="absolute top-6 right-6 text-[#D1D5DB] hover:text-[#FF3F7F] transition-colors">
                <Trash2 size={22} />
              </button>

              <div className="flex items-center gap-2 mb-8 border-b-2 border-[#F3F4F6] pb-2">
                <ChevronRight size={18} className="text-[#8C00FF]" strokeWidth={4} />
                <input 
                  className="bg-transparent text-sm font-black w-full outline-none text-[#450693] uppercase tracking-[0.3em]"
                  value={block.title}
                  onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                />
              </div>

              {/* NOTE BLOCK */}
              {block.type === 'text' && (
                <textarea 
                  className="w-full min-h-[100px] bg-[#F9FAFB] p-5 rounded-xl outline-none text-[#111827] text-lg font-bold border-2 border-[#E5E7EB] focus:border-[#8C00FF]"
                  value={block.content}
                  onInput={handleAutoHeight}
                  onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                />
              )}

              {/* CHECKLIST */}
              {block.type === 'checklist' && (
                <div className="space-y-4">
                  {block.items.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-5">
                      <input 
                        type="checkbox" 
                        checked={item.completed}
                        onChange={(e) => {
                          const newItems = [...block.items];
                          newItems[idx].completed = e.target.checked;
                          updateBlock(block.id, { items: newItems });
                        }}
                        className="w-7 h-7 rounded-lg border-4 border-black text-[#FF3F7F] focus:ring-0 cursor-pointer"
                      />
                      <input 
                        className={`flex-1 bg-transparent outline-none py-1 text-lg font-black ${item.completed ? 'line-through text-[#D1D5DB]' : 'text-[#450693]'}`}
                        value={item.text}
                        onChange={(e) => {
                          const newItems = [...block.items];
                          newItems[idx].text = e.target.value;
                          updateBlock(block.id, { items: newItems });
                        }}
                      />
                    </div>
                  ))}
                  <button onClick={() => {
                    const newItem = { id: Date.now(), text: '', completed: false };
                    updateBlock(block.id, { items: [...block.items, newItem] });
                  }} className="mt-4 px-4 py-2 bg-black text-white text-[10px] font-black rounded-lg">ADD ENTRY</button>
                </div>
              )}

              {/* TYPOGRAPHY TOOL */}
              {block.type === 'font' && (
                <div className="space-y-4">
                  {block.fonts.map((f, fIdx) => (
                    <div key={f.id} className="flex flex-wrap items-center gap-4 bg-[#F9FAFB] p-4 rounded-xl border-2 border-black">
                      <input className="flex-1 min-w-[150px] font-black uppercase text-sm outline-none bg-transparent" value={f.family} placeholder="FAMILY" onChange={(e) => {
                        const n = [...block.fonts]; n[fIdx].family = e.target.value; updateBlock(block.id, { fonts: n });
                      }} />
                      <input className="w-24 text-[10px] font-bold outline-none bg-white border border-black p-1" value={f.weight} placeholder="WEIGHT" onChange={(e) => {
                        const n = [...block.fonts]; n[fIdx].weight = e.target.value; updateBlock(block.id, { fonts: n });
                      }} />
                      <input className="flex-1 text-[10px] font-bold outline-none bg-white border border-black p-1" value={f.usage} placeholder="USAGE" onChange={(e) => {
                        const n = [...block.fonts]; n[fIdx].usage = e.target.value; updateBlock(block.id, { fonts: n });
                      }} />
                      <button onClick={() => {
                        const n = block.fonts.filter(x => x.id !== f.id); updateBlock(block.id, { fonts: n });
                      }} className="text-red-500"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  <button onClick={() => updateBlock(block.id, { fonts: [...block.fonts, { id: Date.now(), family: '', weight: '', usage: '' }] })} className="px-4 py-2 bg-[#8C00FF] text-white text-[10px] font-black rounded-lg">ADD FONT</button>
                </div>
              )}

              {/* LINK HUB */}
              {block.type === 'link' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {block.links.map((l, lIdx) => (
                    <div key={l.id} className="flex items-center gap-3 bg-[#F9FAFB] p-3 rounded-xl border-2 border-black">
                      <LinkIcon size={16} className="text-[#8C00FF]" />
                      <input className="flex-1 text-[10px] font-black outline-none bg-transparent" value={l.url} onChange={(e) => {
                        const n = [...block.links]; n[lIdx].url = e.target.value; updateBlock(block.id, { links: n });
                      }} />
                      <button onClick={() => window.open(l.url, '_blank')} className="p-1 hover:text-[#8C00FF]"><ChevronRight size={16}/></button>
                    </div>
                  ))}
                  <button onClick={() => updateBlock(block.id, { links: [...block.links, { id: Date.now(), url: 'https://', platform: '' }] })} className="border-2 border-dashed border-gray-300 p-3 rounded-xl text-gray-400 text-[10px] font-black">ADD LINK</button>
                </div>
              )}

              {/* LOGO VAULT */}
              {block.type === 'logo' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {block.images.map((img, iIdx) => (
                    <div key={iIdx} className="aspect-square bg-[#F9FAFB] border-2 border-black rounded-xl relative group">
                      <img src={img} className="w-full h-full object-contain p-2" />
                      <button onClick={() => {
                         const n = block.images.filter((_, i) => i !== iIdx); updateBlock(block.id, { images: n });
                      }} className="absolute top-1 right-1 bg-black text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                    </div>
                  ))}
                  <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                    <ImageIcon size={24} className="text-gray-300" />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => updateBlock(block.id, { images: [...block.images, reader.result] });
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
              )}

              {/* TABLE GRID */}
              {block.type === 'table' && (
                <div className="overflow-x-auto border-4 border-black rounded-xl">
                   <table className="w-full text-sm border-collapse table-fixed">
                    <thead>
                       <tr className="border-b-4 border-black bg-[#F3F4F6]">
                          {block.rows[0].map((cell, cIdx) => (
                            <th key={cIdx} className="p-2 border-r-2 border-black last:border-r-0 relative">
                               <input className="w-full bg-transparent text-[9px] font-black text-center outline-none" value={cell} onChange={(e) => {
                                 const n = [...block.rows]; n[0][cIdx] = e.target.value; updateBlock(block.id, { rows: n });
                               }} />
                            </th>
                          ))}
                          <th className="w-10"></th>
                       </tr>
                    </thead>
                    <tbody>
                      {block.rows.slice(1).map((row, rIdx) => (
                        <tr key={rIdx} className="border-b-2 border-black last:border-b-0">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-4 border-r-2 border-black last:border-r-0">
                              <input className="w-full outline-none font-bold" value={cell} onChange={(e) => {
                                const n = [...block.rows]; n[rIdx+1][cIdx] = e.target.value; updateBlock(block.id, { rows: n });
                              }} />
                            </td>
                          ))}
                          <td className="w-10 text-center border-l-2 border-black bg-[#F9FAFB]">
                            <button onClick={() => {
                              const n = block.rows.filter((_, i) => i !== rIdx+1); updateBlock(block.id, { rows: n });
                            }} className="text-red-500"><X size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex border-t-4 border-black divide-x-2 divide-black">
                    <button onClick={() => updateBlock(block.id, { rows: [...block.rows, new Array(block.rows[0].length).fill('')] })} className="flex-1 py-3 text-[9px] font-black uppercase hover:bg-gray-100">Add Row</button>
                    <button onClick={() => updateBlock(block.id, { rows: block.rows.map(r => [...r, '']) })} className="flex-1 py-3 text-[9px] font-black uppercase hover:bg-gray-100">Add Col</button>
                    <div className="w-10 bg-gray-100"></div>
                  </div>
                </div>
              )}

              {/* COLOR PALETTE */}
              {block.type === 'color' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {block.swatches.map((swatch, sIdx) => (
                    <div key={swatch.id} className="bg-[#F9FAFB] p-5 rounded-xl border-4 border-black relative group">
                      <div className="w-full h-16 rounded-lg border-2 border-black mb-3" style={{ backgroundColor: swatch.hex }}></div>
                      <input className="w-full text-[10px] font-black mb-1 outline-none uppercase" value={swatch.label} onChange={(e) => {
                        const n = [...block.swatches]; n[sIdx].label = e.target.value; updateBlock(block.id, { swatches: n });
                      }} />
                      <div className="flex items-center justify-between">
                        <input type="color" className="w-6 h-6 border-0 cursor-pointer" value={swatch.hex} onChange={(e) => {
                          const n = [...block.swatches]; n[sIdx].hex = e.target.value; updateBlock(block.id, { swatches: n });
                        }} />
                        <span className="text-[10px] font-mono">{swatch.hex.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => updateBlock(block.id, { swatches: [...block.swatches, { id: Date.now(), hex: '#000000', label: 'NEW COLOR' }] })} className="border-4 border-dashed rounded-xl flex items-center justify-center text-gray-300"><Plus size={32}/></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* FLOATING CONTROL DOCK - NEW TOOLS ADDED */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#000000] px-6 py-4 rounded-2xl flex items-center gap-8 shadow-2xl z-50 border-b-4 border-[#FF3F7F]">
        <button onClick={() => addBlock('text')} className="text-[#D1D5DB] hover:text-[#FF3F7F] flex flex-col items-center gap-1 group">
          <Type size={20} />
          <span className="text-[7px] font-black uppercase group-hover:opacity-100 opacity-0 transition-opacity">Note</span>
        </button>
        <button onClick={() => addBlock('checklist')} className="text-[#D1D5DB] hover:text-[#8C00FF] flex flex-col items-center gap-1 group">
          <CheckSquare size={20} />
          <span className="text-[7px] font-black uppercase group-hover:opacity-100 opacity-0 transition-opacity">Task</span>
        </button>
        <button onClick={() => addBlock('color')} className="text-[#D1D5DB] hover:text-[#FFC400] flex flex-col items-center gap-1 group">
          <Droplet size={20} />
          <span className="text-[7px] font-black uppercase group-hover:opacity-100 opacity-0 transition-opacity">Color</span>
        </button>
        <button onClick={() => addBlock('font')} className="text-[#D1D5DB] hover:text-[#8C00FF] flex flex-col items-center gap-1 group">
          <FontIcon size={20} />
          <span className="text-[7px] font-black uppercase group-hover:opacity-100 opacity-0 transition-opacity">Font</span>
        </button>
        <button onClick={() => addBlock('logo')} className="text-[#D1D5DB] hover:text-[#FF3F7F] flex flex-col items-center gap-1 group">
          <ImageIcon size={20} />
          <span className="text-[7px] font-black uppercase group-hover:opacity-100 opacity-0 transition-opacity">Logo</span>
        </button>
        <button onClick={() => addBlock('link')} className="text-[#D1D5DB] hover:text-[#FFC400] flex flex-col items-center gap-1 group">
          <LinkIcon size={20} />
          <span className="text-[7px] font-black uppercase group-hover:opacity-100 opacity-0 transition-opacity">Link</span>
        </button>
        <button onClick={() => addBlock('table')} className="text-[#D1D5DB] hover:text-[#8C00FF] flex flex-col items-center gap-1 group">
          <Grid size={20} />
          <span className="text-[7px] font-black uppercase group-hover:opacity-100 opacity-0 transition-opacity">Grid</span>
        </button>
      </div>
    </div>
  );
};

export default App;