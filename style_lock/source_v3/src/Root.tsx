import { Composition } from "remotion";
import { Smoke } from "./Smoke";
import { FlatSheet } from "./compositions/FlatSheet";
import { Proposal } from "./compositions/Proposal";
import { StyleTest } from "./compositions/StyleTest";
import { TOTAL_FRAMES } from "./film/script";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Smoke" component={Smoke} durationInFrames={30} fps={30} width={1080} height={1920} />
    <Composition id="FlatSheet" component={FlatSheet} durationInFrames={1} fps={30} width={1900} height={1050} />
    <Composition
      id="Proposal"
      component={Proposal}
      durationInFrames={30}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ charId: "pell" as const, lineup: false }}
    />
    <Composition
      id="StyleTest"
      component={StyleTest}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ captions: true }}
    />
  </>
);
