import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { DEFAULT_POSE, PX_PER_UNIT, UNITS_H, UNITS_W, drawCharacter, type Pose } from "../character/draw";
import { CHARACTERS } from "../character/specs";

const Flat: React.FC<{ id: keyof typeof CHARACTERS; pose?: Partial<Pose> }> = ({ id, pose }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    drawCharacter(ctx, CHARACTERS[id], { ...DEFAULT_POSE, ...pose });
  }, [id, pose]);
  return (
    <canvas
      ref={ref}
      width={Math.round(UNITS_W * PX_PER_UNIT)}
      height={Math.round(UNITS_H * PX_PER_UNIT)}
      style={{ width: 600, height: 600 * (UNITS_H / UNITS_W), outline: "1px dashed #fff3" }}
    />
  );
};

export const FlatSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#7d7f9e", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 }}>
    <Flat id="pell" />
    <Flat id="juno" />
    <Flat id="bram" />
  </AbsoluteFill>
);
