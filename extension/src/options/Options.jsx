import { useState, useEffect } from 'react';
import { get, KEYS } from '../config/storage.js';
import { BookOpen } from 'lucide-react';
import './options.css';

export default function Options() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const storedUser = await get(KEYS.USER);
      setUser(storedUser);
    })();
  }, []);

  const version = chrome.runtime.getManifest().version;

  return (
    <div className="options">
      <header className="options-header">
        <BookOpen size={28} />
        <h1>ShelfQuest Settings</h1>
      </header>

      <section className="options-section">
        <h2>Account</h2>
        {user ? (
          <p>Signed in as <strong>{user.name || user.email}</strong></p>
        ) : (
          <p>Not signed in. Open the extension popup to log in.</p>
        )}
      </section>

      <section className="options-section">
        <h2>About</h2>
        <p>ShelfQuest Extension v{version}</p>
        <p>
          <a href="https://shelfquest.org" target="_blank" rel="noopener noreferrer">
            shelfquest.org
          </a>
        </p>
      </section>
    </div>
  );
}
