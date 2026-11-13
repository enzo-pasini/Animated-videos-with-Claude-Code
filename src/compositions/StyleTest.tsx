import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Fragment } from "react";
import { AbsoluteFill } from "remotion";
import type { Look } from "../character/look";
import { setLook } from "../character/look";
import { Captions } from "../film/Captions";
import { Shot } from "../film/Shots";
import { DISSOLVE, SHOT_LEN } from "../film/script";
import { Grade } from "../style/Grade";

// 12 s style test: 5 shots, 8-frame cross-dissolves while the camera keeps moving.
// v4: the character look L1 is always on; `look: null` renders the v3 characters (tools/regress_frames.py --baseline v3).
export const StyleTest: React.FC<{ captions?: boolean; look?: Partial<Look> | null }> = ({ captions = true, look }) => {
  setLook(look);
  return (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <TransitionSeries>
      {SHOT_LEN.map((len, i) => (
        <Fragment key={i}>
          {i > 0 ? <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: DISSOLVE })} /> : null}
          <TransitionSeries.Sequence durationInFrames={len}>
            <Shot index={i} />
          </TransitionSeries.Sequence>
        </Fragment>
      ))}
    </TransitionSeries>
    <Grade />
    {captions ? <Captions /> : null}
  </AbsoluteFill>
  );
};
