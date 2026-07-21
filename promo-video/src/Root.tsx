import "./index.css";
import { Composition } from "remotion";
import { GlitterPromo, DURATION_IN_FRAMES } from "./GlitterPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="GlitterPromo"
      component={GlitterPromo}
      durationInFrames={DURATION_IN_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
