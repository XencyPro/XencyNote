import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckSquare, ChevronRight, Copy, Download, Droplet, FileText, Grid,
  Image as ImageIcon, Layout, Link as LinkIcon, LogOut, Plus, Save,
  Trash2, Type, Upload, X
} from 'lucide-react';
import { supabase } from './lib/supabase';

const STORAGE_KEY = 'xonfox_vault_v11_neon';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const makeId = () => crypto.randomUUID();

const createBlock = (type) => {
  const id = makeId();
  const base = { id, type, title: `${type.toUpperCase()} SECTION` };
  const data = {
    text: { content: '' },
    checklist: { items: [{ id: makeId(), text: '', completed: false }] },
    table: { rows: [['COL 1', 'COL 2'], ['', '']] },
    color: { swatches: [{ id: makeId(), hex: '#FF3F7F', label: 'Primary' }] },
    font: { fonts: [{ id: makeId(), family: 'Inter', usage: 'Headings', weight: 'Bold' }] },
    link: { links: [{ id: makeId(), url: 'https://', platform: 'Website' }] },
    logo: { images: [] },
  }[type] || {};
  return { ...base, ...data };
};

const normalizeBlock = (row) => ({
  id: UUID_RE.test(row.id) ? row.id : makeId(),
  type: row.type,
  title: row.title || `${row.type?.toUpperCase() || 'TEXT'} SECTION`,
  ...(row.data || {}),
});

const getLegacyData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const AuthScreen = ({ onAuth }) => {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        if (!username.trim()) throw new Error('Username is required.');
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { username: username.trim(), display_name: username.trim() } },
        });
        if (error) throw error;
        if (data.session) onAuth(data.session);
        else setMessage('Account created. Check your email if confirmation is enabled.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        onAuth(data.session);
      }
    } catch (error) {
      setMessage(error.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#450693] text-black p-4 flex items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border-4 border-black shadow-[12px_12px_0_0_#111827] p-7 sm:p-9">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-[#8C00FF] p-3 rounded-xl text-white border-2 border-black shadow-[3px_3px_0_0_#000]">
            <Layout size={28} strokeWidth={3} />
          </div>
          <div>
            <div className="text-xs font-black tracking-[0.25em] text-[#8C00FF]">XENCYNOTE</div>
            <h1 className="text-3xl font-black tracking-tight">Brand Vault</h1>
          </div>
        </div>
        <p className="text-sm font-bold text-gray-500 mb-7">Your private brand workspace, synced to Supabase.</p>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && (
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="USERNAME" className="w-full p-4 rounded-xl border-2 border-black outline-none font-black text-sm focus:border-[#8C00FF]" />
          )}
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="EMAIL" className="w-full p-4 rounded-xl border-2 border-black outline-none font-black text-sm focus:border-[#8C00FF]" />
          <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="PASSWORD" className="w-full p-4 rounded-xl border-2 border-black outline-none font-black text-sm focus:border-[#8C00FF]" />
          <button disabled={busy} className="w-full bg-[#FF3F7F] disabled:opacity-60 text-white p-4 rounded-xl border-2 border-black shadow-[5px_5px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none font-black text-xs tracking-[0.2em]">
            {busy ? 'PLEASE WAIT...' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>
        {message && <div className="mt-5 p-3 rounded-xl bg-[#FFF4B8] border-2 border-black text-xs font-black">{message}</div>}
        <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }} className="mt-6 text-xs font-black underline underline-offset-4">
          {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
};

