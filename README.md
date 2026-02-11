/**
 * n8n Code Node — Generate HTML (binário) (VERSÃO v7.0 - Sistema de Cargas)
 *
 * v7.0:
 * - Sistema completo de criação e gestão de cargas
 * - Drag & drop de pedidos entre cargas
 * - Atalhos de teclado (C, Del, 1-9, Esc)
 * - Tabela de cargas com cores diferenciadas
 * - Persistência em localStorage
 * - Exportação individual por carga
 * - Mantém TODAS funcionalidades anteriores intactas
 */

const {
  mapaPoints_b64,
  heatPoints_b64,
  spZonas_b64,
  spSubpref_b64,
  mapCenter,
  total,
} = $json;

if (!mapaPoints_b64 || typeof mapaPoints_b64 !== "string") {
  throw new Error("Campo 'mapaPoints_b64' ausente no input do node (Build Points).");
}

const centerLat = Number(mapCenter?.lat ?? -14.2350);
const centerLon = Number(mapCenter?.lon ?? -51.9253);
const totalNum = Number(total ?? 0);

const filename = `mapa_enderecos_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.html`;

const html = `<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Mapa de Endereços - Sistema de Cargas</title>

  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"/>

  <style>
    html, body { height: 100%; margin: 0; }
    #map { position: absolute; inset: 0; }

    :root{
      --bg: #ffffff;
      --text: #111827;
      --muted: #6b7280;
      --border: #e5e7eb;
      --shadow: 0 10px 30px rgba(0,0,0,.12);
      --shadow2: 0 2px 14px rgba(0,0,0,.18);
      --primary: #2563eb;
      --primary2:#1d4ed8;
      --chip:#eef2ff;
      --success: #22c55e;
      --danger: #ef4444;
    }

    /* Filtro topo esquerdo */
    .filterBox {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 2000;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 16px;
      padding: 16px 18px;
      box-shadow: 0 8px 32px rgba(0,0,0,.08), 0 2px 8px rgba(0,0,0,.04);
      border: 1px solid rgba(0,0,0,.06);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      min-width: 280px;
      max-width: 380px;
      backdrop-filter: blur(10px);
    }
    .filterBox .title {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:14px;
      font-size: 14px;
      font-weight: 900;
      color: var(--text);
      margin-bottom: 14px;
      letter-spacing: -0.02em;
    }
    .filterBox label {
      font-size: 12px;
      font-weight: 800;
      color: var(--text);
      display:block;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .filterRow { display:flex; gap:10px; align-items:center; }
    select.filterSel{
      width: 100%;
      border-radius: 12px;
      border: 2px solid var(--border);
      padding: 10px 14px;
      font: inherit;
      font-size: 13px;
      background: #fff;
      outline: none;
      transition: all .2s ease;
      cursor: pointer;
    }
    select.filterSel:hover {
      border-color: #cbd5e1;
    }
    select.filterSel:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(37,99,235,.1);
    }
    .smallNote{ 
      font-size:12px; 
      color: var(--muted); 
      margin-top:12px;
      padding: 8px 10px;
      background: rgba(0,0,0,.02);
      border-radius: 8px;
      border-left: 3px solid var(--primary);
    }

    .chip{
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:6px 12px;
      border-radius:999px;
      background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
      color:#4338ca;
      font-weight:800;
      font-size:11px;
      border: 1.5px solid rgba(67,56,202,.2);
      white-space:nowrap;
      box-shadow: 0 2px 8px rgba(67,56,202,.08);
      transition: all .2s ease;
    }
    .chip:hover {
      box-shadow: 0 4px 12px rgba(67,56,202,.15);
      transform: translateY(-1px);
    }

    /* Card lateral */
    .infoBox {
      position: absolute;
      top: 160px;
      left: 16px;
      z-index: 1500;
      background: linear-gradient(135deg, rgba(255,255,255,.98) 0%, rgba(248,250,252,.95) 100%);
      border-radius: 18px;
      padding: 18px 20px;
      box-shadow: 0 12px 48px rgba(0,0,0,.1), 0 4px 16px rgba(0,0,0,.06);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.4;
      max-width: 420px;
      border: 1px solid rgba(255,255,255,.6);
      backdrop-filter: blur(20px) saturate(1.4);
    }

    .infoBox h3 {
      margin: 0 0 16px 0;
      font-size: 15px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      color: var(--text);
      font-weight: 900;
      letter-spacing: -0.03em;
    }

    .row { 
      display:flex; 
      justify-content:space-between; 
      gap:16px;
      padding: 6px 0;
      transition: background .15s ease;
    }
    .row:hover {
      background: rgba(0,0,0,.02);
      margin: 0 -8px;
      padding: 6px 8px;
      border-radius: 8px;
    }
    .k { 
      font-weight:800; 
      color: var(--text);
      font-size: 12px;
    }
    .muted { 
      color: var(--muted);
      font-size: 12px;
    }
    .divider { 
      border:none; 
      border-top:2px solid rgba(0,0,0,.06); 
      margin:14px 0;
    }

    .btn {
      cursor:pointer;
      border:2px solid var(--border);
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius:12px;
      padding:10px 16px;
      font: inherit;
      font-weight: 700;
      font-size: 13px;
      transition: all .2s cubic-bezier(0.4, 0, 0.2, 1);
      color: var(--text);
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
      position: relative;
      overflow: hidden;
    }
    .btn:hover { 
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0,0,0,.12);
      transform: translateY(-1px);
    }
    .btn:active { 
      transform: translateY(0px);
      box-shadow: 0 1px 2px rgba(0,0,0,.1);
    }

    .btn.primary{
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border-color: rgba(37,99,235,.3);
      box-shadow: 0 4px 16px rgba(37,99,235,.3);
    }
    .btn.primary:hover{ 
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      box-shadow: 0 6px 24px rgba(37,99,235,.4);
    }

    .btn.success{
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border-color: rgba(16,185,129,.3);
      box-shadow: 0 4px 16px rgba(16,185,129,.3);
    }
    .btn.success:hover{ 
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      box-shadow: 0 6px 24px rgba(16,185,129,.4);
    }

    .btn.danger{
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      border-color: rgba(239,68,68,.3);
      box-shadow: 0 4px 16px rgba(239,68,68,.3);
    }
    .btn.danger:hover{ 
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      box-shadow: 0 6px 24px rgba(239,68,68,.4);
    }

    .btn.secondary { 
      background: #ffffff;
      border-color: #e5e7eb;
    }
    .btn.secondary:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }
    
    .btn.small { 
      padding:8px 12px; 
      font-size:12px; 
      border-radius:10px;
      font-weight: 700;
    }

    /* Tabela de Cargas */
    .cargasBox {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 1500;
      background: linear-gradient(135deg, rgba(255,255,255,.98) 0%, rgba(248,250,252,.95) 100%);
      border-radius: 18px;
      padding: 18px 20px;
      box-shadow: 0 12px 48px rgba(0,0,0,.1), 0 4px 16px rgba(0,0,0,.06);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      font-size: 13px;
      max-width: 420px;
      min-width: 360px;
      max-height: 520px;
      overflow-y: auto;
      border: 1px solid rgba(255,255,255,.6);
      backdrop-filter: blur(20px) saturate(1.4);
      cursor: move;
    }

    .cargasBox.dragging {
      cursor: grabbing;
      box-shadow: 0 20px 60px rgba(0,0,0,.2);
    }

    .cargasBox::-webkit-scrollbar {
      width: 8px;
    }
    .cargasBox::-webkit-scrollbar-track {
      background: rgba(0,0,0,.02);
      border-radius: 10px;
    }
    .cargasBox::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,.15);
      border-radius: 10px;
    }
    .cargasBox::-webkit-scrollbar-thumb:hover {
      background: rgba(0,0,0,.25);
    }

    .cargasBox h3 {
      margin: 0 0 16px 0;
      font-size: 15px;
      font-weight: 900;
      color: var(--text);
      display: flex;
      justify-content: space-between;
      align-items: center;
      letter-spacing: -0.03em;
      position: sticky;
      top: -18px;
      background: linear-gradient(135deg, rgba(255,255,255,.98) 0%, rgba(248,250,252,.95) 100%);
      padding: 0 0 12px 0;
      margin-bottom: 12px;
      border-bottom: 2px solid rgba(0,0,0,.06);
      z-index: 10;
      cursor: move;
    }

    .cargasBox h3::before {
      content: '⋮⋮';
      font-size: 18px;
      color: #cbd5e1;
      letter-spacing: -2px;
      margin-right: 8px;
      cursor: grab;
    }

    .cargasBox.dragging h3::before {
      cursor: grabbing;
    }

    .cargaItem {
      background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
      border: 2px solid #e5e7eb;
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 12px;
      cursor: grab;
      transition: all .25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .cargaItem::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 5px;
      height: 100%;
      background: var(--carga-color);
      opacity: 0;
      transition: opacity .25s ease;
    }

    .cargaItem:hover {
      background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
      border-color: #cbd5e1;
      box-shadow: 0 8px 24px rgba(0,0,0,.08);
      transform: translateY(-2px);
    }

    .cargaItem:hover::before {
      opacity: 1;
    }

    .cargaItem.active {
      background: linear-gradient(135deg, rgba(59,130,246,.08) 0%, rgba(37,99,235,.05) 100%);
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,.12), 0 8px 24px rgba(59,130,246,.15);
      transform: translateY(-2px);
    }

    .cargaItem.active::before {
      opacity: 1;
    }

    .cargaItem.dragging {
      opacity: 0.4;
      cursor: grabbing;
      transform: scale(0.98) rotate(2deg);
    }

    .cargaItem.dragover {
      background: linear-gradient(135deg, rgba(16,185,129,.12) 0%, rgba(5,150,105,.08) 100%);
      border-color: #10b981;
      border-style: dashed;
      box-shadow: 0 0 0 3px rgba(16,185,129,.15);
      transform: scale(1.02);
    }

    .cargaHeader {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }

    .cargaColorDot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2.5px solid rgba(255,255,255,.9);
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,.15), 0 0 0 2px rgba(0,0,0,.08);
      transition: all .2s ease;
    }

    .cargaItem:hover .cargaColorDot {
      transform: scale(1.15);
      box-shadow: 0 3px 12px rgba(0,0,0,.2), 0 0 0 3px rgba(0,0,0,.1);
    }

    .cargaNome {
      font-weight: 800;
      font-size: 14px;
      color: var(--text);
      flex: 1;
      letter-spacing: -0.01em;
    }

    .cargaStats {
      display: flex;
      gap: 18px;
      font-size: 12px;
      color: var(--muted);
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .cargaStats > span {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;
    }

    .cargaActions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      flex-wrap: wrap;
    }

    .cargaActions .btn {
      padding: 6px 10px;
      font-size: 11px;
      border-radius: 9px;
      font-weight: 700;
    }

    /* Modal */
    .modal {
      display: none;
      position: fixed;
      z-index: 9999;
      inset: 0;
      background: rgba(0,0,0,.6);
      backdrop-filter: blur(8px);
      align-items: center;
      justify-content: center;
      animation: fadeIn .2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal.show {
      display: flex;
    }

    .modalContent {
      background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
      border-radius: 20px;
      padding: 28px 32px;
      max-width: 520px;
      width: 90%;
      box-shadow: 0 24px 80px rgba(0,0,0,.25), 0 8px 32px rgba(0,0,0,.15);
      animation: modalSlideIn .3s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 1px solid rgba(255,255,255,.8);
    }

    @keyframes modalSlideIn {
      from { 
        opacity: 0; 
        transform: translateY(-30px) scale(0.96);
      }
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1);
      }
    }

    .modalHeader {
      font-size: 20px;
      font-weight: 900;
      margin-bottom: 20px;
      color: var(--text);
      letter-spacing: -0.03em;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .modalBody {
      margin-bottom: 24px;
    }

    .modalBody label {
      display: block;
      font-weight: 800;
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--text);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .modalInput {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font: inherit;
      font-size: 14px;
      outline: none;
      transition: all .2s ease;
      background: #ffffff;
    }

    .modalInput:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59,130,246,.1);
      background: #fafbfc;
    }

    .modalInput::placeholder {
      color: #9ca3af;
    }

    .colorPicker {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
      gap: 10px;
      margin-top: 12px;
    }

    .colorOption {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 3px solid transparent;
      cursor: pointer;
      transition: all .2s ease;
      position: relative;
    }

    .colorOption:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0,0,0,.2);
    }

    .colorOption.selected {
      border-color: #1f2937;
      box-shadow: 0 0 0 2px #fff, 0 0 0 4px #1f2937;
      transform: scale(1.15);
    }

    .colorOption.selected::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-weight: 900;
      font-size: 18px;
      text-shadow: 0 1px 3px rgba(0,0,0,.5);
    }

    .modalFooter {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    /* Popup */
    .leaflet-popup-content {
      margin: 10px 12px;
      width: 760px !important;
      max-width: 760px !important;
    }
    .leaflet-popup-content-wrapper { border-radius: 14px; }

    .popupWrap {
      font-family: system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
      font-size: 13px;
      width: 760px;
      max-width: 760px;
      height: 440px;
      max-height: 440px;
      overflow: auto;
      box-sizing: border-box;
    }

    .popupHeader{
      position: sticky;
      top: 0;
      z-index: 2;
      background: rgba(255,255,255,.92);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
      padding: 8px 0 10px 0;
    }

    .popupTitle { font-weight:900; margin:0 0 4px 0; color: var(--text); }
    .popupMeta { color:#111827; margin-top:3px; word-break: break-word; overflow-wrap: anywhere; }
    .popupMeta b { color: var(--text); }
    .popupActions { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }

    .tblWrap { margin-top:10px; width: 100%; overflow-x: auto; border:1px solid var(--border); border-radius: 12px; }
    table.pedTbl { width:100%; border-collapse: collapse; }
    table.pedTbl thead th{
      position: sticky;
      top: 0;
      z-index: 1;
      background: #f8fafc;
      border-bottom: 1px solid var(--border);
      text-align: left;
      font-weight: 900;
      padding: 10px 10px;
      white-space: nowrap;
    }
    table.pedTbl td{
      border-bottom: 1px solid var(--border);
      padding: 9px 10px;
      vertical-align: top;
      color: var(--text);
    }
    table.pedTbl tbody tr:nth-child(even) td{ background:#fcfcfd; }

    table.pedTbl th.sel, table.pedTbl td.sel { width: 44px; }
    table.pedTbl th.carga, table.pedTbl td.carga { width: 80px; }
    table.pedTbl th.pedido, table.pedTbl td.pedido { width: 120px; }
    table.pedTbl th.cliente, table.pedTbl td.cliente { width: 200px; }
    table.pedTbl th.num, table.pedTbl td.num { width: 100px; text-align: right; white-space: nowrap; }

    table.pedTbl td.produto{
      white-space: normal;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .cargaBadge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid rgba(0,0,0,.1);
      cursor: pointer;
    }

    .hint {
      margin-top:12px;
      color: var(--muted);
      font-size:12px;
      line-height:1.5;
      padding: 10px 12px;
      background: rgba(0,0,0,.02);
      border-radius: 10px;
      border-left: 3px solid #3b82f6;
    }

    .selectBox {
      pointer-events:none;
      position:absolute;
      border:3px dashed rgba(59,130,246,.6);
      background: rgba(59,130,246,.12);
      z-index: 9999;
      display:none;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(59,130,246,.2);
    }

    body.selectMode #map { cursor: crosshair; }

    /* Keyboard hints */
    .kbd {
      display: inline-block;
      padding: 3px 7px;
      border: 1.5px solid #d1d5db;
      border-radius: 6px;
      background: linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%);
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 10px;
      font-weight: 700;
      color: #374151;
      box-shadow: 0 2px 0 0 #d1d5db, 0 1px 2px rgba(0,0,0,.1);
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    /* Toast notifications */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1f2937;
      color: white;
      padding: 14px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,.24), 0 2px 8px rgba(0,0,0,.12);
      z-index: 10000;
      animation: toastSlideIn .4s cubic-bezier(0.34, 1.56, 0.64, 1);
      max-width: 360px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1px solid rgba(255,255,255,.1);
    }

    @keyframes toastSlideIn {
      from { 
        opacity: 0; 
        transform: translateX(120px) scale(0.9);
      }
      to { 
        opacity: 1; 
        transform: translateX(0) scale(1);
      }
    }

    .toast.success { 
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-color: rgba(255,255,255,.2);
      box-shadow: 0 8px 32px rgba(16,185,129,.4), 0 2px 8px rgba(16,185,129,.2);
    }
    .toast.danger { 
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border-color: rgba(255,255,255,.2);
      box-shadow: 0 8px 32px rgba(239,68,68,.4), 0 2px 8px rgba(239,68,68,.2);
    }

    .toast::before {
      content: '✓';
      font-size: 16px;
      font-weight: 900;
    }

    .toast.danger::before {
      content: '✕';
    }
  
    /* Panels: move + resize */
    #filterBox, #infoBox, #cargasBox { resize: both; overflow: auto; }
    .dragging { opacity: 0.95; }

  </style>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    // ===== PAINÉIS (FILTRO / SELEÇÃO) ARRASTÁVEIS + TAMANHO PERSISTENTE =====
    (function makePanelsDraggableAndResizable() {
      const PANELS = [
        { id: "filterBox", handle: ".filterBox .title", storage: "panel_filterBox" },
        { id: "infoBox",   handle: ".infoBox h3",       storage: "panel_infoBox"  },
        // cargasBox já tem lógica própria (mantida como está)
      ];

      function loadPanelState(panel) {
        try {
          const raw = localStorage.getItem(panel.storage);
          if (!raw) return null;
          return JSON.parse(raw);
        } catch (e) {
          return null;
        }
      }

      function savePanelState(panel, el) {
        try {
          const rect = el.getBoundingClientRect();
          const state = {
            left: rect.left + "px",
            top: rect.top + "px",
            width: rect.width + "px",
            height: rect.height + "px",
          };
          localStorage.setItem(panel.storage, JSON.stringify(state));
        } catch (e) {
          // ignore
        }
      }

      function applyPanelState(el, state) {
        if (!state) return;
        // força posicionamento por left/top para permitir arraste livre
        el.style.right = "auto";
        el.style.bottom = "auto";
        if (state.left) el.style.left = state.left;
        if (state.top) el.style.top = state.top;
        if (state.width) el.style.width = state.width;
        if (state.height) el.style.height = state.height;
      }

      function shouldIgnoreDragStart(target) {
        // Não iniciar drag ao interagir com controles
        if (!target) return true;
        const tag = (target.tagName || "").toUpperCase();
        if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "A") return true;
        if (target.closest("button, input, select, textarea, a")) return true;
        return false;
      }

      function makeDraggable(panel) {
        const el = document.getElementById(panel.id);
        if (!el) return;

        const handle = el.querySelector(panel.handle) || el;
        if (!handle) return;

        // carrega estado salvo
        const saved = loadPanelState(panel);
        applyPanelState(el, saved);

        let dragging = false;
        let startX = 0, startY = 0, startLeft = 0, startTop = 0;

        function getPx(v, fallback) {
          const n = parseFloat(String(v || "").replace("px",""));
          return Number.isFinite(n) ? n : fallback;
        }

        function onDown(ev) {
          // somente pelo handle
          if (!ev.target.closest(panel.handle)) return;
          if (shouldIgnoreDragStart(ev.target)) return;

          dragging = true;
          el.classList.add("dragging");

          const rect = el.getBoundingClientRect();
          startX = ev.clientX;
          startY = ev.clientY;

          // usa left/top atuais se existirem, senão pega do rect
          startLeft = getPx(el.style.left, rect.left);
          startTop  = getPx(el.style.top,  rect.top);

          // garante que o painel está em left/top
          el.style.left = startLeft + "px";
          el.style.top = startTop + "px";
          el.style.right = "auto";
          el.style.bottom = "auto";

          ev.preventDefault();
        }

        function onMove(ev) {
          if (!dragging) return;

          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;

          let newLeft = startLeft + dx;
          let newTop  = startTop + dy;

          // limites (mantém um "padding" para não sumir)
          const pad = 8;
          const rect = el.getBoundingClientRect();
          const maxLeft = window.innerWidth - rect.width - pad;
          const maxTop = window.innerHeight - rect.height - pad;

          newLeft = Math.min(Math.max(pad, newLeft), Math.max(pad, maxLeft));
          newTop  = Math.min(Math.max(pad, newTop),  Math.max(pad, maxTop));

          el.style.left = newLeft + "px";
          el.style.top  = newTop + "px";
        }

        function onUp() {
          if (!dragging) return;
          dragging = false;
          el.classList.remove("dragging");
          savePanelState(panel, el);
        }

        // mouse
        handle.addEventListener("mousedown", onDown, false);
        document.addEventListener("mousemove", onMove, false);
        document.addEventListener("mouseup", onUp, false);

        // touch (simples, sem pointer events para manter compat)
        handle.addEventListener("touchstart", (e) => {
          const t = e.touches && e.touches[0];
          if (!t) return;
          onDown({ clientX: t.clientX, clientY: t.clientY, target: e.target, preventDefault: () => e.preventDefault() });
        }, { passive: false });

        document.addEventListener("touchmove", (e) => {
          if (!dragging) return;
          const t = e.touches && e.touches[0];
          if (!t) return;
          onMove({ clientX: t.clientX, clientY: t.clientY });
          e.preventDefault();
        }, { passive: false });

        document.addEventListener("touchend", () => onUp(), false);

        // salva tamanho após redimensionamento (mouseup já cobre a maior parte)
        window.addEventListener("mouseup", () => savePanelState(panel, el));
        window.addEventListener("touchend", () => savePanelState(panel, el));
      }

      PANELS.forEach(makeDraggable);
    })();

  </script>
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
  <script src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"></script>
</head>
<body>
  <div id="map"></div>
  <div id="selectBox" class="selectBox"></div>

  <!-- Filtro -->
  <div id="filterBox" class="filterBox" title="Arraste para reposicionar">
    <h3 class="title">
      <span>Filtros</span>
      <span class="chip" id="visible-count-chip">0 endereços</span>
    </h3>

    <label for="desgrupoSel">DESGRUPO</label>
    <div class="filterRow">
      <select id="desgrupoSel" class="filterSel"></select>
    </div>

    <div class="smallNote" id="filterNote">Mostrando todos os grupos.</div>
  </div>

  <!-- Info Card -->
  <div id="infoBox" class="infoBox" title="Arraste para reposicionar">
    <h3>
      <span>Mapa de Endereços</span>
      <span class="chip" id="selectModeChip">Seleção: OFF</span>
    </h3>

    <div class="row"><div class="k">Total endereços</div><div>${Number.isFinite(totalNum) ? totalNum : 0}</div></div>

    <div class="divider"></div>

    <div class="k" style="margin-bottom:6px;">Geral (visíveis)</div>
    <div class="row"><div>Entregas (pedidos)</div><div id="all-count">0</div></div>
    <div class="row"><div>Peso total</div><div id="all-total-kg">0 kg</div></div>
    <div class="row"><div class="muted">Em ton</div><div class="muted" id="all-total-ton">0 ton</div></div>

    <div class="divider"></div>

    <div class="k" style="margin-bottom:6px;">Selecionados</div>
    <div class="row"><div>Itens selecionados</div><div id="sel-count">0</div></div>
    <div class="row"><div>Pedidos (únicos)</div><div id="sel-orders-unique">0</div></div>
    <div class="row"><div>Clientes (únicos)</div><div id="sel-clients-unique">0</div></div>
    <div class="row"><div>Peso selecionado</div><div id="sel-total-kg">0 kg</div></div>
    <div class="row"><div class="muted">Em ton</div><div class="muted" id="sel-total-ton">0 ton</div></div>

    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
      <button class="btn success" onclick="showCreateCargaModal()">Criar Carga <span class="kbd">C</span></button>
      <button class="btn primary" onclick="toggleSelectMode()">Modo seleção</button>
      <button class="btn secondary" onclick="clearSelection()">Limpar <span class="kbd">Del</span></button>
    </div>

    <div class="hint">
      <b>Atalhos:</b> <span class="kbd">C</span> criar carga | <span class="kbd">Del</span> limpar | <span class="kbd">Alt+Arrastar</span> selecionar área | <span class="kbd">Esc</span> fechar modal
    </div>
  </div>

  <!-- Tabela de Cargas -->
  <div class="cargasBox" id="cargasBox" title="Arraste para reposicionar">
    <h3>
      <span>📦 Cargas Criadas <span id="cargasCount" class="muted">(0)</span></span>
      <button class="btn small" onclick="exportAllCargasReport()">Relatório Geral</button>
    </h3>
    <div id="cargasList"></div>
    <div id="noCargasMsg" style="color: var(--muted); text-align: center; padding: 20px;">
      Nenhuma carga criada ainda.<br/>
      Selecione pedidos e clique em "Criar Carga"
    </div>
  </div>

  <!-- Modal Criar Carga -->
  <div id="createCargaModal" class="modal">
    <div class="modalContent">
      <div class="modalHeader">📦 Criar Nova Carga</div>
      <div class="modalBody">
        <label style="display:block; font-weight:700; margin-bottom:6px; font-size:13px;">Nome da Carga:</label>
        <input type="text" id="cargaNameInput" class="modalInput" placeholder="Ex: Zona Leste - Manhã" />
        
        <label style="display:block; font-weight:700; margin-top:16px; margin-bottom:8px; font-size:13px;">Escolha a Cor:</label>
        <div id="colorPickerContainer" class="colorPicker"></div>
        
        <div style="margin-top:12px; font-size:12px; color: var(--muted);">
          <b>Selecionados:</b> <span id="modal-sel-count">0</span> pedidos | <span id="modal-sel-kg">0 kg</span>
        </div>
      </div>
      <div class="modalFooter">
        <button class="btn secondary" onclick="closeCreateCargaModal()">Cancelar</button>
        <button class="btn success" onclick="createCarga()">Criar Carga</button>
      </div>
    </div>
  </div>

  <script>
    // ===== HELPERS =====
    function safeB64ToJson(b64, fallback) {
      try {
        if (!b64 || b64 === "null" || b64 === "undefined") return fallback;
        const binStr = atob(String(b64));
        const bytes = Uint8Array.from(binStr, (c) => c.charCodeAt(0));
        const jsonStr = new TextDecoder("utf-8").decode(bytes);
        return JSON.parse(jsonStr);
      } catch (e) {
        console.warn("Falha ao decodificar base64/json:", e);
        return fallback;
      }
    }


    function isFeatureCollection(obj) {
      return !!(obj && (obj.type === "FeatureCollection") && Array.isArray(obj.features));
    }

    async function resolveGeojson(input, expectedName) {
      try {
        if (!input) return null;

        // 1) já é GeoJSON
        if (isFeatureCollection(input)) return input;

        // 2) veio como lista (ex.: resposta do GitHub Contents API)
        if (Array.isArray(input)) {
          const cand = input.find(x => {
            const n = String(x?.name || x?.path || "").toLowerCase();
            const exp = String(expectedName || "").toLowerCase();
            return exp && n.includes(exp);
          });
          if (cand?.download_url) {
            const res = await fetch(String(cand.download_url), { cache: "force-cache" });
            if (!res.ok) throw new Error("HTTP " + res.status + " ao baixar " + cand.download_url);
            const gj = await res.json();
            return isFeatureCollection(gj) ? gj : null;
          }
        }

        // 3) veio como metadata do arquivo (GitHub)
        if (input?.download_url) {
          const res = await fetch(String(input.download_url), { cache: "force-cache" });
          if (!res.ok) throw new Error("HTTP " + res.status + " ao baixar " + input.download_url);
          const gj = await res.json();
          return isFeatureCollection(gj) ? gj : null;
        }

        // 4) caso já seja um texto (JSON string)
        if (typeof input === "string") {
          const maybe = JSON.parse(input);
          return isFeatureCollection(maybe) ? maybe : null;
        }

        return null;
      } catch (e) {
        console.warn("Falha ao resolver GeoJSON (" + (expectedName || "") + "):", e);
        return null;
      }
    }
    function escapeHtml(v) {
      if (v === null || v === undefined) return "";
      return String(v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\\"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function parseKgValue(v) {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }

    function formatKg(v) {
      const n = Number(v);
      if (!Number.isFinite(n)) return "";
      return n.toLocaleString("pt-BR", { maximumFractionDigits: 3 }) + " kg";
    }

    function pickFieldCI(obj, candidates) {
      if (!obj) return "";
      const keys = Object.keys(obj);

      for (const cand of candidates) {
        if (obj[cand] != null && String(obj[cand]).trim()) return String(obj[cand]).trim();

        const normCand = String(cand).toLowerCase().replace(/[ _-]/g, "");
        const foundKey = keys.find(k => String(k).toLowerCase().replace(/[ _-]/g, "") === normCand);
        if (foundKey && obj[foundKey] != null && String(obj[foundKey]).trim()) {
          return String(obj[foundKey]).trim();
        }
      }
      return "";
    }

    function showToast(msg, type = 'success') {
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    // ===== DATA =====
    const points = safeB64ToJson("${mapaPoints_b64}", []);
    const heatPtsLegacy = safeB64ToJson("${heatPoints_b64 || ""}", []);
    const spZonas = safeB64ToJson("${spZonas_b64 || ""}", null);
    const spSubpref = safeB64ToJson("${spSubpref_b64 || ""}", null);

    // ===== FILTROS =====
    function getDesgrupo(order, point) {
      return (
        pickFieldCI(order, ["DESGRUPO","DES_GRUPO","DES GRUPO","GRUPO","DESCRGRUPO","DESCR_GRUPO"]) ||
        pickFieldCI(point, ["DESGRUPO","DES_GRUPO","DES GRUPO","GRUPO"]) ||
        ""
      );
    }

    function getRepresentante(order, point) {
      return (
        pickFieldCI(order, ["REPRESENTANTE","REP","NOME_REP","NOME REP","REP_NOME","VENDEDOR","NOME_VENDEDOR"]) ||
        pickFieldCI(point, ["REPRESENTANTE","REP","VENDEDOR"]) ||
        ""
      );
    }

    let activeDesgrupo = "__ALL__";

    function buildDesgrupoOptions() {
      const set = new Set();
      for (const p of points) {
        const orders = Array.isArray(p?.orders) ? p.orders : [];
        for (const o of orders) {
          const g = getDesgrupo(o, p);
          if (g) set.add(g);
        }
      }

      const list = Array.from(set).sort((a,b)=>a.localeCompare(b,"pt-BR"));
      const sel = document.getElementById("desgrupoSel");
      sel.innerHTML = "";

      const optAll = document.createElement("option");
      optAll.value = "__ALL__";
      optAll.textContent = "Todos";
      sel.appendChild(optAll);

      for (const g of list) {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        sel.appendChild(opt);
      }

      sel.value = activeDesgrupo;
    }

    function orderMatchesFilter(o, p){
      if (activeDesgrupo === "__ALL__") return true;
      return getDesgrupo(o, p) === activeDesgrupo;
    }

    function pointHasAnyOrderMatching(pi){
      const p = points[pi];
      const orders = Array.isArray(p?.orders) ? p.orders : [];
      if (!orders.length) return false;
      for (const o of orders) if (orderMatchesFilter(o, p)) return true;
      return false;
    }

    // ===== SISTEMA DE CARGAS =====
    const CARGA_COLORS = [
      '#FF6B35', // coral/laranja vibrante
      '#9D4EDD', // roxo médio
      '#06FFA5', // verde neon/menta
      '#FFD23F', // amarelo ouro
      '#E63946', // vermelho intenso
      '#2A9D8F', // verde-azulado/teal
      '#F72585', // pink magenta
      '#FF9E00', // laranja âmbar
      '#7209B7', // roxo escuro
      '#06D6A0', // verde água
      '#FF1744', // vermelho neon
      '#00E676', // verde limão
      '#D500F9', // magenta elétrico
      '#FFAB00', // âmbar dourado
      '#00E5FF', // ciano claro (exceção controlada)
      '#76FF03', // verde limão brilhante
      '#FF6E40', // laranja profundo
      '#EA80FC', // lilás claro
      '#00BFA5', // verde esmeralda
      '#FFC400', // amarelo intenso
    ];

    let usedColors = new Set();

    function getAvailableColor() {
      // Reseta se todas cores foram usadas
      if (usedColors.size >= CARGA_COLORS.length) {
        usedColors.clear();
      }

      // Encontra primeira cor não usada
      for (const color of CARGA_COLORS) {
        if (!usedColors.has(color)) {
          return color;
        }
      }

      // Fallback (não deve acontecer)
      return CARGA_COLORS[Math.floor(Math.random() * CARGA_COLORS.length)];
    }

    function markColorAsUsed(color) {
      usedColors.add(color);
    }

    function freeColor(color) {
      usedColors.delete(color);
    }

    let cargas = [];
    let activeCargaId = null;
    let nextCargaId = 1;
    let selectedCargaColor = null; // Cor selecionada pelo usuário

    function generateCargaId() {
      return 'carga-' + (nextCargaId++);
    }

    function saveCargasToLocalStorage() {
      try {
        localStorage.setItem('mapCargas', JSON.stringify({
          cargas: cargas.map(c => ({
            id: c.id,
            nome: c.nome,
            color: c.color,
            pedidos: Array.from(c.pedidos.entries())
          })),
          nextId: nextCargaId,
          usedColors: Array.from(usedColors)
        }));
      } catch (e) {
        console.warn('Erro ao salvar cargas:', e);
      }
    }

    function loadCargasFromLocalStorage() {
      try {
        const data = localStorage.getItem('mapCargas');
        if (!data) return;

        const parsed = JSON.parse(data);
        nextCargaId = parsed.nextId || 1;

        cargas = parsed.cargas.map(c => ({
          id: c.id,
          nome: c.nome,
          color: c.color,
          pedidos: new Map(c.pedidos)
        }));

        // Restaura cores usadas
        if (parsed.usedColors) {
          usedColors = new Set(parsed.usedColors);
        } else {
          // Reconstruir cores usadas se não existir
          usedColors.clear();
          cargas.forEach(c => markColorAsUsed(c.color));
        }

        renderCargasList();
        refreshAllMarkerColors();
      } catch (e) {
        console.warn('Erro ao carregar cargas:', e);
      }
    }

    // ===== ICONS =====
    function createIconForCarga(cargaId) {
      const carga = cargas.find(c => c.id === cargaId);
      const color = carga ? carga.color : '#6b7280';
      
      // Mapa de cores personalizadas para URLs de ícones
      const colorMap = {
        '#FF6B35': 'orange',    // coral/laranja vibrante
        '#9D4EDD': 'violet',    // roxo médio
        '#06FFA5': 'green',     // verde neon/menta
        '#FFD23F': 'yellow',    // amarelo ouro
        '#E63946': 'red',       // vermelho intenso
        '#2A9D8F': 'green',     // verde-azulado/teal
        '#F72585': 'red',       // pink magenta
        '#FF9E00': 'orange',    // laranja âmbar
        '#7209B7': 'violet',    // roxo escuro
        '#06D6A0': 'green',     // verde água
        '#FF1744': 'red',       // vermelho neon
        '#00E676': 'green',     // verde limão
        '#D500F9': 'violet',    // magenta elétrico
        '#FFAB00': 'yellow',    // âmbar dourado
        '#00E5FF': 'blue',      // ciano claro (exceção controlada - diferente dos pins)
        '#76FF03': 'green',     // verde limão brilhante
        '#FF6E40': 'orange',    // laranja profundo
        '#EA80FC': 'violet',    // lilás claro
        '#00BFA5': 'green',     // verde esmeralda
        '#FFC400': 'yellow',    // amarelo intenso
      };

      const colorName = colorMap[color] || 'grey';
      
      return new L.Icon({
        iconUrl: \`https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-\${colorName}.png\`,
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
    }

    const iconNormal = new L.Icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const iconSelected = new L.Icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // ===== SELEÇÃO =====
    const selectedOrders = new Map();
    function makeOrderKey(pi, oi) { return pi + ":" + oi; }

    const selectedCountByPi = new Map();
    function incSelectedPi(pi) { selectedCountByPi.set(pi, (selectedCountByPi.get(pi) || 0) + 1); }
    function decSelectedPi(pi) { selectedCountByPi.set(pi, Math.max(0, (selectedCountByPi.get(pi) || 0) - 1)); }

    // Mapa de ordem -> carga
    const orderToCarga = new Map();

    function getOrderCarga(pi, oi) {
      const key = makeOrderKey(pi, oi);
      return orderToCarga.get(key) || null;
    }

    function setOrderCarga(pi, oi, cargaId) {
      const key = makeOrderKey(pi, oi);
      if (cargaId) {
        orderToCarga.set(key, cargaId);
      } else {
        orderToCarga.delete(key);
      }
    }

    function computeSelectionStats() {
      let totalKg = 0;
      let itemsCount = 0;
      const pedidosSet = new Set();
      const clientesSet = new Set();

      for (const [, it] of selectedOrders) {
        itemsCount++;
        totalKg += parseKgValue(it.kg);
        const ped = String(it.pedido ?? "").trim();
        if (ped) pedidosSet.add(ped);
        const cli = String(it.cliente ?? "").trim();
        if (cli) clientesSet.add(cli);
      }

      return { itemsCount, totalKg, pedidosUnique: pedidosSet.size, clientesUnique: clientesSet.size };
    }

    function updateSelectedCard() {
      const stats = computeSelectionStats();
      const elCount = document.getElementById("sel-count");
      const elOrdersUnique = document.getElementById("sel-orders-unique");
      const elClientsUnique = document.getElementById("sel-clients-unique");
      const elKg = document.getElementById("sel-total-kg");
      const elTon = document.getElementById("sel-total-ton");

      if (elCount) elCount.textContent = String(stats.itemsCount);
      if (elOrdersUnique) elOrdersUnique.textContent = String(stats.pedidosUnique);
      if (elClientsUnique) elClientsUnique.textContent = String(stats.clientesUnique);

      if (elKg) elKg.textContent = stats.totalKg.toLocaleString("pt-BR", { maximumFractionDigits: 3 }) + " kg";
      if (elTon) elTon.textContent = (stats.totalKg / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 3 }) + " ton";
    }

    const markerByPi = new Map();
    
    function refreshMarkerColor(pi) {
      const m = markerByPi.get(pi);
      if (!m) return;

      // Verifica se tem seleção temporária
      const hasSelection = (selectedCountByPi.get(pi) || 0) > 0;
      if (hasSelection) {
        m.setIcon(iconSelected);
        return;
      }

      // Verifica se alguma ordem deste ponto está em alguma carga
      const p = points[pi];
      const orders = Array.isArray(p?.orders) ? p.orders : [];
      
      let cargaId = null;
      for (let oi = 0; oi < orders.length; oi++) {
        const cid = getOrderCarga(pi, oi);
        if (cid) {
          cargaId = cid;
          break;
        }
      }

      if (cargaId) {
        m.setIcon(createIconForCarga(cargaId));
      } else {
        m.setIcon(iconNormal);
      }
    }

    function refreshAllMarkerColors() {
      for (const [pi] of markerByPi) {
        refreshMarkerColor(pi);
      }
    }

    function clearSelection() {
      selectedOrders.clear();
      selectedCountByPi.clear();
      document.querySelectorAll("input.selOrder[type='checkbox']").forEach(cb => cb.checked = false);
      refreshAllMarkerColors();
      updateSelectedCard();
    }
    window.clearSelection = clearSelection;

    function selectAllInPin(pi) {
      const p = points[pi];
      if (!p || !Array.isArray(p.orders)) return;

      for (let oi = 0; oi < p.orders.length; oi++) {
        const o = p.orders[oi];
        if (!orderMatchesFilter(o, p)) continue;

        const key = makeOrderKey(pi, oi);
        if (selectedOrders.has(key)) continue;

        selectedOrders.set(key, {
          pedido: o?.PEDIDO ?? "",
          cliente: o?.RASSOC ?? "",
          produto: o?.DESCRICAO ?? "",
          kg: parseKgValue(o?.PEDIDO_ABERTO_KG),
          endereco: p?.endereco ?? "",
          cidade: p?.cidade ?? "",
          uf: p?.uf ?? "",
          zona: p?.zona ?? "",
          subprefeitura: p?.subprefeitura ?? "",
          lat: p?.lat,
          lon: p?.lon
        });
        incSelectedPi(pi);
      }

      document.querySelectorAll("input.selOrder[data-pi='" + pi + "']").forEach(cb => {
        const oi = Number(cb.getAttribute("data-oi"));
        const o = (p.orders && p.orders[oi]) ? p.orders[oi] : null;
        if (o && orderMatchesFilter(o, p)) cb.checked = true;
      });

      refreshMarkerColor(pi);
      updateSelectedCard();
    }
    window.selectAllInPin = selectAllInPin;

    function unselectAllInPin(pi) {
      const p = points[pi];
      if (!p || !Array.isArray(p.orders)) return;

      for (let oi = 0; oi < p.orders.length; oi++) {
        const o = p.orders[oi];
        if (!orderMatchesFilter(o, p)) continue;

        const key = makeOrderKey(pi, oi);
        if (selectedOrders.has(key)) {
          selectedOrders.delete(key);
          decSelectedPi(pi);
        }
      }

      document.querySelectorAll("input.selOrder[data-pi='" + pi + "']").forEach(cb => {
        const oi = Number(cb.getAttribute("data-oi"));
        const o = (p.orders && p.orders[oi]) ? p.orders[oi] : null;
        if (o && orderMatchesFilter(o, p)) cb.checked = false;
      });

      refreshMarkerColor(pi);
      updateSelectedCard();
    }
    window.unselectAllInPin = unselectAllInPin;

    // Checkbox individual
    document.addEventListener("change", (e) => {
      const t = e.target;
      if (!(t && t.classList && t.classList.contains("selOrder"))) return;

      const pi = Number(t.getAttribute("data-pi"));
      const oi = Number(t.getAttribute("data-oi"));
      if (!Number.isFinite(pi) || !Number.isFinite(oi)) return;

      const p = points[pi];
      const o = (p && Array.isArray(p.orders)) ? p.orders[oi] : null;
      if (!p || !o) return;

      if (!orderMatchesFilter(o, p)) {
        t.checked = false;
        return;
      }

      const key = makeOrderKey(pi, oi);

      if (t.checked) {
        if (!selectedOrders.has(key)) {
          selectedOrders.set(key, {
            pedido: o?.PEDIDO ?? "",
            cliente: o?.RASSOC ?? "",
            produto: o?.DESCRICAO ?? "",
            kg: parseKgValue(o?.PEDIDO_ABERTO_KG),
            endereco: p?.endereco ?? "",
            cidade: p?.cidade ?? "",
            uf: p?.uf ?? "",
            zona: p?.zona ?? "",
            subprefeitura: p?.subprefeitura ?? "",
            lat: p?.lat,
            lon: p?.lon
          });
          incSelectedPi(pi);
        }
      } else {
        if (selectedOrders.has(key)) {
          selectedOrders.delete(key);
          decSelectedPi(pi);
        }
      }

      refreshMarkerColor(pi);
      updateSelectedCard();
    });

    // ===== MODAL CRIAR CARGA =====
    function showCreateCargaModal() {
      if (selectedOrders.size === 0) {
        showToast('Selecione pelo menos um pedido antes de criar uma carga!', 'danger');
        return;
      }

      const stats = computeSelectionStats();
      document.getElementById('modal-sel-count').textContent = stats.itemsCount;
      document.getElementById('modal-sel-kg').textContent = formatKg(stats.totalKg);
      document.getElementById('cargaNameInput').value = '';
      
      // Renderizar seletor de cores
      renderColorPicker();
      
      document.getElementById('createCargaModal').classList.add('show');
      
      setTimeout(() => document.getElementById('cargaNameInput').focus(), 100);
    }
    window.showCreateCargaModal = showCreateCargaModal;

    function renderColorPicker() {
      const container = document.getElementById('colorPickerContainer');
      
      // Pré-seleciona cor disponível
      const defaultColor = getAvailableColor();
      selectedCargaColor = defaultColor;
      
      container.innerHTML = CARGA_COLORS.map(color => {
        const isUsed = usedColors.has(color);
        const isSelected = color === selectedCargaColor;
        
        return \`
          <div 
            class="colorOption \${isSelected ? 'selected' : ''} \${isUsed ? 'used' : ''}"
            style="background: \${color}; opacity: \${isUsed ? '0.4' : '1'};"
            data-color="\${color}"
            onclick="selectColor('\${color}', \${isUsed})"
            title="\${isUsed ? 'Cor em uso' : 'Clique para selecionar'}"
          ></div>
        \`;
      }).join('');
    }

    function selectColor(color, isUsed) {
      if (isUsed) {
        showToast('Esta cor já está em uso. Escolha outra!', 'danger');
        return;
      }
      
      selectedCargaColor = color;
      
      // Atualiza visual
      document.querySelectorAll('.colorOption').forEach(el => {
        el.classList.remove('selected');
      });
      
      const selectedEl = document.querySelector(\`.colorOption[data-color="\${color}"]\`);
      if (selectedEl) {
        selectedEl.classList.add('selected');
      }
    }
    window.selectColor = selectColor;

    function closeCreateCargaModal() {
      document.getElementById('createCargaModal').classList.remove('show');
    }
    window.closeCreateCargaModal = closeCreateCargaModal;

    function createCarga() {
      const nome = document.getElementById('cargaNameInput').value.trim();
      if (!nome) {
        showToast('Digite um nome para a carga!', 'danger');
        return;
      }

      if (selectedOrders.size === 0) {
        showToast('Nenhum pedido selecionado!', 'danger');
        return;
      }

      if (!selectedCargaColor) {
        showToast('Selecione uma cor para a carga!', 'danger');
        return;
      }

      const cargaId = generateCargaId();
      const color = selectedCargaColor;

      const carga = {
        id: cargaId,
        nome: nome,
        color: color,
        pedidos: new Map(selectedOrders)
      };

      cargas.push(carga);
      markColorAsUsed(color);

      // Marca as ordens como pertencentes a esta carga
      for (const [key] of selectedOrders) {
        const [pi, oi] = key.split(':').map(Number);
        setOrderCarga(pi, oi, cargaId);
      }

      clearSelection();
      closeCreateCargaModal();
      renderCargasList();
      refreshAllMarkerColors();
      saveCargasToLocalStorage();

      showToast(\`Carga "\${nome}" criada com sucesso!\`, 'success');
      
      // Reset cor selecionada
      selectedCargaColor = null;
    }
    window.createCarga = createCarga;

    // ===== DRAG & DROP =====
    function enableCargaDragDrop(element, cargaId) {
      element.draggable = true;
      
      element.addEventListener('dragstart', (e) => {
        element.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', cargaId);
      });

      element.addEventListener('dragend', () => {
        element.classList.remove('dragging');
        document.querySelectorAll('.cargaItem').forEach(el => el.classList.remove('dragover'));
      });

      element.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const draggingId = e.dataTransfer.getData('text/plain');
        if (draggingId && draggingId !== cargaId) {
          element.classList.add('dragover');
        }
      });

      element.addEventListener('dragleave', () => {
        element.classList.remove('dragover');
      });

      element.addEventListener('drop', (e) => {
        e.preventDefault();
        element.classList.remove('dragover');
        
        const fromCargaId = e.dataTransfer.getData('text/plain');
        const toCargaId = cargaId;
        
        if (fromCargaId === toCargaId) return;

        mergeCarga(fromCargaId, toCargaId);
      });
    }

    function mergeCarga(fromId, toId) {
      const fromCarga = cargas.find(c => c.id === fromId);
      const toCarga = cargas.find(c => c.id === toId);

      if (!fromCarga || !toCarga) return;

      // Move pedidos
      for (const [key, value] of fromCarga.pedidos) {
        toCarga.pedidos.set(key, value);
        const [pi, oi] = key.split(':').map(Number);
        setOrderCarga(pi, oi, toId);
      }

      // Remove carga origem
      cargas = cargas.filter(c => c.id !== fromId);

      renderCargasList();
      refreshAllMarkerColors();
      saveCargasToLocalStorage();

      showToast(\`Cargas mescladas: "\${fromCarga.nome}" → "\${toCarga.nome}"\`, 'success');
    }

    // ===== RENDER CARGAS =====
    function renderCargasList() {
      const container = document.getElementById('cargasList');
      const noMsg = document.getElementById('noCargasMsg');
      const countEl = document.getElementById('cargasCount');

      if (cargas.length === 0) {
        container.innerHTML = '';
        noMsg.style.display = 'block';
        countEl.textContent = '(0)';
        return;
      }

      noMsg.style.display = 'none';
      countEl.textContent = \`(\${cargas.length})\`;

      container.innerHTML = cargas.map((carga, index) => {
        let totalKg = 0;
        const pedidosSet = new Set();
        const clientesSet = new Set();

        for (const [, item] of carga.pedidos) {
          totalKg += parseKgValue(item.kg);
          if (item.pedido) pedidosSet.add(item.pedido);
          if (item.cliente) clientesSet.add(item.cliente);
        }

        const isActive = carga.id === activeCargaId;

        return \`
          <div class="cargaItem \${isActive ? 'active' : ''}" 
               data-carga-id="\${carga.id}"
               style="--carga-color: \${carga.color};"
               onclick="toggleCargaActive('\${carga.id}')">
            <div class="cargaHeader">
              <div class="cargaColorDot" style="background:\${carga.color};"></div>
              <div class="cargaNome">\${escapeHtml(carga.nome)}</div>
              <span class="kbd">\${index + 1}</span>
            </div>
            <div class="cargaStats">
              <span>📦 \${carga.pedidos.size} itens</span>
              <span>📋 \${pedidosSet.size} pedidos</span>
              <span>👥 \${clientesSet.size} clientes</span>
              <span>⚖️ \${formatKg(totalKg)}</span>
            </div>
            <div class="cargaActions" onclick="event.stopPropagation()">
              <button class="btn small" onclick="exportCargaCSV('\${carga.id}')">Exportar CSV</button>
              <button class="btn small secondary" onclick="visualizarCarga('\${carga.id}')">Ver no Mapa</button>
              <button class="btn small danger" onclick="deleteCarga('\${carga.id}')">Excluir</button>
            </div>
          </div>
        \`;
      }).join('');

      // Enable drag & drop
      document.querySelectorAll('.cargaItem').forEach(el => {
        const cargaId = el.getAttribute('data-carga-id');
        enableCargaDragDrop(el, cargaId);
      });
    }

    function toggleCargaActive(cargaId) {
      activeCargaId = activeCargaId === cargaId ? null : cargaId;
      renderCargasList();
    }
    window.toggleCargaActive = toggleCargaActive;

    function visualizarCarga(cargaId) {
      const carga = cargas.find(c => c.id === cargaId);
      if (!carga) return;

      const bounds = [];
      
      for (const [key] of carga.pedidos) {
        const [pi] = key.split(':').map(Number);
        const p = points[pi];
        if (p && Number.isFinite(p.lat) && Number.isFinite(p.lon)) {
          bounds.push([p.lat, p.lon]);
        }
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
        showToast(\`Visualizando carga "\${carga.nome}"\`, 'success');
      }
    }
    window.visualizarCarga = visualizarCarga;

    function deleteCarga(cargaId) {
      if (!confirm('Tem certeza que deseja excluir esta carga?')) return;

      const carga = cargas.find(c => c.id === cargaId);
      if (!carga) return;

      // Libera a cor
      freeColor(carga.color);

      // Remove mapeamento de ordens
      for (const [key] of carga.pedidos) {
        const [pi, oi] = key.split(':').map(Number);
        setOrderCarga(pi, oi, null);
      }

      cargas = cargas.filter(c => c.id !== cargaId);
      if (activeCargaId === cargaId) activeCargaId = null;

      renderCargasList();
      refreshAllMarkerColors();
      saveCargasToLocalStorage();

      showToast(\`Carga "\${carga.nome}" excluída\`, 'success');
    }
    window.deleteCarga = deleteCarga;

    // ===== EXPORTAÇÕES =====
    function exportCargaCSV(cargaId) {
      const carga = cargas.find(c => c.id === cargaId);
      if (!carga) return;

      const header = [
        "CARGA","PEDIDO","CLIENTE","PRODUTO","KG",
        "ENDERECO","CIDADE","UF","ZONA","SUBPREFEITURA",
        "LAT","LON"
      ];
      const rows = [header];

      function coordAsText(v) {
        if (v === null || v === undefined) return "";
        let s = String(v).trim();
        if (!s) return "";
        if (/^-?\\d+(\\.\\d+)?$/.test(s)) s = s.replace(".", ",");
        const safe = s.replace(/"/g, '""');
        return '="' + safe + '"';
      }

      for (const [, it] of carga.pedidos) {
        rows.push([
          carga.nome,
          it.pedido ?? "",
          it.cliente ?? "",
          it.produto ?? "",
          String(it.kg ?? ""),
          it.endereco ?? "",
          it.cidade ?? "",
          it.uf ?? "",
          it.zona ?? "",
          it.subprefeitura ?? "",
          coordAsText(it.lat),
          coordAsText(it.lon)
        ]);
      }

      const csvBody = rows
        .map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(";"))
        .join("\\r\\n");

      const csv = "\\uFEFF" + csvBody;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = \`carga_\${carga.nome.replace(/[^a-z0-9]/gi, '_')}_\${new Date().toISOString().slice(0,10)}.csv\`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      showToast(\`CSV da carga "\${carga.nome}" exportado!\`, 'success');
    }
    window.exportCargaCSV = exportCargaCSV;

    function exportAllCargasReport() {
      if (cargas.length === 0) {
        showToast('Nenhuma carga para exportar!', 'danger');
        return;
      }

      const header = [
        "CARGA","COR","TOTAL_ITENS","TOTAL_PEDIDOS","TOTAL_CLIENTES","TOTAL_KG","TOTAL_TON"
      ];
      const rows = [header];

      for (const carga of cargas) {
        let totalKg = 0;
        const pedidosSet = new Set();
        const clientesSet = new Set();

        for (const [, item] of carga.pedidos) {
          totalKg += parseKgValue(item.kg);
          if (item.pedido) pedidosSet.add(item.pedido);
          if (item.cliente) clientesSet.add(item.cliente);
        }

        rows.push([
          carga.nome,
          carga.color,
          String(carga.pedidos.size),
          String(pedidosSet.size),
          String(clientesSet.size),
          String(totalKg.toFixed(3)),
          String((totalKg / 1000).toFixed(3))
        ]);
      }

      const csvBody = rows
        .map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(";"))
        .join("\\r\\n");

      const csv = "\\uFEFF" + csvBody;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = \`relatorio_cargas_\${new Date().toISOString().slice(0,10)}.csv\`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      showToast('Relatório geral exportado!', 'success');
    }
    window.exportAllCargasReport = exportAllCargasReport;

    // ===== ATALHOS DE TECLADO =====
    document.addEventListener('keydown', (e) => {
      // ESC - Fechar modal
      if (e.key === 'Escape') {
        closeCreateCargaModal();
      }

      // Ignorar atalhos se estiver digitando
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // C - Criar carga
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        showCreateCargaModal();
      }

      // Delete - Limpar seleção
      if (e.key === 'Delete') {
        e.preventDefault();
        clearSelection();
      }

      // 1-9 - Ativar carga
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < cargas.length) {
          e.preventDefault();
          toggleCargaActive(cargas[index].id);
        }
      }
    });

    // ===== HEATMAP =====
    function heatIntensityByKg(kg) {
      const v = Math.max(0, Number(kg) || 0);
      if (v >= 15000) return 1.00;
      if (v >= 10000) return 0.88;
      if (v >= 7000)  return 0.76;
      if (v >= 5000)  return 0.66;
      if (v >= 3000)  return 0.56;
      if (v >= 2000)  return 0.46;
      if (v >= 1000)  return 0.34;
      if (v >= 500)   return 0.24;
      if (v > 0)      return 0.14;
      return 0.0;
    }

    // ===== MAPA =====
    const map = L.map("map", {
      center: [${centerLat}, ${centerLon}],
      zoom: 5,
      zoomControl: true,
      preferCanvas: true
    });

    const cartodbpositron = L.tileLayer(
      "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
      { subdomains: "abc", maxZoom: 18,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
          '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
      }
    ).addTo(map);

    const fgZonas = L.featureGroup().addTo(map);
    const fgSubpref = L.featureGroup().addTo(map);
    const fgCluster = L.featureGroup();
    const fgPlain = L.featureGroup();
    const fgHeat = L.featureGroup().addTo(map);
    function zonasStyle(feature) {
      const z = (feature && feature.properties && feature.properties.zona) ? String(feature.properties.zona).trim() : "";
      switch (z) {
        case "Zona Leste": return { color:"#e31a1c", fillColor:"#e31a1c", fillOpacity:0.07, weight:2 };
        case "Zona Norte": return { color:"#1f78b4", fillColor:"#1f78b4", fillOpacity:0.07, weight:2 };
        case "Centro":     return { color:"#6a3d9a", fillColor:"#6a3d9a", fillOpacity:0.07, weight:2 };
        case "Zona Sul":   return { color:"#33a02c", fillColor:"#33a02c", fillOpacity:0.07, weight:2 };
        default:            return { color:"#ff7f00", fillColor:"#ff7f00", fillOpacity:0.07, weight:2 };
      }
    }

    (async () => {
      const zGJ = await resolveGeojson(spZonas, "zonas_sp");
      if (zGJ && zGJ.features && zGJ.features.length) {
        L.geoJSON(zGJ, { style: zonasStyle }).addTo(fgZonas);
      } else if (spZonas) {
        console.warn("Zonas SP não carregadas (spZonas não é FeatureCollection).");
      }

      const sGJ = await resolveGeojson(spSubpref, "subprefeituras_sp");
      if (sGJ && sGJ.features && sGJ.features.length) {
        L.geoJSON(sGJ, { style: { color:"#555555", fillColor:"#555555", fillOpacity:0.0, weight:1 } }).addTo(fgSubpref);
      } else if (spSubpref) {
        console.warn("Subprefeituras SP não carregadas (spSubpref não é FeatureCollection).");
      }
    })();

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 40,
      disableClusteringAtZoom: 15,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyDistanceMultiplier: 1.5
    });

    // Adiciona cluster ao mapa por padrão
    fgCluster.addLayer(cluster);
    fgCluster.addTo(map);

    const pinLatLngByPi = new Array(points.length).fill(null);

    function buildPopupHtml(pi) {
      const p = points[pi];
      if (!p) return "<div class='popupWrap'>Sem dados.</div>";

      const cidade = p.cidade ? String(p.cidade) : "Sem cidade";
      const uf = p.uf ? String(p.uf) : "";
      const zona = p.zona ? String(p.zona) : "Sem zona";
      const sub = p.subprefeitura ? String(p.subprefeitura) : "Sem subprefeitura";

      const ordersAll = Array.isArray(p.orders) ? p.orders : [];
      const orders = ordersAll.filter(o => orderMatchesFilter(o, p));

      const reps = [];
      const repsSet = new Set();
      for (const o of orders) {
        const r = getRepresentante(o, p);
        if (r && !repsSet.has(r)) { repsSet.add(r); reps.push(r); }
      }
      let repsText = reps.length ? reps.slice(0,3).join(", ") : "—";
      if (reps.length > 3) repsText += " +" + (reps.length - 3);

      const pedidoCount = orders.length;
      const kgTotal = orders.reduce((acc, o) => acc + parseKgValue(o?.PEDIDO_ABERTO_KG), 0);

      const LIMIT = 25;
      const shown = orders.slice(0, LIMIT);
      const hiddenCount = Math.max(0, orders.length - shown.length);

      const rowsHtml = shown.map((o) => {
        const oi = ordersAll.indexOf(o);
        const pedido = escapeHtml(o?.PEDIDO ?? "");
        const cliente = escapeHtml(o?.RASSOC ?? "");
        const prod = escapeHtml(o?.DESCRICAO ?? "");
        const kg = escapeHtml(formatKg(o?.PEDIDO_ABERTO_KG));

        const key = makeOrderKey(pi, oi);
        const checked = selectedOrders.has(key) ? "checked" : "";

        const cargaId = getOrderCarga(pi, oi);
        const cargaBadge = cargaId ? (() => {
          const c = cargas.find(x => x.id === cargaId);
          return c ? \`<span class="cargaBadge" style="background:\${c.color}20; border-color:\${c.color}; color:\${c.color};">\${escapeHtml(c.nome)}</span>\` : '';
        })() : '';

        return (
          "<tr>" +
            "<td class='sel'><input type='checkbox' class='selOrder' data-pi='" + pi + "' data-oi='" + oi + "' " + checked + " style='transform:scale(1.05);cursor:pointer;' /></td>" +
            "<td class='carga'>" + cargaBadge + "</td>" +
            "<td class='pedido'>" + pedido + "</td>" +
            "<td class='cliente'>" + cliente + "</td>" +
            "<td class='produto'>" + prod + "</td>" +
            "<td class='num'>" + kg + "</td>" +
          "</tr>"
        );
      }).join("");

      return (
        "<div class='popupWrap'>" +
          "<div class='popupHeader'>" +
            "<div class='popupTitle'>" + escapeHtml(p.endereco || "") + "</div>" +
            "<div class='popupMeta'><b>Cidade:</b> " + escapeHtml(cidade + (uf ? " - " + uf : "")) + "</div>" +
            "<div class='popupMeta'><b>Zona:</b> " + escapeHtml(zona) + " &nbsp; <b>Subprefeitura:</b> " + escapeHtml(sub) + "</div>" +
            "<div class='popupMeta'><b>Representante:</b> " + escapeHtml(repsText) + "</div>" +
            "<div class='popupMeta' style='margin-top:6px;'><b>Pedidos no endereço (visíveis):</b> " + escapeHtml(pedidoCount) + " <span class='muted'>(mostrando até " + LIMIT + ")</span></div>" +
            "<div class='popupMeta'><b>KG total (visível):</b> " + escapeHtml(formatKg(kgTotal)) + "</div>" +
            "<div class='popupActions'>" +
              "<button class='btn small' onclick='selectAllInPin(" + pi + ")'>Selecionar todos (visíveis)</button>" +
              "<button class='btn small secondary' onclick='unselectAllInPin(" + pi + ")'>Desmarcar (visíveis)</button>" +
            "</div>" +
          "</div>" +

          (rowsHtml
            ? ("<div class='tblWrap'>" +
                "<table class='pedTbl'>" +
                  "<thead><tr>" +
                    "<th class='sel'>Sel</th>" +
                    "<th class='carga'>Carga</th>" +
                    "<th class='pedido'>Pedido</th>" +
                    "<th>Cliente</th>" +
                    "<th>Descrição</th>" +
                    "<th class='num'>Kg</th>" +
                  "</tr></thead>" +
                  "<tbody>" + rowsHtml + "</tbody>" +
                "</table>" +
              "</div>")
            : "<div style='margin-top:10px;color:#666;'>Sem itens para este endereço (no filtro atual).</div>"
          ) +

          (hiddenCount
            ? "<div style='margin-top:10px;color:#666;'>+" + escapeHtml(hiddenCount) + " itens não exibidos (limite " + escapeHtml(LIMIT) + ").</div>"
            : ""
          ) +
        "</div>"
      );
    }

    for (let pi = 0; pi < points.length; pi++) {
      const p = points[pi];
      if (!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue;

      pinLatLngByPi[pi] = L.latLng(p.lat, p.lon);

      const marker = L.marker([p.lat, p.lon], { icon: iconNormal });
      markerByPi.set(pi, marker);

      marker.on("popupopen", () => {
        marker.setPopupContent(buildPopupHtml(pi));
      });
      marker.bindPopup("<div class='popupWrap'>Carregando...</div>");
    }

    function computeAllTotalsVisible() {
      let allOrders = 0;
      let allKg = 0;
      let visiblePins = 0;

      for (let pi = 0; pi < points.length; pi++) {
        const p = points[pi];
        if (!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue;
        if (!pointHasAnyOrderMatching(pi)) continue;

        visiblePins++;

        const ordersAll = Array.isArray(p?.orders) ? p.orders : [];
        const orders = ordersAll.filter(o => orderMatchesFilter(o, p));

        allOrders += orders.length;
        allKg += orders.reduce((acc, o) => acc + parseKgValue(o?.PEDIDO_ABERTO_KG), 0);
      }

      const elCount = document.getElementById("all-count");
      const elKg = document.getElementById("all-total-kg");
      const elTon = document.getElementById("all-total-ton");

      if (elCount) elCount.textContent = String(allOrders);
      if (elKg) elKg.textContent = allKg.toLocaleString("pt-BR", { maximumFractionDigits: 3 }) + " kg";
      if (elTon) elTon.textContent = (allKg / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 3 }) + " ton";

      const chip = document.getElementById("visible-count-chip");
      if (chip) chip.textContent = visiblePins + " endereços";

      const note = document.getElementById("filterNote");
      if (note) note.textContent = (activeDesgrupo === "__ALL__")
        ? "Mostrando todos os grupos." 
        : ("Filtrando por: " + activeDesgrupo);
    }

    function refreshVisibleMarkers(fit = false) {
      // limpa ambas as camadas
      cluster.clearLayers();
      fgPlain.clearLayers();

      const useCluster = map.hasLayer(fgCluster);

      const bounds = [];
      for (let pi = 0; pi < points.length; pi++) {
        const m = markerByPi.get(pi);
        const ll = pinLatLngByPi[pi];
        if (!m || !ll) continue;

        if (!pointHasAnyOrderMatching(pi)) continue;

        if (useCluster) {
          cluster.addLayer(m);
        } else {
          fgPlain.addLayer(m);
        }
        bounds.push([ll.lat, ll.lng]);
      }

      if (useCluster) {
        fgCluster.clearLayers();
        fgCluster.addLayer(cluster);
        if (map.hasLayer(fgPlain)) map.removeLayer(fgPlain);
      } else {
        if (!map.hasLayer(fgPlain)) fgPlain.addTo(map);
      }

      computeAllTotalsVisible();

      if (fit && bounds.length) map.fitBounds(bounds, { padding: [30, 30] });
    }

function rebuildHeat() {
      fgHeat.clearLayers();

      if (typeof L.heatLayer === "function" && Array.isArray(points) && points.length) {
        const heatData = [];

        for (let pi = 0; pi < points.length; pi++) {
          const p = points[pi];
          if (!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue;
          if (!pointHasAnyOrderMatching(pi)) continue;

          const ordersAll = Array.isArray(p.orders) ? p.orders : [];
          const orders = ordersAll.filter(o => orderMatchesFilter(o, p));
          const kgTotal = orders.reduce((acc, o) => acc + parseKgValue(o?.PEDIDO_ABERTO_KG), 0);

          const intensity = heatIntensityByKg(kgTotal);
          if (intensity > 0) heatData.push([p.lat, p.lon, intensity]);
        }

        const heat = L.heatLayer(heatData, {
          radius: 36,
          blur: 30,
          minOpacity: 0.48,
          maxZoom: 18,
          max: 1.0
        });

        fgHeat.addLayer(heat);
      } else if (Array.isArray(heatPtsLegacy) && heatPtsLegacy.length && typeof L.heatLayer === "function") {
        const heat = L.heatLayer(heatPtsLegacy, { radius: 36, blur: 30, minOpacity: 0.48, maxZoom: 18 });
        fgHeat.addLayer(heat);
      }
    }

    rebuildHeat();

    const overlays = {
      "Zonas clássicas (toggle)": fgZonas,
      "Subprefeituras (toggle)": fgSubpref,
      "Cluster (toggle)": fgCluster,
      "Heatmap (toggle)": fgHeat
    };
    L.control.layers({ "cartodbpositron": cartodbpositron }, overlays, { collapsed: false, position: "topright" }).addTo(map);

// ✅ "Cluster (toggle)" não deve esconder os pontos:
// - marcado: pontos clusterizados
// - desmarcado: pontos individuais (sem agrupamento)
map.on("overlayadd", function(e){
  if (e.layer === fgCluster) {
    if (map.hasLayer(fgPlain)) map.removeLayer(fgPlain);
    refreshVisibleMarkers(false);
  }
});
map.on("overlayremove", function(e){
  if (e.layer === fgCluster) {
    if (!map.hasLayer(fgPlain)) fgPlain.addTo(map);
    refreshVisibleMarkers(false);
  }
});


    // Remove camadas por padrão (usuário ativa quando quiser)
    if (map.hasLayer(fgSubpref)) map.removeLayer(fgSubpref);
    if (map.hasLayer(fgHeat)) map.removeLayer(fgHeat);

    // ===== SELEÇÃO POR ÁREA =====
    const selectBoxEl = document.getElementById("selectBox");
    let isSelecting = false;
    let startPoint = null;

    let selectMode = false;
    function setSelectMode(on){
      selectMode = !!on;
      document.body.classList.toggle("selectMode", selectMode);

      const chip = document.getElementById("selectModeChip");
      if (chip) chip.textContent = "Seleção: " + (selectMode ? "ON" : "OFF");
      if (chip) chip.style.background = selectMode ? "rgba(34,197,94,.15)" : "var(--chip)";
      if (chip) chip.style.borderColor = selectMode ? "rgba(34,197,94,.25)" : "rgba(55,48,163,.12)";
      if (chip) chip.style.color = selectMode ? "#166534" : "#3730a3";
    }

    function toggleSelectMode(){
      setSelectMode(!selectMode);
    }
    window.toggleSelectMode = toggleSelectMode;

    function showBox(p1, p2) {
      const x1 = Math.min(p1.x, p2.x);
      const y1 = Math.min(p1.y, p2.y);
      const x2 = Math.max(p1.x, p2.x);
      const y2 = Math.max(p1.y, p2.y);

      selectBoxEl.style.left = x1 + "px";
      selectBoxEl.style.top = y1 + "px";
      selectBoxEl.style.width = (x2 - x1) + "px";
      selectBoxEl.style.height = (y2 - y1) + "px";
      selectBoxEl.style.display = "block";
    }

    function hideBox() {
      selectBoxEl.style.display = "none";
      selectBoxEl.style.width = "0px";
      selectBoxEl.style.height = "0px";
    }

    function selectPinsInBounds(latLngBounds) {
      for (let pi = 0; pi < pinLatLngByPi.length; pi++) {
        const ll = pinLatLngByPi[pi];
        if (!ll) continue;
        if (!latLngBounds.contains(ll)) continue;
        if (!pointHasAnyOrderMatching(pi)) continue;
        selectAllInPin(pi);
      }
      updateSelectedCard();
    }

    function canStartSelection(e){
      const ev = e.originalEvent;
      if (!ev) return false;
      return selectMode || ev.altKey;
    }

    map.on("mousedown", (e) => {
      if (!canStartSelection(e)) return;

      isSelecting = true;
      startPoint = map.mouseEventToContainerPoint(e.originalEvent);

      map.dragging.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      hideBox();
    });

    map.on("mousemove", (e) => {
      if (!isSelecting) return;
      const cur = map.mouseEventToContainerPoint(e.originalEvent);
      showBox(startPoint, cur);
    });

    map.on("mouseup", (e) => {
      if (!isSelecting) return;
      isSelecting = false;

      const endPoint = map.mouseEventToContainerPoint(e.originalEvent);
      hideBox();

      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();

      const p1 = startPoint;
      const p2 = endPoint;
      const sw = map.containerPointToLatLng(L.point(Math.min(p1.x, p2.x), Math.max(p1.y, p2.y)));
      const ne = map.containerPointToLatLng(L.point(Math.max(p1.x, p2.x), Math.min(p1.y, p2.y)));
      const b = L.latLngBounds(sw, ne);

      selectPinsInBounds(b);
    });

    document.getElementById("desgrupoSel").addEventListener("change", (e) => {
      activeDesgrupo = e.target.value || "__ALL__";
      map.closePopup();
      refreshVisibleMarkers(false);
      rebuildHeat();
    });

    // ===== INIT =====
    buildDesgrupoOptions();
    refreshVisibleMarkers(true);
    computeAllTotalsVisible();
    updateSelectedCard();
    setSelectMode(false);
    loadCargasFromLocalStorage();

    
// ===== PAINÉIS ARRASTÁVEIS (FILTROS / MAPA DE ENDEREÇOS) =====
// Observação importante: o HTML é gerado via template string, então scripts no <head> podem rodar antes do <body>.
// Para garantir que os painéis existam, inicializamos o drag aqui (no fim), seguindo o mesmo padrão da Cargas.
(function makePanelDraggableFree(panelId, handleSelector, storageKey) {
  const box = document.getElementById(panelId);
  if (!box) return;
  const handle = box.querySelector(handleSelector);
  if (!handle) return;

  function loadState() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function saveState() {
    try {
      const rect = box.getBoundingClientRect();
      localStorage.setItem(storageKey, JSON.stringify({
        left: rect.left + 'px',
        top: rect.top + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px'
      }));
    } catch (e) { /* ignore */ }
  }

  // aplica estado salvo (se existir); caso contrário, converte para left/top para permitir movimento livre
  const saved = loadState();
  if (saved) {
    box.style.transform = 'none';
    box.style.right = 'auto';
    box.style.bottom = 'auto';
    if (saved.left) box.style.left = saved.left;
    if (saved.top) box.style.top = saved.top;
    if (saved.width) box.style.width = saved.width;
    if (saved.height) box.style.height = saved.height;
  } else {
    const rect = box.getBoundingClientRect();
    box.style.left = rect.left + 'px';
    box.style.top = rect.top + 'px';
    box.style.right = 'auto';
    box.style.bottom = 'auto';
    box.style.transform = 'none';
  }

  // estilo do "handle" igual ao comportamento da Cargas
  handle.style.cursor = 'move';
  handle.style.userSelect = 'none';

  let dragging = false;
  let startX = 0, startY = 0;
  let startLeft = 0, startTop = 0;

  function px(val, fallback) {
    const n = parseFloat(String(val || '').replace('px',''));
    return Number.isFinite(n) ? n : fallback;
  }

  function canStartDrag(target) {
    if (!target) return false;
    const tag = (target.tagName || '').toUpperCase();
    if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'A') return false;
    if (target.closest('button, input, select, textarea, a')) return false;
    return true;
  }

  function onDown(e) {
    if (!canStartDrag(e.target)) return;
    dragging = true;
    const rect = box.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = px(box.style.left, rect.left);
    startTop = px(box.style.top, rect.top);
    e.preventDefault();
  }

  function onMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const nextLeft = startLeft + dx;
    const nextTop = startTop + dy;

    // limites simples para não "sumir" da tela
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const rect = box.getBoundingClientRect();
    const w = rect.width, h = rect.height;

    const clampedLeft = Math.max(0, Math.min(nextLeft, vw - Math.min(w, vw)));
    const clampedTop = Math.max(0, Math.min(nextTop, vh - Math.min(h, vh)));

    box.style.left = clampedLeft + 'px';
    box.style.top = clampedTop + 'px';
  }

  function onUp() {
    if (!dragging) return;
    dragging = false;
    saveState();
  }

  // mouse
  handle.addEventListener('mousedown', onDown);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);

  // touch
  handle.addEventListener('touchstart', (e) => {
    const t = e.touches && e.touches[0];
    if (!t) return;
    onDown({ clientX: t.clientX, clientY: t.clientY, target: e.target, preventDefault: () => e.preventDefault() });
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const t = e.touches && e.touches[0];
    if (!t) return;
    onMove({ clientX: t.clientX, clientY: t.clientY });
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchend', onUp, false);

  // salva tamanho após resize manual
  window.addEventListener('mouseup', saveState);
  window.addEventListener('touchend', saveState);
})('filterBox', '.title', 'filterBoxState_v3');

(function () {
  // InfoBox: arrastar pelo <h3>
  (function makePanelDraggableFree(panelId, handleSelector, storageKey) {
    const box = document.getElementById(panelId);
    if (!box) return;
    const handle = box.querySelector(handleSelector);
    if (!handle) return;

    function loadState() {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) { return null; }
    }

    function saveState() {
      try {
        const rect = box.getBoundingClientRect();
        localStorage.setItem(storageKey, JSON.stringify({
          left: rect.left + 'px',
          top: rect.top + 'px',
          width: rect.width + 'px',
          height: rect.height + 'px'
        }));
      } catch (e) { /* ignore */ }
    }

    const saved = loadState();
    if (saved) {
      box.style.transform = 'none';
      box.style.right = 'auto';
      box.style.bottom = 'auto';
      if (saved.left) box.style.left = saved.left;
      if (saved.top) box.style.top = saved.top;
      if (saved.width) box.style.width = saved.width;
      if (saved.height) box.style.height = saved.height;
    } else {
      const rect = box.getBoundingClientRect();
      box.style.left = rect.left + 'px';
      box.style.top = rect.top + 'px';
      box.style.right = 'auto';
      box.style.bottom = 'auto';
      box.style.transform = 'none';
    }

    handle.style.cursor = 'move';
    handle.style.userSelect = 'none';

    let dragging = false;
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;

    function px(val, fallback) {
      const n = parseFloat(String(val || '').replace('px',''));
      return Number.isFinite(n) ? n : fallback;
    }

    function canStartDrag(target) {
      if (!target) return false;
      const tag = (target.tagName || '').toUpperCase();
      if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'A') return false;
      if (target.closest('button, input, select, textarea, a')) return false;
      return true;
    }

    function onDown(e) {
      if (!canStartDrag(e.target)) return;
      dragging = true;
      const rect = box.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = px(box.style.left, rect.left);
      startTop = px(box.style.top, rect.top);
      e.preventDefault();
    }

    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const nextLeft = startLeft + dx;
      const nextTop = startTop + dy;

      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const rect = box.getBoundingClientRect();
      const w = rect.width, h = rect.height;

      const clampedLeft = Math.max(0, Math.min(nextLeft, vw - Math.min(w, vw)));
      const clampedTop = Math.max(0, Math.min(nextTop, vh - Math.min(h, vh)));

      box.style.left = clampedLeft + 'px';
      box.style.top = clampedTop + 'px';
    }

    function onUp() {
      if (!dragging) return;
      dragging = false;
      saveState();
    }

    handle.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);

    handle.addEventListener('touchstart', (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      onDown({ clientX: t.clientX, clientY: t.clientY, target: e.target, preventDefault: () => e.preventDefault() });
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      onMove({ clientX: t.clientX, clientY: t.clientY });
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', onUp, false);

    window.addEventListener('mouseup', saveState);
    window.addEventListener('touchend', saveState);
  })('infoBox', 'h3', 'infoBoxState_v3');
})();

// ===== CAIXA DE CARGAS ARRASTÁVEL =====
    (function makeCargasBoxDraggableFree() {
      const box = document.getElementById('cargasBox');
      if (!box) return;

      // Torna o comportamento consistente com os outros painéis: usa left/top (não transform)
      // e remove right/bottom para permitir movimentação livre.
      const STORAGE_KEY = 'cargasBoxState_v2';

      function loadState() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return null;
          return JSON.parse(raw);
        } catch (e) { return null; }
      }

      function saveState() {
        try {
          const rect = box.getBoundingClientRect();
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            left: rect.left + 'px',
            top: rect.top + 'px',
            width: rect.width + 'px',
            height: rect.height + 'px'
          }));
        } catch (e) { /* ignore */ }
      }

      // aplica estado salvo (se existir)
      const saved = loadState();
      if (saved) {
        box.style.transform = 'none';
        box.style.right = 'auto';
        box.style.bottom = 'auto';
        if (saved.left) box.style.left = saved.left;
        if (saved.top) box.style.top = saved.top;
        if (saved.width) box.style.width = saved.width;
        if (saved.height) box.style.height = saved.height;
      } else {
        // se veio do CSS com right:16px, converte para left/top para liberar movimento horizontal
        const rect = box.getBoundingClientRect();
        box.style.left = rect.left + 'px';
        box.style.top = rect.top + 'px';
        box.style.right = 'auto';
        box.style.bottom = 'auto';
        box.style.transform = 'none';
      }

      let isDragging = false;
      let startX = 0, startY = 0;
      let startLeft = 0, startTop = 0;

      function px(val, fallback) {
        const n = parseFloat(String(val || '').replace('px',''));
        return Number.isFinite(n) ? n : fallback;
      }

      function canStartDrag(target) {
        if (!target) return false;
        // Evita arrastar ao clicar em botões/inputs/áreas de ação
        const tag = (target.tagName || '').toUpperCase();
        if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'A') return false;
        if (target.closest('.cargaActions, button, input, select, textarea, a')) return false;

        // Só permitir arrastar pelo header (h3)
        if (target.closest('h3')) return true;
        return false;
      }

      function onDown(e) {
        if (e.button !== undefined && e.button !== 0) return;
        if (!canStartDrag(e.target)) return;

        // Converter right->left no momento do drag (garantia)
        const rect = box.getBoundingClientRect();
        box.style.left = rect.left + 'px';
        box.style.top = rect.top + 'px';
        box.style.right = 'auto';
        box.style.bottom = 'auto';
        box.style.transform = 'none';

        isDragging = true;
        box.classList.add('dragging');

        startX = e.clientX;
        startY = e.clientY;
        startLeft = px(box.style.left, rect.left);
        startTop  = px(box.style.top, rect.top);

        e.preventDefault();
      }

      function onMove(e) {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const rect = box.getBoundingClientRect();
        const newLeft = Math.min(
          Math.max(10, startLeft + dx),
          window.innerWidth - rect.width - 10
        );
        const newTop = Math.min(
          Math.max(10, startTop + dy),
          window.innerHeight - rect.height - 10
        );

        box.style.left = newLeft + 'px';
        box.style.top = newTop + 'px';
      }

      function onUp() {
        if (!isDragging) return;
        isDragging = false;
        box.classList.remove('dragging');
        saveState();
      }

      box.addEventListener('mousedown', onDown, false);
      document.addEventListener('mousemove', onMove, false);
      document.addEventListener('mouseup', onUp, false);

      // Touch support (converte para eventos de mouse)
      box.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        const me = new MouseEvent('mousedown', { clientX: t.clientX, clientY: t.clientY, bubbles: true });
        box.dispatchEvent(me);
        e.preventDefault();
      }, { passive: false });

      document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const t = e.touches[0];
        const me = new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY, bubbles: true });
        document.dispatchEvent(me);
        e.preventDefault();
      }, { passive: false });

      document.addEventListener('touchend', () => {
        const me = new MouseEvent('mouseup', { bubbles: true });
        document.dispatchEvent(me);
      }, false);
    })();
  </script>
</body>
</html>`;

const data = Buffer.from(html, "utf8");
const dataB64 = data.toString("base64");

return [
  {
    json: { filename, total: totalNum },
    binary: {
      data: {
        data: dataB64,
        mimeType: "text/html",
        fileName: filename,
      },
    },
  },
];
