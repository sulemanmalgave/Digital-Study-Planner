import React, { useState, useEffect } from 'react';
import { Note, Subject } from '../types';
import { Plus, Search, BookOpen, Trash2, Save, FileText, Calendar, ChevronRight } from 'lucide-react';

interface NotesViewProps {
  subjects: Subject[];
}

export default function NotesView({ subjects }: NotesViewProps) {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const stored = localStorage.getItem('dsp_notes_v1');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    // Default notes
    return [
      {
        id: 'note-1',
        title: 'Linear Algebra Study Cheatsheet',
        content: 'Matrix multiplications, Eigenvalues, and Eigenvectors properties:\n- A * B is not always B * A.\n- det(AB) = det(A) * det(B).\n- Key theorem: An n x n matrix A is diagonalizable if and only if A has n linearly independent eigenvectors.',
        subjectId: 'sub-1',
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'note-2',
        title: 'Organic Chemistry Lab Notes on Esterification',
        content: 'Synthesis of ethyl acetate:\n- Reactants: Ethanol + Acetic Acid in the presence of concentrated sulfuric acid catalyst.\n- Reflux for 30 minutes, then distill to recover the volatile ester.\n- Sulfuric acid acts both as a catalyst and a dehydrating agent to shift equilibrium.',
        subjectId: 'sub-3',
        updatedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
      }
    ];
  });

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    notes.length > 0 ? notes[0].id : null
  );
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');

  // Active note ref
  const activeNote = notes.find(n => n.id === selectedNoteId) || null;

  useEffect(() => {
    localStorage.setItem('dsp_notes_v1', JSON.stringify(notes));
  }, [notes]);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'New Study Note',
      content: '',
      subjectId: subjects.length > 0 ? subjects[0].id : undefined,
      updatedAt: new Date().toISOString(),
    };
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
  };

  const handleUpdateNote = (updatedFields: Partial<Note>) => {
    if (!selectedNoteId) return;
    setNotes(prevNotes =>
      prevNotes.map(n =>
        n.id === selectedNoteId
          ? { ...n, ...updatedFields, updatedAt: new Date().toISOString() }
          : n
      )
    );
  };

  const handleDeleteNote = (id: string) => {
    const filtered = notes.filter(n => n.id !== id);
    setNotes(filtered);
    if (selectedNoteId === id) {
      setSelectedNoteId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'All' || n.subjectId === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden h-[calc(100vh-12rem)] min-h-[500px] flex flex-col md:flex-row" id="notes_container">
      {/* Sidebar - Note List */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col" id="notes_sidebar">
        <div className="p-4 border-b border-slate-800 space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-indigo-400" />
              My Notes
            </h2>
            <button
              onClick={handleCreateNote}
              className="p-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/10 cursor-pointer transition"
              title="Add a Note"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>
            
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-400 focus:outline-none"
            >
              <option value="All">All Topics</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Note Cards List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5" id="notes_cards_list">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-xs text-slate-500">No notes found</p>
              <button 
                onClick={handleCreateNote}
                className="text-[10px] text-indigo-400 font-bold hover:underline"
              >
                Create your first note
              </button>
            </div>
          ) : (
            filteredNotes.map(n => {
              const sub = subjects.find(s => s.id === n.subjectId);
              const isSelected = n.id === selectedNoteId;

              return (
                <button
                  key={n.id}
                  onClick={() => setSelectedNoteId(n.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 group ${
                    isSelected
                      ? 'bg-indigo-650/15 border-indigo-500/40 text-white'
                      : 'bg-slate-950/20 border-slate-850 text-slate-400 hover:bg-slate-950/50 hover:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 w-full">
                    <span className="font-semibold text-xs leading-tight truncate flex-1 leading-snug group-hover:text-slate-200 transition">
                      {n.title || 'Untitled Note'}
                    </span>
                    <ChevronRight className={`h-3 w-3 mt-0.5 shrink-0 transition-transform ${isSelected ? 'translate-x-[2px] text-indigo-400' : 'text-slate-600'}`} />
                  </div>

                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                    {n.content || 'No description yet...'}
                  </p>

                  <div className="flex items-center justify-between w-full pt-1">
                    <span className="text-[9px] text-slate-600 flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" /> {formatDate(n.updatedAt)}
                    </span>

                    {sub && (
                      <span 
                        className="text-[8px] font-bold px-1.5 py-0.2 rounded"
                        style={{ backgroundColor: `${sub.color}15`, color: sub.color }}
                      >
                        {sub.name}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="flex-1 flex flex-col bg-slate-950/40 relative" id="notes_editor_panel">
        {activeNote ? (
          <div className="flex-1 flex flex-col p-4 space-y-4 h-full">
            {/* Header controls inside Editor */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800 shrink-0">
              <div className="flex-1 w-full sm:w-auto">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={e => handleUpdateNote({ title: e.target.value })}
                  className="w-full bg-transparent font-bold text-base text-slate-100 placeholder-slate-600 focus:outline-none"
                  placeholder="Note title..."
                  maxLength={100}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
                  <BookOpen className="h-3 w-3 text-slate-400 shrink-0" />
                  <select
                    value={activeNote.subjectId || ''}
                    onChange={e => handleUpdateNote({ subjectId: e.target.value || undefined })}
                    className="bg-transparent text-[10px] font-bold text-slate-300 focus:outline-none border-none p-0 cursor-pointer"
                  >
                    <option value="">No Course</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleDeleteNote(activeNote.id)}
                  className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 cursor-pointer hover:bg-rose-500/20 transition"
                  title="Delete Note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Note text editor body */}
            <div className="flex-1 flex flex-col min-h-0 relative">
              <textarea
                value={activeNote.content}
                onChange={e => handleUpdateNote({ content: e.target.value })}
                placeholder="Begin writing notes on organic chemistry, formula summaries, lectures..."
                className="w-full flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 resize-none focus:outline-none leading-relaxed h-full scrollbar-thin"
              />
              
              <div className="absolute bottom-0 right-0 py-1 px-2.5 bg-slate-900/60 border border-slate-800/80 rounded-lg flex items-center gap-1.5 text-[9px] text-slate-500 font-bold tracking-wide pointer-events-none">
                <Save className="h-2.5 w-2.5 text-emerald-400" />
                <span>Auto-saved locally</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/60 text-indigo-400">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-350">No Note Selected</p>
              <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                Click on any note from the list, or create a brand new note on your homework review material.
              </p>
            </div>
            <button
              onClick={handleCreateNote}
              className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xl"
            >
              Create New Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
