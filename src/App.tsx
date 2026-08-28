import { useState } from 'react';
import { Library } from './components/Library';
import { NotebookEditor } from './components/NotebookEditor';
import type { Notebook } from './types';
import './styles/tokens.css';
import './styles/app.css';

export default function App() {
  const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null);

  if (activeNotebook) {
    return <NotebookEditor notebook={activeNotebook} onBack={() => setActiveNotebook(null)} />;
  }

  return <Library onOpen={setActiveNotebook} />;
}
