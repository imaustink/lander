import{L as d}from"./levels-CKpQBQVy.js";const s=document.getElementById("game-container"),g=document.getElementById("game-placeholder"),f=document.getElementById("game-dot"),y=document.getElementById("run"),r=document.getElementById("level-select"),h=document.getElementById("show-solution"),i=document.getElementById("confirm-solution"),v=document.getElementById("dialog-cancel"),p=document.getElementById("dialog-confirm");d.forEach(({config:t},n)=>{const e=document.createElement("option");e.value=String(n),e.textContent=`${n+1}. ${t.id??`Level ${n+1}`}`,r.appendChild(e)});function m(t){return`lander:code:level${t}`}function u(t){return window.localStorage.getItem(m(t))??d[t].starter}function l(t,n){window.localStorage.setItem(m(t),n)}let o=0;require.config({paths:{vs:"/vs"}});const w=`
declare const falcon9: {
  /** Main booster engine — thrust along the rocket axis. Set true to fire. */
  fireBoosterEngine: boolean;
  /** Left thruster — rotates the rocket counter-clockwise. Set true to fire. */
  fireLeftThruster: boolean;
  /** Right thruster — rotates the rocket clockwise. Set true to fire. */
  fireRightThruster: boolean;
  /** Current velocity (read-only). Positive y = falling downward. */
  readonly velocity: { readonly x: number; readonly y: number };
  /** Current position in world units (read-only). */
  readonly position: { readonly x: number; readonly y: number };
  /** Current tilt in radians. 0 = straight up. Positive = clockwise. */
  readonly angle: number;
  /** Current spin rate in radians/frame. Positive = spinning clockwise. */
  readonly rotationalMomentum: number;
  /** Remaining fuel. Infinity on levels with unlimited fuel. */
  readonly fuelRemaining: number;
  /** Distance from the bottom of the rocket to the ground surface. */
  readonly altitude: number;
};

declare const game: {
  /** Y coordinate of the ground surface in world units. */
  readonly groundY: number;
  readonly canvas: {
    /** Total canvas width in world units. */
    readonly width: number;
    /** Total canvas height in world units. */
    readonly height: number;
  };
};

declare function setInterval(handler: () => void, ms: number): number;
declare function clearInterval(id: number): void;
`;require(["vs/editor/editor.main"],function(){monaco.languages.typescript.javascriptDefaults.addExtraLib(w,"ts:lander-api.d.ts"),monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({noSemanticValidation:!1,noSyntaxValidation:!1});const t=monaco.editor.create(document.getElementById("editor"),{value:u(o),language:"javascript",theme:"vs-dark",minimap:{enabled:!1},automaticLayout:!0,fontSize:13,lineHeight:21,padding:{top:12},scrollBeyondLastLine:!1,renderLineHighlight:"gutter"});window.__editor=t,r.addEventListener("change",()=>{l(o,t.getValue()),o=Number(r.value),t.setValue(u(o))}),window.addEventListener("message",n=>{var e;if(((e=n.data)==null?void 0:e.type)==="levelLoaded"){const a=n.data.index;o=a,r.value=String(a)}}),h.addEventListener("click",()=>{i.showModal()}),v.addEventListener("click",()=>{i.close()}),p.addEventListener("click",()=>{i.close(),l(o,t.getValue()),t.setValue(d[o].solution)}),y.addEventListener("click",()=>{const n=t.getValue();l(o,n),Array.from(s.children).forEach(c=>{c.tagName==="IFRAME"&&c.remove()});const e=document.createElement("iframe");e.src="./frames/game.html",e.style.height="100%",e.style.width="100%",e.style.border="none",e.style.display="block";const a=document.createElement("script");a.textContent=`window.__startLevel = ${o};
${n}`,e.onload=()=>{e.contentDocument.head.appendChild(a),e.contentWindow.game.start(),e.contentWindow.focus(),g.style.opacity="0",f.classList.add("active")},s.appendChild(e)})});
