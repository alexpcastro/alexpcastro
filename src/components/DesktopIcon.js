export default function DesktopIcon({ type }) {
  const shapes = {
    document: <>
      <path d="M16 8h22l10 10v37H16Z" fill="#e9e5cf" />
      <path className="icon-document-fold" d="M38 8v11h10" fill="#cbd4ab" />
      <path d="M21 13h10" stroke="#b5ca83" strokeWidth="3" />
      <path className="icon-document-lines" d="M23 29h18M23 36h15M23 43h11" />
      <path className="icon-document-signature icon-reveal" d="m31 49 3 3 7-7" stroke="#71884f" strokeWidth="2.5" />
    </>,
    folder: <>
      <path d="M7 18h20l5 6h25v30H7Z" fill="#a9ba7c" />
      <path d="M13 21h11" stroke="#e9e5cf" strokeWidth="2" />
      <g className="icon-folder-paper-back icon-reveal"><path d="M15 25h28v26H15Z" fill="#c9d5bd" /><path d="M20 32h17m-17 5h13" stroke="#8b9b78" /></g>
      <g className="icon-folder-paper-front icon-reveal"><path d="M19 25h28v27H19Z" fill="#f0ecd8" /><path d="M24 32h17m-17 5h14m-14 5h9" stroke="#97a082" /></g>
      <path className="icon-folder-front" d="M7 28h51l-5 26H7Z" fill="#d5dda9" />
      <path className="icon-folder-tab" d="M14 36h11" stroke="#9bab72" />
    </>,
    briefcase: <>
      <path className="icon-case-handle" d="M24 21V11h17v10" fill="#c5a47b" />
      <path d="M8 24h49v29H8Z" fill="#c5a47b" />
      <g className="icon-case-paper icon-reveal"><path d="M19 28h26v20H19Z" fill="#f0ecd8" /><path d="M24 33h16m-16 5h11" stroke="#a2a68c" /></g>
      <g className="icon-case-lid"><path d="M8 21v16h49V21Z" fill="#e7caa3" /><path d="M13 26h39" stroke="#c3a27c" strokeWidth="1" /></g>
      <path className="icon-case-clasp" d="M29 33h8v8h-8Z" fill="#dfc194" />
      <path d="M14 44v4h8m27-4v4h-8" />
    </>,
    chip: <>
      <path d="M17 17h31v31H17Z" fill="#a9ba7c" />
      <path className="icon-chip-pins" d="M23 9v8m9-8v8m9-8v8M23 48v8m9-8v8m9-8v8M9 23h8m-8 9h8m-8 9h8m31-18h8m-8 9h8m-8 9h8" />
      <path className="icon-chip-core" d="M23 23h19v19H23Z" fill="#e3e6c9" />
      <path className="icon-chip-prompt" d="m28 29 4 4-4 4m7 0h3" />
      <g className="icon-chip-traces icon-reveal" stroke="#c7e597" strokeWidth="1.5"><path d="M17 9H9v8m39-8h8v8M9 48v8h8m31 0h8v-8" /><circle cx="9" cy="9" r="1.5" fill="#c7e597" /><circle cx="56" cy="56" r="1.5" fill="#c7e597" /></g>
    </>,
    book: <>
      <path d="M12 10h39v45H12Z" fill="#7f9a8d" />
      <path d="M18 12h31v41H18Z" fill="#e9e5cf" />
      <path d="M21 47h25m-25 3h25" stroke="#aeb59c" strokeWidth="1" />
      <g className="icon-book-page icon-reveal"><path d="M18 12h29v34H18Z" fill="#f3efdc" /><path d="M25 20h15m-15 5h15m-15 5h10" stroke="#b1b59d" strokeWidth="1" /></g>
      <path className="icon-book-ribbon" d="M35 12h7v22l-3.5-4-3.5 4Z" fill="#c98a66" stroke="#ae7758" strokeWidth="1" />
      <g className="icon-book-cover"><path d="M18 10h33v37H18Z" fill="#aebeb8" /><path d="M25 21h18m-18 7h12" /></g>
      <path d="M12 10h6v45h-6ZM12 16H8m4 10H8m4 10H8m4 10H8" fill="#aebeb8" />
    </>,
    mail: <>
      <path d="M7 20h51v35H7Z" fill="#bdc9a8" />
      <path className="icon-envelope-flap" d="m7 20 25 20 26-20Z" fill="#dedec7" />
      <g className="icon-envelope-letter icon-reveal"><path d="M17 25h31v27H17Z" fill="#f6f0dc" /><path d="M23 32h17m-17 5h13m-13 5h9" stroke="#8d9d79" strokeWidth="1.5" /><path d="M23 28h8" stroke="#c98a66" strokeWidth="1.5" /></g>
      <path d="m7 20 25 20 26-20v35H7Z" fill="#e9e5cf" /><path d="m7 55 18-19m33 19L39 36" />
      <g className="icon-envelope-stamp"><path d="M45 17h11v11H45Z" fill="#c98a66" /><path d="M48 20h5v5h-5Z" stroke="#e6b98b" strokeWidth="1" /></g>
    </>
  };
  return <svg className={`desktop-icon icon-${type}`} viewBox="0 0 64 64" fill="none" stroke="#334b3d" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><g className="icon-shadow" transform="translate(2 3)" opacity=".2" stroke="#070e0a">{shapes[type]}</g><g className="icon-art">{shapes[type]}</g></svg>;
}
