/* ==========================================================================
   Icons — инлайновые SVG. Использование: Icon('play') -> строка svg.
   Все иконки 24x24, обводка currentColor, поэтому окрашиваются через CSS.
   ========================================================================== */

var ICONS = {
    logo:     '<path d="M4 12h6M14 12h6M12 4v6M12 14v6"/><circle cx="12" cy="12" r="9"/>',
    map:      '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
    swords:   '<path d="M14.5 4 20 9.5 9.5 20 4 14.5Z"/><path d="M4 20l4-4M14 6l4 4M3 21l3-3"/>',
    book:     '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z"/><path d="M4 19V5M8 7h7M8 11h5"/>',
    trophy:   '<path d="M8 4h8v5a4 4 0 0 1-8 0Z"/><path d="M8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 13v4M8 21h8M10 17h4"/>',
    play:     '<path d="M7 5v14l11-7Z"/>',
    check:    '<path d="M5 12.5 10 17 19 7"/>',
    checkBig: '<path d="M4 12.5 9.5 18 20 6"/>',
    cross:    '<path d="M6 6l12 12M18 6 6 18"/>',
    arrowL:   '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowR:   '<path d="M5 12h14M13 6l6 6-6 6"/>',
    dice:     '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/>',
    bulb:     '<path d="M9 18h6M10 21h4M8.5 14a5.5 5.5 0 1 1 7 0c-.8.7-1.5 1.5-1.5 2.5h-4c0-1-.7-1.8-1.5-2.5Z"/>',
    send:     '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4Z"/>',
    list:     '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>',
    reset:    '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    copy:     '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    sound:    '<path d="M4 10v4h4l5 4V6L8 10Z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    mute:     '<path d="M4 10v4h4l5 4V6L8 10Z"/><path d="M17 9l4 6M21 9l-4 6"/>',
    star:     '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 2.8 1.1-6.1L3.2 9.4l6.1-.8Z"/>',
    flame:    '<path d="M12 3c1 3 4 4.5 4 9a4 4 0 0 1-8 0c0-1.5.5-2.5 1-3.5.5 1 1 1.5 2 1.5 0-2.5-.5-4.5 1-7Z"/>',
    bolt:     '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',
    lock:     '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    unlock:   '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
    train:    '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l1.5-4M15 21l-1.5-4M8 7h8"/><circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/>',
    filter:   '<path d="M4 5h16l-6 8v6l-4-2v-4Z"/>',
    search:   '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>',
    code:     '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
    terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M12 15h5"/>',
    info:     '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    tag:      '<path d="M4 4h7l9 9-7 7-9-9Z"/><circle cx="8" cy="8" r="1" fill="currentColor"/>',
    skip:     '<path d="M5 5v14l9-7ZM17 5v14"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
    upload:   '<path d="M12 15V4M7 9l5-5 5 5M4 20h16"/>',
    trash:    '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    clock:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    sparkle:  '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    eye:      '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    chevron:  '<path d="m6 9 6 6 6-6"/>',
    sun:      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
    moon:     '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
    flag:     '<path d="M5 21V4h11l-2 4 2 4H5"/>',
    medal:    '<circle cx="12" cy="14" r="5"/><path d="m8.5 9.5-3-6.5h4l2.5 5M15.5 9.5l3-6.5h-4L12 8"/>',
    next:     '<path d="M4 12h12M11 7l5 5-5 5"/><path d="M20 6v12"/>'
};

function Icon(name, cls = '') {
    return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}
