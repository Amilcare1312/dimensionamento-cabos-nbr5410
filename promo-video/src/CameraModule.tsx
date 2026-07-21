import { Easing, interpolate, useCurrentFrame } from "remotion";

const GLITTER =
  "repeating-conic-gradient(#fff8e1 0deg 3deg, #e6c568 3deg 6deg, #b98f2f 6deg 8deg, #ffffff 8deg 9deg, #d9b877 9deg 13deg, #f3e3b3 13deg 15deg, #c9a24a 15deg 18deg)";

export const GlitterRing: React.FC<{
  size: number;
  thickness?: number;
  children?: React.ReactNode;
}> = ({ size, thickness = 30, children }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        position: "relative",
        boxShadow:
          "0 0 34px rgba(255, 224, 150, 0.55), 0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: GLITTER,
          rotate: `${frame * 0.6}deg`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: thickness,
          borderRadius: "50%",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Lens: React.FC = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      background:
        "radial-gradient(circle at 35% 32%, #3d5ec4 0%, #16224d 26%, #0a0f24 55%, #05070f 100%)",
      position: "relative",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: "24%",
        top: "20%",
        width: "26%",
        height: "26%",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(140,180,255,0.95) 0%, rgba(140,180,255,0) 70%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: "12%",
        borderRadius: "50%",
        border: "3px solid rgba(120,150,230,0.35)",
      }}
    />
  </div>
);

export const CameraModule: React.FC<{
  size?: number;
  snapStart?: number;
}> = ({ size = 640, snapStart = 15 }) => {
  const frame = useCurrentFrame();
  const lens = size * 0.4;
  const pad = size * 0.075;

  const snap = interpolate(frame, [snapStart, snapStart + 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.4, 0.64, 1),
  });

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        background:
          "linear-gradient(135deg, #f8ecd2 0%, #ecd6a6 45%, #d9ba80 100%)",
        boxShadow:
          "inset 0 3px 10px rgba(255,255,255,0.8), inset 0 -6px 16px rgba(150,110,40,0.45), 0 30px 70px rgba(0,0,0,0.45)",
        position: "relative",
      }}
    >
      {/* Top-left lens: ring flies in and snaps on */}
      <div style={{ position: "absolute", left: pad, top: pad }}>
        <div
          style={{
            opacity: interpolate(snap, [0, 0.25], [0, 1]),
            translate: `${interpolate(snap, [0, 1], [280, 0])}px ${interpolate(snap, [0, 1], [-340, 0])}px`,
            scale: String(interpolate(snap, [0, 1], [1.7, 1])),
            rotate: `${interpolate(snap, [0, 1], [-28, 0])}deg`,
          }}
        >
          <GlitterRing size={lens}>
            <Lens />
          </GlitterRing>
        </div>
      </div>

      <div style={{ position: "absolute", left: pad, top: size - pad - lens }}>
        <GlitterRing size={lens}>
          <Lens />
        </GlitterRing>
      </div>

      <div
        style={{
          position: "absolute",
          left: size - pad - lens,
          top: (size - lens) / 2,
        }}
      >
        <GlitterRing size={lens}>
          <Lens />
        </GlitterRing>
      </div>

      {/* Flash */}
      <div
        style={{
          position: "absolute",
          left: size - pad - lens * 0.45,
          top: pad * 1.4,
          width: lens * 0.34,
          height: lens * 0.34,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 40% 40%, #ffffff 0%, #f0e6c8 55%, #cdb98a 100%)",
          boxShadow: "inset 0 0 8px rgba(150,120,60,0.5)",
        }}
      />
    </div>
  );
};