const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [globalNote, setGlobalNote] = useState('');
  const [brandName, setBrandName] = useState('My Workspace');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    loadWorkspace(session.user.id);
  }, [session]);

  const loadWorkspace = async (userId) => {
    setLoading(true);
    setStatus('');
    try {
      const [{ data: profileRow, error: profileError }, { data: workspaceRow, error: workspaceError }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('workspaces').select('*').eq('owner_id', userId).order('created_at').limit(1).maybeSingle(),
      ]);
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      if (workspaceError) throw workspaceError;

      setProfile(profileRow);
      if (!workspaceRow) {
        const { data: created, error } = await supabase.from('workspaces').insert({ owner_id: userId }).select().single();
        if (error) throw error;
        setWorkspace(created);
        setBrandName(created.name || 'My Workspace');
        setGlobalNote(created.vision || '');
        setBlocks([]);
      } else {
        setWorkspace(workspaceRow);
        setBrandName(workspaceRow.name || 'My Workspace');
        setGlobalNote(workspaceRow.vision || '');
        const { data: sectionRows, error: sectionError } = await supabase.from('sections').select('*').eq('workspace_id', workspaceRow.id).order('position');
        if (sectionError) throw sectionError;
        setBlocks((sectionRows || []).map(normalizeBlock));
      }

      if (getLegacyData()) setStatus('Local draft found. Use Import if you want to bring it into this account.');
    } catch (error) {
      setStatus(error.message || 'Could not load workspace.');
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    if (!session?.user || !workspace) return;
    setSaving(true);
    setStatus('Saving...');
    try {
      const { error: workspaceError } = await supabase.from('workspaces').update({ name: brandName || 'My Workspace', vision: globalNote }).eq('id', workspace.id).eq('owner_id', session.user.id);
      if (workspaceError) throw workspaceError;

      const normalized = blocks.map((block, index) => ({ ...block, id: UUID_RE.test(block.id) ? block.id : makeId(), position: index }));
      setBlocks(normalized);
      const { data: existingRows, error: existingError } = await supabase.from('sections').select('id').eq('workspace_id', workspace.id);
      if (existingError) throw existingError;
      const existingIds = new Set((existingRows || []).map(row => row.id));
      const currentIds = new Set(normalized.map(block => block.id));
      const staleIds = [...existingIds].filter(id => !currentIds.has(id));
      if (staleIds.length) {
        const { error } = await supabase.from('sections').delete().in('id', staleIds).eq('workspace_id', workspace.id);
        if (error) throw error;
      }
      if (normalized.length) {
        const rows = normalized.map((block, position) => {
          const { id, type, title, position: _position, ...data } = block;
          return { id, workspace_id: workspace.id, type, title, position, data };
        });
        const { error } = await supabase.from('sections').upsert(rows, { onConflict: 'id' });
        if (error) throw error;
      }
      setStatus('Saved to Supabase.');
    } catch (error) {
      setStatus(error.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoHeight = (e) => {
    e.target.style.height = 'inherit';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const addBlock = (type) => setBlocks(current => [...current, createBlock(type)]);
  const deleteBlock = (id) => {
    if (window.confirm('Delete this section permanently?')) setBlocks(current => current.filter(block => block.id !== id));
  };
  const updateBlock = (id, updates) => setBlocks(current => current.map(block => block.id === id ? { ...block, ...updates } : block));

  const exportData = () => {
    const dataStr = JSON.stringify({ blocks, globalNote, brandName }, null, 2);
    const uri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.href = uri;
    link.download = `${(brandName || 'workspace').replace(/\s+/g, '_')}_data.json`;
    link.click();
  };

  const importData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const json = JSON.parse(e.target.result);
        setBlocks((json.blocks || []).map(block => ({ ...block, id: UUID_RE.test(block.id) ? block.id : makeId() })));
        setGlobalNote(json.globalNote || '');
        setBrandName(json.brandName || 'Imported Workspace');
        setStatus('Imported locally. Press SAVE DATA to sync it to Supabase.');
      } catch {
        setStatus('Invalid JSON file.');
      }
    };
    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setWorkspace(null);
    setBlocks([]);
  };

  if (!session) return <AuthScreen onAuth={setSession} />;
  if (loading) return <div className="min-h-screen bg-[#450693] flex items-center justify-center text-white font-black tracking-[0.25em]">LOADING XENCYNOTE...</div>;

  return (
    <div className="min-h-screen bg-[#450693] text-black p-4 pb-44 font-sans selection:bg-[#FFC400] selection:text-black">
      <header className="max-w-4xl mx-auto mb-10 bg-white p-6 rounded-2xl border-4 border-black shadow-[8px_8px_0_0_#111827]">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="bg-[#8C00FF] p-3 rounded-xl text-white border-2 border-black shadow-[3px_3px_0_0_#000]"><Layout size={24} strokeWidth={3} /></div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-black text-[#8C00FF] tracking-[0.25em]">{profile?.username || session.user.email}</div>
              <input className="bg-transparent border-none outline-none text-2xl font-black tracking-tighter text-[#450693] w-full focus:ring-0" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="WORKSPACE NAME" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 bg-[#F3F4F6] p-2 rounded-xl border-2 border-black">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white rounded-lg text-[#450693]" title="Import"><Upload size={19} /><input ref={fileInputRef} type="file" onChange={importData} className="hidden" accept=".json" /></button>
            <button onClick={exportData} className="p-2 hover:bg-white rounded-lg text-[#450693]" title="Export"><Download size={19} /></button>
            <div className="w-[2px] h-6 bg-[#D1D5DB] mx-1" />
            <button onClick={saveData} disabled={saving} className="bg-[#FF3F7F] disabled:opacity-60 text-white px-5 py-2 rounded-lg font-black text-xs tracking-widest border-2 border-black shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1">{saving ? 'SAVING...' : 'SAVE DATA'}</button>
            <button onClick={signOut} className="p-2 text-black hover:text-[#FF3F7F]" title="Sign out"><LogOut size={19} /></button>
          </div>
        </div>
        {status && <div className="mt-4 text-[10px] font-black uppercase tracking-wider text-gray-500">{status}</div>}
      </header>

      <main className="max-w-4xl mx-auto space-y-12">
        <section className="bg-[#111827] rounded-3xl p-8 border-4 border-black shadow-[15px_15px_0_0_#8C00FF]">
          <div className="flex items-center gap-2 mb-6 border-b-2 border-[#1F2937] pb-4 text-[#FFC400] font-black text-xs uppercase tracking-[0.2em]"><FileText size={18} strokeWidth={3} /><span>Project Vision</span></div>
          <textarea className="w-full min-h-[120px] bg-transparent text-xl leading-relaxed outline-none resize-none placeholder:text-[#374151] text-[#F9FAFB] font-bold overflow-hidden" placeholder="Describe your brand strategy..." value={globalNote} onInput={handleAutoHeight} onChange={e => setGlobalNote(e.target.value)} />
        </section>

        <div className="grid grid-cols-1 gap-12">
          {blocks.map(block => (
            <div key={block.id} className="bg-white rounded-2xl p-8 border-4 border-black relative shadow-[10px_10px_0_0_#111827]">
              <button onClick={() => deleteBlock(block.id)} className="absolute top-6 right-6 text-[#D1D5DB] hover:text-[#FF3F7F]"><Trash2 size={22} /></button>
              <div className="flex items-center gap-2 mb-8 border-b-2 border-[#F3F4F6] pb-2"><ChevronRight size={18} className="text-[#8C00FF]" strokeWidth={4} /><input className="bg-transparent text-sm font-black w-full outline-none text-[#450693] uppercase tracking-[0.3em]" value={block.title} onChange={e => updateBlock(block.id, { title: e.target.value })} /></div>

              {block.type === 'text' && <textarea className="w-full min-h-[100px] bg-[#F9FAFB] p-5 rounded-xl outline-none text-[#111827] text-lg font-bold border-2 border-[#E5E7EB] focus:border-[#8C00FF]" value={block.content || ''} onInput={handleAutoHeight} onChange={e => updateBlock(block.id, { content: e.target.value })} />}

              {block.type === 'checklist' && <div className="space-y-4">
                {(block.items || []).map((item, idx) => <div key={item.id} className="flex items-center gap-5"><input type="checkbox" checked={!!item.completed} onChange={e => { const next = [...block.items]; next[idx] = { ...next[idx], completed: e.target.checked }; updateBlock(block.id, { items: next }); }} className="w-7 h-7 rounded-lg border-4 border-black text-[#FF3F7F] focus:ring-0 cursor-pointer" /><input className={`flex-1 bg-transparent outline-none py-1 text-lg font-black ${item.completed ? 'line-through text-[#D1D5DB]' : 'text-[#450693]'}`} value={item.text || ''} onChange={e => { const next = [...block.items]; next[idx] = { ...next[idx], text: e.target.value }; updateBlock(block.id, { items: next }); }} /><button onClick={() => updateBlock(block.id, { items: block.items.filter(x => x.id !== item.id) })} className="text-gray-300 hover:text-red-500"><X size={16} /></button></div>)}
                <button onClick={() => updateBlock(block.id, { items: [...(block.items || []), { id: makeId(), text: '', completed: false }] })} className="mt-4 px-4 py-2 bg-black text-white text-[10px] font-black rounded-lg">ADD ENTRY</button>
              </div>}

              {block.type === 'color' && <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {(block.swatches || []).map((swatch, idx) => <div key={swatch.id} className="bg-[#F9FAFB] p-5 rounded-xl border-4 border-black"><div className="w-full h-16 rounded-lg border-2 border-black mb-3" style={{ backgroundColor: swatch.hex }} /><input className="w-full text-[10px] font-black mb-1 outline-none uppercase bg-transparent" value={swatch.label || ''} onChange={e => { const next = [...block.swatches]; next[idx] = { ...next[idx], label: e.target.value }; updateBlock(block.id, { swatches: next }); }} /><div className="flex items-center justify-between"><input type="color" className="w-6 h-6 border-0 cursor-pointer" value={swatch.hex || '#000000'} onChange={e => { const next = [...block.swatches]; next[idx] = { ...next[idx], hex: e.target.value }; updateBlock(block.id, { swatches: next }); }} /><span className="text-[10px] font-mono font-bold">{(swatch.hex || '').toUpperCase()}</span></div></div>)}
                <button onClick={() => updateBlock(block.id, { swatches: [...(block.swatches || []), { id: makeId(), hex: '#000000', label: 'NEW COLOR' }] })} className="border-4 border-dashed rounded-xl flex items-center justify-center p-8 text-gray-300 hover:text-black"><Plus size={32} /></button>
              </div>}

              {block.type === 'font' && <div className="space-y-4">{(block.fonts || []).map((font, idx) => <div key={font.id} className="flex flex-wrap items-center gap-4 bg-[#F9FAFB] p-4 rounded-xl border-2 border-black"><input className="flex-1 min-w-[150px] font-black uppercase text-sm outline-none bg-transparent" value={font.family || ''} placeholder="FAMILY" onChange={e => { const next = [...block.fonts]; next[idx] = { ...next[idx], family: e.target.value }; updateBlock(block.id, { fonts: next }); }} /><input className="w-24 text-[10px] font-bold outline-none bg-white border border-black p-1" value={font.weight || ''} placeholder="WEIGHT" onChange={e => { const next = [...block.fonts]; next[idx] = { ...next[idx], weight: e.target.value }; updateBlock(block.id, { fonts: next }); }} /><button onClick={() => updateBlock(block.id, { fonts: block.fonts.filter(x => x.id !== font.id) })} className="text-red-500"><Trash2 size={16} /></button></div>)}<button onClick={() => updateBlock(block.id, { fonts: [...(block.fonts || []), { id: makeId(), family: '', weight: '', usage: '' }] })} className="px-4 py-2 bg-[#8C00FF] text-white text-[10px] font-black rounded-lg">ADD FONT</button></div>}

              {block.type === 'table' && <div className="overflow-x-auto border-4 border-black rounded-xl"><table className="w-full text-sm border-collapse"><thead><tr className="border-b-4 border-black bg-[#F3F4F6]">{(block.rows?.[0] || []).map((cell, cIdx) => <th key={cIdx} className="p-2 border-r-2 border-black last:border-r-0"><input className="w-full bg-transparent text-[9px] font-black text-center outline-none" value={cell} onChange={e => { const next = block.rows.map(row => [...row]); next[0][cIdx] = e.target.value; updateBlock(block.id, { rows: next }); }} /></th>)}</tr></thead><tbody>{(block.rows || []).slice(1).map((row, rIdx) => <tr key={rIdx} className="border-b-2 border-black last:border-b-0">{row.map((cell, cIdx) => <td key={cIdx} className="p-4 border-r-2 border-black last:border-r-0"><input className="w-full outline-none font-bold bg-transparent" value={cell} onChange={e => { const next = block.rows.map(item => [...item]); next[rIdx + 1][cIdx] = e.target.value; updateBlock(block.id, { rows: next }); }} /></td>)}</tr>)}</tbody></table><div className="flex border-t-4 border-black divide-x-2 divide-black"><button onClick={() => updateBlock(block.id, { rows: [...block.rows, new Array(block.rows[0]?.length || 2).fill('')] })} className="flex-1 py-3 text-[9px] font-black uppercase hover:bg-gray-100">Add Row</button><button onClick={() => updateBlock(block.id, { rows: block.rows.map(row => [...row, '']) })} className="flex-1 py-3 text-[9px] font-black uppercase hover:bg-gray-100">Add Column</button></div></div>}

              {block.type === 'link' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{(block.links || []).map((link, idx) => <div key={link.id} className="flex items-center gap-3 bg-[#F9FAFB] p-3 rounded-xl border-2 border-black"><LinkIcon size={16} className="text-[#8C00FF]" /><input className="flex-1 text-[10px] font-black outline-none bg-transparent" value={link.url || ''} onChange={e => { const next = [...block.links]; next[idx] = { ...next[idx], url: e.target.value }; updateBlock(block.id, { links: next }); }} /><button onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')} className="p-1 hover:text-[#8C00FF]"><ChevronRight size={16} /></button><button onClick={() => navigator.clipboard?.writeText(link.url || '')} className="p-1 hover:text-[#8C00FF]"><Copy size={14} /></button></div>)}<button onClick={() => updateBlock(block.id, { links: [...(block.links || []), { id: makeId(), url: 'https://', platform: '' }] })} className="border-2 border-dashed border-gray-300 p-3 rounded-xl text-gray-400 text-[10px] font-black">ADD NEW LINK</button></div>}

              {block.type === 'logo' && <LogoBlock block={block} updateBlock={updateBlock} session={session} workspace={workspace} setStatus={setStatus} />}
            </div>
          ))}
        </div>
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black px-5 sm:px-6 py-4 rounded-2xl flex items-center gap-5 sm:gap-8 shadow-2xl z-50 border-b-4 border-[#FF3F7F] max-w-[95vw] overflow-x-auto">
        {[[Type, 'text', 'Note'], [CheckSquare, 'checklist', 'Task'], [Droplet, 'color', 'Color'], [Type, 'font', 'Font'], [ImageIcon, 'logo', 'Logo'], [LinkIcon, 'link', 'Link'], [Grid, 'table', 'Table']].map(([Icon, type, label]) => <button key={type} onClick={() => addBlock(type)} className="text-[#D1D5DB] hover:text-[#FF3F7F] flex flex-col items-center gap-1 shrink-0"><Icon size={20} /><span className="text-[7px] font-black uppercase">{label}</span></button>)}
      </div>
    </div>
  );
};

const LogoBlock = ({ block, updateBlock, session, workspace, setStatus }) => {
  const [uploading, setUploading] = useState(false);
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !workspace || !session) return;
    setUploading(true);
    setStatus('Uploading logo...');
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${session.user.id}/${workspace.id}/${makeId()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('logos').upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
      if (uploadError) throw uploadError;
      const { data: asset, error: assetError } = await supabase.from('assets').insert({ workspace_id: workspace.id, storage_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size }).select().single();
      if (assetError) throw assetError;
      const { data: signed, error: signedError } = await supabase.storage.from('logos').createSignedUrl(path, 60 * 60 * 24 * 7);
      if (signedError) throw signedError;
      updateBlock(block.id, { images: [...(block.images || []), { id: asset.id, path, url: signed.signedUrl }] });
      setStatus('Logo uploaded. Press SAVE DATA to persist the section.');
    } catch (error) {
      setStatus(error.message || 'Logo upload failed.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = async (image) => {
    if (!image?.path) return updateBlock(block.id, { images: block.images.filter(item => item !== image) });
    const { error: storageError } = await supabase.storage.from('logos').remove([image.path]);
    if (storageError) return setStatus(storageError.message);
    await supabase.from('assets').delete().eq('id', image.id).eq('workspace_id', workspace.id);
    updateBlock(block.id, { images: block.images.filter(item => item.id !== image.id) });
  };

  return <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
    {(block.images || []).map((image, index) => <div key={image.id || index} className="aspect-square bg-[#F9FAFB] border-2 border-black rounded-xl relative group overflow-hidden"><img src={typeof image === 'string' ? image : image.url} className="w-full h-full object-contain p-2" alt="brand asset" /><button onClick={() => removeImage(image)} className="absolute top-1 right-1 bg-black text-white p-1 rounded-md opacity-0 group-hover:opacity-100"><X size={12} /></button></div>)}
    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"><ImageIcon size={24} className="text-gray-300" /><span className="text-[8px] font-black mt-2">{uploading ? 'UPLOADING' : 'ADD LOGO'}</span><input type="file" className="hidden" accept="image/*" onChange={upload} disabled={uploading} /></label>
  </div>;
};

export default App;