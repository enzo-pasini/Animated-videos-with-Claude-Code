// Character identity sheet (PLAN D19): the head shapes (src/character/head.ts: round = v3, gumdrop = men,
// chibi = women) on our cast, flat with the locked look L1. Per row: 4 characters, anger fill, 3D face turn, happy,
// and the 4 characters as small black silhouettes (does the shape read at thumbnail size?).
// Props: `shapes` (rows to show; default all three).
import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { DEFAULT_POSE, PX_PER_UNIT, UNITS, UNITS_H, UNITS_W, drawCharacter, type Pose } from "../character/draw";
import { HEAD_SHAPES, type HeadShape } from "../character/head";
import { castMember } from "../cast/registry";
import { EXPRESSIONS } from "../cast/expressions";

const CAST = ["mira", "rifleman", "juno", "pell"];
const ANGER: Partial<Pose> = { angerFill: 0.62, angerT: 12, browAnger: 1, eyeSquint: 0.5, mouth: "grit" };
const TURN: Partial<Pose> = { faceYaw: 0.5, facePitch: 0.08, mouth: "smile", lookX: 0.6 };
const CELL = 236; // shown width of one head cell
// head crop (body units): the head + collar; the silhouettes stay full body
const CROP = { x0: -0.78, x1: 0.78, y0: -3.42, y1: -1.82 };

const Char: React.FC<{ id: string; shape: HeadShape; pose?: Partial<Pose>; w?: number; black?: boolean }> = ({ id, shape, pose, w = CELL, black }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    drawCharacter(ctx, { ...castMember(id), headShape: shape }, { ...DEFAULT_POSE, breathe: 0.5, ...pose });
    if (black) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = "#15131c";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalCompositeOperation = "source-over";
    }
  }, [id, shape, pose, black]);
  const full = black; // silhouettes: whole body; the rest: zoomed on the head
  const D = full ? w : (w * UNITS_W) / (CROP.x1 - CROP.x0); // shown width of the whole canvas
  const Dh = D * (UNITS_H / UNITS_W);
  const ch = full ? Dh : (w * (CROP.y1 - CROP.y0)) / (CROP.x1 - CROP.x0);
  const ox = full ? 0 : ((CROP.x0 - UNITS.left) / UNITS_W) * D;
  const oy = full ? 0 : ((CROP.y0 - UNITS.top) / UNITS_H) * Dh;
  return (
    <div style={{ width: w, height: ch, overflow: "hidden" }}>
      <canvas
        ref={ref}
        width={Math.round(UNITS_W * PX_PER_UNIT)}
        height={Math.round(UNITS_H * PX_PER_UNIT)}
        style={{ width: D, height: Dh, marginLeft: -ox, marginTop: -oy, display: "block" }}
      />
    </div>
  );
};

const label: React.CSSProperties = { color: "#fff", font: "700 30px sans-serif" };
const small: React.CSSProperties = { color: "#e6e4f0", font: "500 20px sans-serif" };

type Col = { id: string; label: string; pose?: Partial<Pose> };
const COLS: Col[] = [
  ...CAST.map((c) => ({ id: c, label: c })),
  { id: "mira", label: "anger (Mira)", pose: ANGER },
  { id: "rifleman", label: "3D turn (rifleman)", pose: TURN },
  { id: "mira", label: "happy (Mira)", pose: EXPRESSIONS.happy },
];

export const HeadShapes: React.FC<{ shapes?: HeadShape[] }> = ({ shapes }) => {
  const rows = HEAD_SHAPES.filter((s) => !shapes || shapes.includes(s.id));
  const cols = COLS;
  const sil = CAST;
  return (
    <AbsoluteFill style={{ background: "#7d7f9e", padding: "16px 20px", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 0, marginLeft: 190 }}>
        {cols.map((c, k) => (
          <div key={k} style={{ ...small, width: CELL, textAlign: "center" }}>{c.label}</div>
        ))}
        <div style={{ ...small, width: 300, textAlign: "center" }}>thumbnail silhouettes</div>
      </div>
      {rows.map((s, i) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", borderTop: i ? "2px solid #fff3" : undefined }}>
          <div style={{ width: 190 }}>
            <div style={label}>{s.name}</div>
            <div style={small}>{s.note}</div>
          </div>
          {cols.map((c, k) => (
            <Char key={k} id={c.id} shape={s.id} pose={c.pose} />
          ))}
          <div style={{ width: 300, display: "flex", justifyContent: "center", gap: 0 }}>
            {sil.map((c) => (
              <Char key={c} id={c} shape={s.id} w={62} black />
            ))}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
