import { interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";

const Star: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z"
      fill={color}
    />
  </svg>
);

export const Sparkles: React.FC<{
  count: number;
  seed: string;
  color?: string;
}> = ({ count, seed, color = "#ffffff" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const x = random(`${seed}-x-${i}`) * width;
        const y = random(`${seed}-y-${i}`) * height;
        const size = 10 + random(`${seed}-s-${i}`) * 26;
        const phase = random(`${seed}-p-${i}`) * 90;
        const period = 50 + random(`${seed}-d-${i}`) * 40;
        const t = (frame + phase) % period;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              opacity: interpolate(
                t,
                [0, period * 0.3, period * 0.6, period],
                [0, 1, 0.25, 0],
              ),
              scale: String(
                interpolate(t, [0, period * 0.3, period], [0.4, 1, 0.5]),
              ),
              rotate: `${interpolate(t, [0, period], [0, 90])}deg`,
            }}
          >
            <Star size={size} color={color} />
          </div>
        );
      })}
    </>
  );
};
