import { Composition } from "remotion";
import { Smoke } from "./Smoke";
import { CaptionTest, captionTestMetadata } from "./compositions/CaptionTest";
import { Episode, episodeMetadata } from "./episode/Episode";
import { ExpressionSheet, Lineup } from "./compositions/Lineup";
import { FlatSheet } from "./compositions/FlatSheet";
import { HeadShapes } from "./compositions/HeadShapes";
import { KIT, KIT_TILE, KitSheet } from "./compositions/KitSheet";
import { HOME_TILE, HomeKitSheet, TILES as HOME_TILES } from "./compositions/HomeKitSheet";
import { MEDIEVAL_TILE, MedievalKitSheet, TILES as MEDIEVAL_TILES } from "./compositions/MedievalKitSheet";
import { PACK_TEST_ROWS, PACK_TEST_TILE, PackTest } from "./compositions/PackTest";
import { Proposal } from "./compositions/Proposal";
import { SNOW_REF_CAMS, SNOW_REF_TILE, SnowRefSheet } from "./compositions/SnowRefSheet";
import { SNOW_TEST_CAMS, SnowKitTest } from "./compositions/SnowKitTest";
import { SNOW_TILE, SnowKitSheet, TILES as SNOW_TILES } from "./compositions/SnowKitSheet";
import { StyleTest } from "./compositions/StyleTest";
import { TOTAL_FRAMES } from "./film/script";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Smoke" component={Smoke} durationInFrames={30} fps={30} width={1080} height={1920} />
    <Composition id="FlatSheet" component={FlatSheet} durationInFrames={1} fps={30} width={1900} height={1050} />
    <Composition id="HeadShapes" component={HeadShapes} durationInFrames={1} fps={30} width={1960} height={820} defaultProps={{}} />
    <Composition id="KitSheet" component={KitSheet} durationInFrames={KIT.length} fps={30} width={KIT_TILE} height={KIT_TILE} />
    <Composition id="HomeKitSheet" component={HomeKitSheet} durationInFrames={HOME_TILES.length} fps={30} width={HOME_TILE} height={HOME_TILE} />
    <Composition id="SnowKitSheet" component={SnowKitSheet} durationInFrames={SNOW_TILES.length} fps={30} width={SNOW_TILE} height={SNOW_TILE} />
    <Composition id="MedievalKitSheet" component={MedievalKitSheet} durationInFrames={MEDIEVAL_TILES.length} fps={30} width={MEDIEVAL_TILE} height={MEDIEVAL_TILE} />
    <Composition id="PackTest" component={PackTest} defaultProps={{ pack: "home" }} durationInFrames={Math.max(...Object.values(PACK_TEST_ROWS).map((r) => r.length)) * 3} fps={30} width={PACK_TEST_TILE} height={PACK_TEST_TILE} />
    <Composition id="SnowRefSheet" component={SnowRefSheet} defaultProps={{ ours: false }} durationInFrames={SNOW_REF_CAMS.length} fps={30} width={SNOW_REF_TILE} height={SNOW_REF_TILE} />
    <Composition id="SnowKitTest" component={SnowKitTest} defaultProps={{ sweep: false }} durationInFrames={SNOW_TEST_CAMS.length} fps={30} width={1080} height={1920} />
    <Composition id="SnowKitSweep" component={SnowKitTest} defaultProps={{ sweep: true }} durationInFrames={90} fps={30} width={1080} height={1920} />
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
    <Composition
      id="CaptionTest"
      component={CaptionTest}
      durationInFrames={30}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ chunks: [{ text: "Caption", start: 0 }], frames: 30 }}
      calculateMetadata={captionTestMetadata}
    />
    <Composition
      id="Episode"
      component={Episode}
      durationInFrames={30}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ fps: 30, frames: 30, dissolve: 8, audio: null, captions: [], lights: {}, shots: [] }}
      calculateMetadata={episodeMetadata}
    />
    <Composition
      id="Lineup"
      component={Lineup}
      durationInFrames={1}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ ids: ["bram", "mira", "juno"], expr: "neutral" }}
    />
    <Composition
      id="ExpressionSheet"
      component={ExpressionSheet}
      durationInFrames={1}
      fps={30}
      width={1900}
      height={1400}
      defaultProps={{ id: "mira", exprs: ["neutral", "happy", "surprised", "worried", "thinking", "proud", "pointing", "shrug"] }}
    />
  </>
);
