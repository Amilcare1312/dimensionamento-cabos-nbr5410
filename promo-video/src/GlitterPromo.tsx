import {
  AbsoluteFill,
  Easing,
  Interactive,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { fontFamily } from "./fonts";
import { Sparkles } from "./Sparkles";
import { CameraModule, GlitterRing } from "./CameraModule";

const HOOK = 105;
const PRODUCT = 210;
const BENEFITS = 180;
const PRICE = 135;
const CTA = 90;

export const DURATION_IN_FRAMES = HOOK + PRODUCT + BENEFITS + PRICE + CTA;

const GOLD = "#f2d488";
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const useFade = (duration: number) => {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [0, 12, duration - 12, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
};

const Background: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(120% 80% at 50% 15%, #2a2038 0%, #171021 45%, #0b0712 100%)",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "42%",
        width: 1400,
        height: 1400,
        translate: "-50% -50%",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(242,212,136,0.16) 0%, rgba(242,212,136,0) 60%)",
      }}
    />
  </AbsoluteFill>
);

const Headline: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  delay?: number;
  name: string;
}> = ({ children, size = 96, color = "#ffffff", delay = 0, name }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div
      name={name}
      style={{
        fontFamily,
        fontWeight: 800,
        fontSize: size,
        color,
        textAlign: "center",
        lineHeight: 1.15,
        opacity: interpolate(frame, [delay, delay + 20], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        }),
        translate: `0px ${interpolate(frame, [delay, delay + 25], [60, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        })}px`,
      }}
    >
      {children}
    </Interactive.Div>
  );
};

const HookScene: React.FC = () => {
  const opacity = useFade(HOOK);
  return (
    <AbsoluteFill
      style={{
        opacity,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        gap: 40,
      }}
    >
      <Headline name="Hook line 1" size={72} color={GOLD} delay={5}>
        SEU IPHONE MERECE
      </Headline>
      <Headline name="Hook line 2" size={120} delay={20}>
        BRILHAR ✨
      </Headline>
    </AbsoluteFill>
  );
};

const ProductScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useFade(PRODUCT);
  return (
    <AbsoluteFill
      style={{
        opacity,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        gap: 90,
      }}
    >
      <div
        style={{
          scale: String(
            interpolate(frame, [0, 30], [0.7, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASE,
            }),
          ),
          rotate: `${interpolate(frame, [0, PRODUCT], [-4, 4])}deg`,
        }}
      >
        <CameraModule size={640} snapStart={40} />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <Headline name="Product name" size={84} delay={95}>
          Película de Câmera
          <br />
          com <span style={{ color: GOLD }}>Glitter</span>
        </Headline>
        <Headline name="Product model" size={46} color="#cbb8e8" delay={115}>
          para iPhone 15 6.1
        </Headline>
      </div>
    </AbsoluteFill>
  );
};

const BENEFIT_ITEMS = [
  "Protege as lentes contra riscos",
  "Brilho de diamante no seu iPhone",
  "Instala em segundos, sem bolhas",
  "Fotos nítidas, sem perder qualidade",
];

const BenefitsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useFade(BENEFITS);
  return (
    <AbsoluteFill
      style={{
        opacity,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        gap: 70,
      }}
    >
      <Headline name="Benefits title" size={76} color={GOLD}>
        POR QUE VOCÊ VAI AMAR
      </Headline>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 44,
          width: "100%",
        }}
      >
        {BENEFIT_ITEMS.map((item, i) => {
          const delay = 25 + i * 32;
          return (
            <Interactive.Div
              key={item}
              name={`Benefit ${i + 1}`}
              style={{
                fontFamily,
                fontWeight: 600,
                fontSize: 48,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: 28,
                opacity: interpolate(frame, [delay, delay + 18], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: EASE,
                }),
                translate: `${interpolate(
                  frame,
                  [delay, delay + 22],
                  [-80, 0],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: EASE,
                  },
                )}px 0px`,
              }}
            >
              <span style={{ color: GOLD, fontSize: 54 }}>✦</span>
              {item}
            </Interactive.Div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const PriceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useFade(PRICE);
  return (
    <AbsoluteFill
      style={{
        opacity,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        gap: 56,
      }}
    >
      <Headline name="Price label" size={56} color="#cbb8e8" delay={0}>
        TUDO ISSO POR APENAS
      </Headline>
      <Interactive.Div
        name="Price value"
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 190,
          color: GOLD,
          textShadow: "0 0 60px rgba(242,212,136,0.45)",
          scale: String(
            interpolate(frame, [15, 45], [0.4, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.34, 1.45, 0.64, 1),
            }),
          ),
          opacity: interpolate(frame, [15, 30], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        R$ 63,52
      </Interactive.Div>
      <Headline name="Installments" size={54} delay={50}>
        ou 10x de <span style={{ color: GOLD }}>R$ 6,35</span> sem juros
      </Headline>
    </AbsoluteFill>
  );
};

const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useFade(CTA);
  const pulse = 1 + 0.04 * Math.sin((frame / 15) * Math.PI);
  return (
    <AbsoluteFill
      style={{
        opacity,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        gap: 80,
      }}
    >
      <div style={{ scale: String(0.42) , height: 270, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlitterRing size={640} thickness={70} />
      </div>
      <Headline name="CTA title" size={88} delay={0}>
        GARANTA O SEU
        <br />
        <span style={{ color: GOLD }}>ANTES QUE ACABE</span>
      </Headline>
      <Interactive.Div
        name="CTA button"
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 60,
          color: "#1a1024",
          background: "linear-gradient(135deg, #f8ecd2 0%, #e9c76f 100%)",
          padding: "44px 96px",
          borderRadius: 999,
          boxShadow: "0 0 70px rgba(242,212,136,0.55)",
          scale: String(
            pulse *
              interpolate(frame, [8, 32], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.34, 1.45, 0.64, 1),
              }),
          ),
        }}
      >
        COMPRAR AGORA 🛒
      </Interactive.Div>
    </AbsoluteFill>
  );
};

export const GlitterPromo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence name="Background">
        <Background />
      </Sequence>
      <Sequence name="Sparkles">
        <Sparkles count={22} seed="promo" color={GOLD} />
      </Sequence>
      <Sequence name="Hook" durationInFrames={HOOK}>
        <HookScene />
      </Sequence>
      <Sequence name="Product" from={HOOK} durationInFrames={PRODUCT}>
        <ProductScene />
      </Sequence>
      <Sequence
        name="Benefits"
        from={HOOK + PRODUCT}
        durationInFrames={BENEFITS}
      >
        <BenefitsScene />
      </Sequence>
      <Sequence
        name="Price"
        from={HOOK + PRODUCT + BENEFITS}
        durationInFrames={PRICE}
      >
        <PriceScene />
      </Sequence>
      <Sequence
        name="CTA"
        from={HOOK + PRODUCT + BENEFITS + PRICE}
        durationInFrames={CTA}
      >
        <CtaScene />
      </Sequence>
    </AbsoluteFill>
  );
};
