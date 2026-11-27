// Ícones em SVG (traço), sem dependências externas.
const Ico=(n,s,c)=>`<svg class="ico ${c||''}" width="${s||22}" height="${s||22}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${Ico.p[n]||''}</svg>`;
Ico.p={
 home:'<path d="M3 10.5 12 3l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9.5 22v-7h5v7"/>',
 calendar:'<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M16 2.5v4M8 2.5v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
 bone:'<path d="M17 10c.7-.7 1.7 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .8.7 1.8 0 2.5l-7 7c-.7.7-1.7 0-2.5 0a2.5 2.5 0 0 0 0 5c.3 0 .5.2.5.5a2.5 2.5 0 1 0 5 0c0-.8-.7-1.8 0-2.5z"/>',
 bed:'<path d="M2.5 5v15M2.5 9h16a3 3 0 0 1 3 3v8M2.5 16.5h19M6.5 9v7.5"/>',
 syringe:'<path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3a2.1 2.1 0 0 1-3 0l-.6-.6a2.1 2.1 0 0 1 0-3L15 5M9 11l4 4M5 19l-3 3M14 4l6 6"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 21v-1a5.5 5.5 0 0 1 5.5-5.5h2A5.5 5.5 0 0 1 15.5 20v1"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8A5.5 5.5 0 0 1 21.5 20v1"/>',
 paw:'<ellipse cx="12" cy="16.2" rx="4.8" ry="3.9"/><ellipse cx="5.3" cy="11" rx="2" ry="2.8"/><ellipse cx="9.3" cy="6" rx="2" ry="2.9"/><ellipse cx="14.7" cy="6" rx="2" ry="2.9"/><ellipse cx="18.7" cy="11" rx="2" ry="2.8"/>',
 tag:'<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.4"/>',
 package:'<path d="m16.5 9.4-9-5.2M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7zM3.3 7 12 12l8.7-5M12 22V12"/>',
 box:'<path d="M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>',
 store:'<path d="M3 9.5 4.5 4h15L21 9.5M3 9.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12.5V21h14v-8.5M10 21v-5h4v5"/>',
 chart:'<path d="M4 21V4M10 21v-9M16 21V8M22 21H2"/>',
 clipboard:'<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M8 11h8M8 15h8"/>',
 sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
 download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
 lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
 moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
 sun:'<circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2.5M12 20v2.5M4.2 4.2 6 6M18 18l1.8 1.8M1.5 12H4M20 12h2.5M4.2 19.8 6 18M18 6l1.8-1.8"/>',
 clock:'<circle cx="12" cy="12" r="9.5"/><path d="M12 6.5V12l3.5 2"/>',
 bath:'<path d="M9 6 6.5 3.5A1.5 1.5 0 0 0 5.4 3 1.4 1.4 0 0 0 4 4.4V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5M10 5 8 7M2 12h20M7 19v2M17 19v2"/>',
 cart:'<circle cx="9" cy="21" r="1.4"/><circle cx="19" cy="21" r="1.4"/><path d="M1.5 2.5h3.7l2.7 13.4a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 2-1.6L23 7H6"/>',
 wallet:'<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4M4 6v12a2 2 0 0 0 2 2h14v-4M18 12a2 2 0 0 0 0 4h4v-4z"/>',
 trend:'<path d="m22 7-8.5 8.5-5-5L2 17M16 7h6v6"/>'
};
Ico.tela={inicio:'home',agenda:'calendar',atendimentos:'bone',hotel:'bed',vacinas:'syringe',tutores:'users',pets:'paw',servicos:'tag',pacotes:'package',estoque:'box',vendas:'store',financeiro:'chart',relatorios:'clipboard',config:'sliders',backup:'download',licenca:'lock'};
