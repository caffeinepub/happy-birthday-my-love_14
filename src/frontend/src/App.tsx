import { Toaster } from "@/components/ui/sonner";
import { HttpAgent } from "@icp-sdk/core/agent";
import { Camera, Edit3, LogIn, LogOut, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { loadConfig } from "./config";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCreateSlot, useRemoveSlot, useSlots } from "./hooks/useQueries";
import { StorageClient } from "./utils/StorageClient";

/* ──────────────────────────────────────────────
   Constants
────────────────────────────────────────────── */

const SENTINEL = "!caf!";

function encodeBlobId(hash: string): Uint8Array {
  return new TextEncoder().encode(SENTINEL + hash);
}

function decodeBlobId(blobId: Uint8Array): string | null {
  try {
    const str = new TextDecoder().decode(blobId);
    if (!str.startsWith(SENTINEL)) return null;
    return str.substring(SENTINEL.length);
  } catch {
    return null;
  }
}

/* ──────────────────────────────────────────────
   Data
────────────────────────────────────────────── */

const memories = [
  {
    id: "m1",
    caption: "Our first date 💕",
    gradient: "linear-gradient(135deg,#f8c8c8,#e8a0a0)",
    rotate: "-2deg",
  },
  {
    id: "m2",
    caption: "That perfect evening ✨",
    gradient: "linear-gradient(135deg,#f5d9c3,#e8b890)",
    rotate: "1.5deg",
  },
  {
    id: "m3",
    caption: "Your smile 😊",
    gradient: "linear-gradient(135deg,#fde8d8,#f5b8a0)",
    rotate: "-1deg",
  },
  {
    id: "m4",
    caption: "Us, always 💫",
    gradient: "linear-gradient(135deg,#e8d5f0,#c8a8e0)",
    rotate: "2.5deg",
  },
  {
    id: "m5",
    caption: "Adventures together 🌟",
    gradient: "linear-gradient(135deg,#fde8b8,#e8c870)",
    rotate: "-3deg",
  },
  {
    id: "m6",
    caption: "Making memories 💝",
    gradient: "linear-gradient(135deg,#d8e8f5,#a8c8e8)",
    rotate: "1deg",
  },
  {
    id: "m7",
    caption: "Your laugh 🥰",
    gradient: "linear-gradient(135deg,#f8d8e8,#e8a8c8)",
    rotate: "-2.5deg",
  },
  {
    id: "m8",
    caption: "Our little world 💖",
    gradient: "linear-gradient(135deg,#d8f5e8,#98d8b8)",
    rotate: "2deg",
  },
  {
    id: "m9",
    caption: "Moments like these 🌸",
    gradient: "linear-gradient(135deg,#fce4ec,#f48fb1)",
    rotate: "-1.5deg",
  },
  {
    id: "m10",
    caption: "Forever grateful 💗",
    gradient: "linear-gradient(135deg,#ffe0b2,#ffb74d)",
    rotate: "3deg",
  },
];

const milestones = [
  {
    id: "t1",
    icon: "🌟",
    date: "The beginning",
    title: "The Day We Met",
    desc: "Everything changed when our paths crossed. That moment I first saw you, I knew something special was beginning.",
  },
  {
    id: "t2",
    icon: "🌹",
    date: "Our first date",
    title: "An Unforgettable Evening",
    desc: "Nervous smiles, warm conversation, and a feeling I never wanted to end. Every detail is etched in my heart.",
  },
  {
    id: "t3",
    icon: "✈️",
    date: "Our adventure",
    title: "First Trip Together",
    desc: "Exploring new places hand in hand, making stories that belong only to us. The world felt different with you beside me.",
  },
  {
    id: "t4",
    icon: "💡",
    date: "A quiet moment",
    title: "When I Knew",
    desc: "In a simple, ordinary moment I looked at you and felt it — this love is real. It has always been real.",
  },
  {
    id: "t5",
    icon: "🙏",
    date: "Today & every day",
    title: "What I Wish For You",
    desc: "I pray for you every single day. I want you to achieve everything you are working so hard for — and I believe with all my heart that you will.",
  },
];

const navLinks = [
  { label: "Home", id: "home" },
  { label: "Memories", id: "memories" },
  { label: "Love Notes", id: "lovenotes" },
  { label: "Journey", id: "journey" },
  { label: "Love Letter", id: "letter" },
];

const loveNotes = [
  {
    id: "ln1",
    lottieUrl: "https://assets3.lottiefiles.com/packages/lf20_wkebwzpz.json",
    fallbackEmoji: "🎂",
    label: "Happy Birthday!",
    color: "#f9e4d4",
  },
  {
    id: "ln2",
    lottieUrl: "https://assets3.lottiefiles.com/packages/lf20_uu0x8lqv.json",
    fallbackEmoji: "💕",
    label: "With Love",
    color: "#fde8ef",
  },
  {
    id: "ln3",
    lottieUrl: "https://assets3.lottiefiles.com/packages/lf20_pKiaUR.json",
    fallbackEmoji: "🐻",
    label: "Rooting For You",
    color: "#e8f4fd",
  },
];

/* ──────────────────────────────────────────────
   Particles
────────────────────────────────────────────── */

const heroHearts = Array.from({ length: 18 }, (_, i) => ({
  id: `hh-${i}`,
  left: 5 + ((i * 5.5) % 92),
  delay: (i * 0.37) % 5,
  duration: 4 + ((i * 0.42) % 4),
  size: 14 + ((i * 3) % 18),
  opacity: 0.6 + ((i * 0.04) % 0.3),
  emoji: i % 3 === 0 ? "💛" : i % 3 === 1 ? "🤍" : "🌸",
}));

const confettiColors = ["#C9A24A", "#e8b0a0", "#c8a0d8", "#f0d090", "#d8b8a8"];
const heroConfetti = Array.from({ length: 25 }, (_, i) => ({
  id: `hc-${i}`,
  left: (i * 4.1) % 100,
  delay: (i * 0.28) % 6,
  duration: 5 + ((i * 0.35) % 5),
  size: 6 + ((i * 2) % 8),
  color: confettiColors[i % confettiColors.length],
  isRect: i % 3 !== 0,
}));

const bgConfetti = Array.from({ length: 12 }, (_, i) => ({
  id: `bc-${i}`,
  w: 6 + ((i * 2) % 8),
  h: 3 + ((i * 1.5) % 6),
  opacity: 0.15 + ((i * 0.02) % 0.18),
  top: 10 + ((i * 8) % 80),
  left: (i * 9) % 95,
  rotate: (i * 35) % 180,
}));

const footerHearts = Array.from({ length: 8 }, (_, i) => ({
  id: `fh-${i}`,
  left: 10 + i * 11,
  size: 12 + ((i * 4) % 14),
  duration: 3 + ((i * 0.5) % 3),
  delay: (i * 0.6) % 3,
  emoji: i % 2 === 0 ? "💕" : "🌸",
}));

/* ──────────────────────────────────────────────
   HeroParticles
────────────────────────────────────────────── */

function HeroParticles() {
  return (
    <>
      {heroHearts.map((h) => (
        <span
          key={h.id}
          style={{
            position: "absolute",
            left: `${h.left}%`,
            bottom: "10%",
            fontSize: `${h.size}px`,
            opacity: h.opacity,
            animation: `floatHeart ${h.duration}s ease-in-out ${h.delay}s infinite`,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {h.emoji}
        </span>
      ))}
      {heroConfetti.map((c) => (
        <div
          key={c.id}
          style={{
            position: "absolute",
            left: `${c.left}%`,
            top: "-20px",
            width: `${c.size}px`,
            height: c.isRect ? `${c.size * 0.5}px` : `${c.size}px`,
            borderRadius: c.isRect ? "2px" : "50%",
            background: c.color,
            opacity: 0.75,
            animation: `confettiFall ${c.duration}s linear ${c.delay}s infinite`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

/* ──────────────────────────────────────────────
   LottieCard
────────────────────────────────────────────── */

function LottieCard({
  lottieUrl,
  fallbackEmoji,
  label,
  color,
  index,
}: {
  lottieUrl: string;
  fallbackEmoji: string;
  label: string;
  color: string;
  index: number;
}) {
  const [LottieComp, setLottieComp] = useState<React.ComponentType<{
    animationData: object;
    loop: boolean;
    style?: React.CSSProperties;
  }> | null>(null);
  const [animData, setAnimData] = useState<object | null>(null);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      (async () => {
        try {
          // Use variable to prevent Rollup from statically resolving the missing package
          const pkg = "lottie-react";
          const m = await import(/* @vite-ignore */ pkg as string);
          return m.default ?? null;
        } catch {
          return null;
        }
      })(),
      fetch(lottieUrl)
        .then((r) => r.json())
        .catch(() => null),
    ]).then(([comp, data]) => {
      if (cancelled) return;
      if (!comp || !data) {
        setFailed(true);
      } else {
        setLottieComp(() => comp);
        setAnimData(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lottieUrl]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="scroll-reveal"
      style={{ transitionDelay: `${index * 0.15}s` }}
      data-ocid={`lovenotes.item.${index + 1}`}
    >
      <div
        style={{
          background: color,
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          border: "1px solid rgba(201,162,74,0.15)",
          transition: "transform 0.28s ease, box-shadow 0.28s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform =
            "translateY(-6px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 16px 40px rgba(0,0,0,0.14)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 4px 20px rgba(0,0,0,0.08)";
        }}
      >
        {!failed && LottieComp && animData ? (
          <LottieComp
            animationData={animData}
            loop={true}
            style={{ width: 160, height: 160 }}
          />
        ) : (
          <div
            className="animate-pulse-heart"
            style={{
              fontSize: "80px",
              width: 160,
              height: 160,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {fallbackEmoji}
          </div>
        )}
        <p
          className="font-script text-center mt-3"
          style={{ color: "#4A3830", fontSize: "1.1rem", fontWeight: 600 }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   PolaroidCard
────────────────────────────────────────────── */

function PolaroidCard({
  caption,
  gradient,
  rotate,
  index,
  photoUrl,
  editMode,
  onUpload,
  onRemove,
  isUploading,
}: {
  caption: string;
  gradient: string;
  rotate: string;
  index: number;
  photoUrl?: string | null;
  editMode: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isUploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (editMode && fileRef.current) {
      fileRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = "";
  };

  return (
    <div
      className="polaroid"
      style={{
        transform: `rotate(${rotate})`,
        cursor: editMode ? "pointer" : "default",
        position: "relative",
      }}
      data-ocid={`memories.item.${index + 1}`}
      role={editMode ? "button" : undefined}
      tabIndex={editMode ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      {editMode && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
          data-ocid={`memories.upload_button.${index + 1}`}
        />
      )}
      <div className="tape" />
      <div
        style={{
          width: "100%",
          paddingBottom: "90%",
          position: "relative",
          overflow: "hidden",
          borderRadius: "2px",
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={caption}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ opacity: 0.25, fontSize: "48px" }}>💕</span>
          </div>
        )}
        {/* edit overlay */}
        {editMode && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "6px",
              color: "#fff",
            }}
          >
            {isUploading ? (
              <div
                className="animate-spin"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "3px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                }}
              />
            ) : (
              <>
                <Camera size={28} color="#fff" />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                  }}
                >
                  {photoUrl ? "Replace" : "Add Photo"}
                </span>
              </>
            )}
          </div>
        )}
        {/* remove button when photo exists and edit mode */}
        {editMode && photoUrl && !isUploading && (
          <button
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              background: "rgba(0,0,0,0.55)",
              border: "none",
              borderRadius: "50%",
              width: 26,
              height: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 5,
            }}
            type="button"
            data-ocid={`memories.delete_button.${index + 1}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X size={14} color="#fff" />
          </button>
        )}
      </div>
      <p
        className="font-script text-center mt-2"
        style={{ color: "#6F5E55", fontSize: "15px", lineHeight: 1.3 }}
      >
        {caption}
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────
   TimelineItem
────────────────────────────────────────────── */

function TimelineItem({
  icon,
  date,
  title,
  desc,
  index,
}: {
  icon: string;
  date: string;
  title: string;
  desc: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="scroll-reveal flex gap-4"
      style={{ transitionDelay: `${index * 0.12}s` }}
      data-ocid={`journey.item.${index + 1}`}
    >
      <div className="timeline-node">
        <span style={{ fontSize: "18px" }}>{icon}</span>
      </div>
      <div className="pb-8" style={{ flex: 1, minWidth: 0 }}>
        <p
          className="font-script text-sm"
          style={{ color: "#C9A24A", marginBottom: "2px" }}
        >
          {date}
        </p>
        <h4
          className="font-serif font-semibold"
          style={{ color: "#1F1A17", marginBottom: "4px", fontSize: "1rem" }}
        >
          {title}
        </h4>
        <p className="text-sm leading-relaxed" style={{ color: "#6F5E55" }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   App
────────────────────────────────────────────── */

export default function App() {
  const letterRef = useRef<HTMLDivElement>(null);
  const sectionTitleRefs = useRef<HTMLElement[]>([]);

  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const { data: slots } = useSlots();
  const createSlot = useCreateSlot();
  const removeSlot = useRemoveSlot();

  const [editMode, setEditMode] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Build a map of slot index -> photo URL
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!slots || slots.length === 0) return;
    let cancelled = false;

    async function buildUrls() {
      const config = await loadConfig();
      const newUrls: Record<number, string> = {};

      for (const slot of slots!) {
        if (!slot.blobId) continue;
        const hash = decodeBlobId(slot.blobId);
        if (!hash) continue;
        try {
          const agent = new HttpAgent({ host: config.backend_host });
          const sc = new StorageClient(
            config.bucket_name,
            config.storage_gateway_url,
            config.backend_canister_id,
            config.project_id,
            agent,
          );
          const url = await sc.getDirectURL(hash);
          newUrls[Number(slot.index)] = url;
        } catch {
          // skip
        }
      }

      if (!cancelled) setPhotoUrls(newUrls);
    }

    buildUrls();
    return () => {
      cancelled = true;
    };
  }, [slots]);

  const handleUpload = useCallback(
    async (slotIndex: number, file: File) => {
      if (!identity) return;
      setUploadingIndex(slotIndex);
      try {
        const config = await loadConfig();
        const agent = new HttpAgent({ host: config.backend_host, identity });
        if (config.backend_host?.includes("localhost")) {
          await agent.fetchRootKey().catch(() => {});
        }
        const sc = new StorageClient(
          config.bucket_name,
          config.storage_gateway_url,
          config.backend_canister_id,
          config.project_id,
          agent,
        );
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { hash } = await sc.putFile(bytes);

        const blobId = encodeBlobId(hash);
        await createSlot.mutateAsync({ index: slotIndex, blobId });
        const url = await sc.getDirectURL(hash);
        setPhotoUrls((prev) => ({ ...prev, [slotIndex]: url }));
        toast.success("Photo added! 💕");
      } catch (e) {
        console.error(e);
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploadingIndex(null);
      }
    },
    [identity, createSlot],
  );

  const handleRemove = useCallback(
    async (slotIndex: number) => {
      try {
        await removeSlot.mutateAsync(slotIndex);
        setPhotoUrls((prev) => {
          const next = { ...prev };
          delete next[slotIndex];
          return next;
        });
        toast.success("Photo removed");
      } catch {
        toast.error("Could not remove photo");
      }
    },
    [removeSlot],
  );

  const addSectionRef = (el: HTMLElement | null) => {
    if (el && !sectionTitleRefs.current.includes(el)) {
      sectionTitleRefs.current.push(el);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        }
      },
      { threshold: 0.2 },
    );
    for (const el of sectionTitleRefs.current) observer.observe(el);
    if (letterRef.current) {
      const lo = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && letterRef.current) {
            letterRef.current.classList.add("visible");
            lo.disconnect();
          }
        },
        { threshold: 0.25 },
      );
      lo.observe(letterRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: "#FBF7F0", minHeight: "100vh" }}>
      <Toaster position="top-center" />

      {/* ── NAV ── */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "rgba(251,247,240,0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(180,160,140,0.25)",
        }}
        data-ocid="nav.panel"
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            href="#home"
            className="flex items-center gap-2"
            style={{ textDecoration: "none" }}
            data-ocid="nav.link"
          >
            <span style={{ fontSize: "20px" }}>♥</span>
            <span
              className="font-serif"
              style={{
                fontVariant: "small-caps",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#1F1A17",
                letterSpacing: "0.08em",
              }}
            >
              Our Love Story
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link, i) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="nav-link"
                data-ocid={`nav.link.${i + 1}`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span
              className="font-script hidden sm:block"
              style={{ color: "#C9A24A", fontSize: "1.1rem", fontWeight: 600 }}
            >
              Happy Birthday! ❤️
            </span>
            {/* Auth button */}
            {isLoggedIn ? (
              <button
                type="button"
                onClick={clear}
                data-ocid="nav.toggle"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  background: "rgba(201,162,74,0.1)",
                  border: "1px solid rgba(201,162,74,0.4)",
                  borderRadius: "50px",
                  color: "#8B6D5A",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                }}
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={login}
                disabled={isLoggingIn}
                data-ocid="nav.button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  background: "rgba(201,162,74,0.1)",
                  border: "1px solid rgba(201,162,74,0.4)",
                  borderRadius: "50px",
                  color: "#8B6D5A",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  opacity: isLoggingIn ? 0.6 : 1,
                }}
              >
                <LogIn size={14} />
                <span className="hidden sm:inline">
                  {isLoggingIn ? "Logging in..." : "Login"}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        id="home"
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(160deg, #2B1E18 0%, #4A2828 35%, #6B3040 65%, #5A2435 100%)",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          overflow: "hidden",
          paddingTop: "64px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(20,10,8,0.6) 100%)",
            pointerEvents: "none",
          }}
        />
        <HeroParticles />
        <div
          style={{
            position: "absolute",
            top: "15%",
            right: "8%",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            border: "1px solid rgba(201,162,74,0.2)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "18%",
            right: "11%",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            border: "1px solid rgba(201,162,74,0.12)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 32px",
            position: "relative",
            zIndex: 2,
          }}
        >
          <p
            className="font-script animate-fade-up"
            style={{
              color: "#C9A24A",
              fontSize: "1.4rem",
              marginBottom: "12px",
              animationDelay: "0.1s",
            }}
          >
            A special message, just for you
          </p>
          <h1
            className="font-script animate-fade-up"
            style={{
              fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
              color: "#fff",
              lineHeight: 1.15,
              marginBottom: "24px",
              maxWidth: "700px",
              animationDelay: "0.25s",
              textShadow: "0 2px 20px rgba(0,0,0,0.4)",
            }}
          >
            Happy Birthday,
            <br />
            My Love 🎂
          </h1>
          <p
            className="animate-fade-up"
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              maxWidth: "500px",
              lineHeight: 1.7,
              marginBottom: "40px",
              animationDelay: "0.45s",
            }}
          >
            Wishing you all the happiness in the world on your special day —{" "}
            <span style={{ color: "#C9A24A", fontWeight: 600 }}>
              March 29th
            </span>
          </p>
          <div
            className="animate-pulse-heart animate-fade-up"
            style={{
              fontSize: "3.5rem",
              display: "inline-block",
              animationDelay: "0.6s",
            }}
          >
            💝
          </div>
          <div style={{ marginTop: "48px" }}>
            <a
              href="#memories"
              data-ocid="hero.primary_button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                background: "rgba(201,162,74,0.15)",
                border: "1px solid rgba(201,162,74,0.5)",
                borderRadius: "50px",
                color: "#C9A24A",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.95rem",
                transition: "background 0.25s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(201,162,74,0.28)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(201,162,74,0.15)";
              }}
            >
              See Our Memories ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── MEMORIES GALLERY ── */}
      <section
        id="memories"
        style={{
          padding: "96px 24px",
          background: "#F6F0E7",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {bgConfetti.map((c) => (
          <div
            key={c.id}
            style={{
              position: "absolute",
              width: `${c.w}px`,
              height: `${c.h}px`,
              background: "#C9A24A",
              borderRadius: "2px",
              opacity: c.opacity,
              top: `${c.top}%`,
              left: `${c.left}%`,
              transform: `rotate(${c.rotate}deg)`,
              pointerEvents: "none",
            }}
          />
        ))}

        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="text-center mb-16">
            <p
              className="font-script scroll-reveal"
              ref={addSectionRef}
              style={{
                color: "#C9A24A",
                fontSize: "1.2rem",
                marginBottom: "8px",
              }}
            >
              Captured in time
            </p>
            <h2
              className="font-serif scroll-reveal"
              ref={addSectionRef}
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                fontWeight: 700,
                color: "#1F1A17",
                transitionDelay: "0.1s",
              }}
            >
              Our Beautiful Memories
            </h2>
            <div
              style={{
                width: "60px",
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent, #C9A24A, transparent)",
                margin: "16px auto 0",
              }}
            />

            {/* Admin photo edit toggle */}
            {isLoggedIn && (
              <div style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setEditMode((v) => !v)}
                  data-ocid="memories.toggle"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 20px",
                    background: editMode
                      ? "rgba(201,162,74,0.25)"
                      : "rgba(201,162,74,0.1)",
                    border: "1px solid rgba(201,162,74,0.5)",
                    borderRadius: "50px",
                    color: "#8B6D5A",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    transition: "background 0.2s",
                  }}
                >
                  <Edit3 size={15} />
                  {editMode ? "Done Editing" : "Add Photos"}
                </button>
                {editMode && (
                  <p
                    style={{
                      marginTop: "8px",
                      color: "#8B6D5A",
                      fontSize: "0.8rem",
                    }}
                  >
                    Click any photo card to upload a picture
                  </p>
                )}
              </div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "32px",
              padding: "16px",
            }}
          >
            {memories.map((m, i) => (
              <PolaroidCard
                key={m.id}
                caption={m.caption}
                gradient={m.gradient}
                rotate={m.rotate}
                index={i}
                photoUrl={photoUrls[i + 1] ?? null}
                editMode={editMode}
                onUpload={(file) => handleUpload(i + 1, file)}
                onRemove={() => handleRemove(i + 1)}
                isUploading={uploadingIndex === i + 1}
              />
            ))}
          </div>
        </div>
      </section>
      <section
        id="lovenotes"
        style={{
          padding: "96px 24px",
          background: "#FBF7F0",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div className="text-center mb-14">
            <p
              className="font-script scroll-reveal"
              ref={addSectionRef}
              style={{
                color: "#C9A24A",
                fontSize: "1.2rem",
                marginBottom: "8px",
              }}
            >
              tiny things with big feelings
            </p>
            <h2
              className="font-serif scroll-reveal"
              ref={addSectionRef}
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                fontWeight: 700,
                color: "#1F1A17",
                transitionDelay: "0.1s",
              }}
            >
              Little Love Notes 💕
            </h2>
            <div
              style={{
                width: "60px",
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent, #C9A24A, transparent)",
                margin: "16px auto 0",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "28px",
            }}
          >
            {loveNotes.map((note, i) => (
              <LottieCard
                key={note.id}
                lottieUrl={note.lottieUrl}
                fallbackEmoji={note.fallbackEmoji}
                label={note.label}
                color={note.color}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>
      <section style={{ padding: "96px 24px", background: "#FBF7F0" }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "48px",
          }}
        >
          {/* ── TIMELINE ── */}
          <div
            id="journey"
            style={{
              background: "linear-gradient(160deg, #EADAD3, #E6D0CA)",
              borderRadius: "20px",
              padding: "40px 32px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
            }}
          >
            <p
              className="font-script scroll-reveal"
              ref={addSectionRef}
              style={{
                color: "#8B6D5A",
                fontSize: "1.1rem",
                marginBottom: "6px",
              }}
            >
              written in the stars
            </p>
            <h2
              className="font-serif scroll-reveal"
              ref={addSectionRef}
              style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                color: "#1F1A17",
                marginBottom: "36px",
                transitionDelay: "0.1s",
              }}
            >
              Our Journey
            </h2>
            <div style={{ position: "relative", paddingLeft: "52px" }}>
              <div className="timeline-line" />
              {milestones.map((m, i) => (
                <TimelineItem
                  key={m.id}
                  icon={m.icon}
                  date={m.date}
                  title={m.title}
                  desc={m.desc}
                  index={i}
                />
              ))}
            </div>
          </div>

          {/* ── LOVE LETTER ── */}
          <div
            id="letter"
            ref={letterRef}
            className="love-letter scale-reveal"
            style={{ borderRadius: "20px", padding: "44px 36px" }}
          >
            <p
              className="font-script"
              style={{
                color: "#C9A24A",
                fontSize: "1.1rem",
                marginBottom: "6px",
              }}
            >
              a letter from my heart
            </p>
            <h2
              className="font-serif"
              style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                color: "#1F1A17",
                marginBottom: "28px",
              }}
            >
              A Letter For You
            </h2>
            <div
              style={{
                width: "40px",
                height: "1px",
                background: "#C9A24A",
                marginBottom: "24px",
                opacity: 0.5,
              }}
            />
            <p
              className="font-script"
              style={{ fontSize: "1.25rem", lineHeight: 1.9, color: "#4A3830" }}
            >
              My dearest,
            </p>
            <p
              className="font-script"
              style={{
                fontSize: "1.15rem",
                lineHeight: 1.85,
                color: "#4A3830",
                marginTop: "16px",
              }}
            >
              I love you so much. I need you to know that — truly, deeply, with
              everything I have. You mean more to me than words can hold.
            </p>
            <p
              className="font-script"
              style={{
                fontSize: "1.15rem",
                lineHeight: 1.85,
                color: "#4A3830",
                marginTop: "16px",
              }}
            >
              It is because I want you — because I want us — that I am trying so
              hard. I pray for you every single day. I pray that you achieve
              everything you are working toward.
            </p>
            <p
              className="font-script"
              style={{
                fontSize: "1.15rem",
                lineHeight: 1.85,
                color: "#4A3830",
                marginTop: "16px",
              }}
            >
              Loving you has been one of the most genuine things I have ever
              felt — and no matter what, that will always be true.
            </p>
            <p
              className="font-script"
              style={{
                fontSize: "1.15rem",
                lineHeight: 1.85,
                color: "#4A3830",
                marginTop: "16px",
              }}
            >
              Today, on your birthday, I want you to know that whatever we are
              going through, my love for you is real and it is here.
            </p>
            <p
              className="font-script"
              style={{
                fontSize: "1.15rem",
                lineHeight: 1.85,
                color: "#4A3830",
                marginTop: "16px",
              }}
            >
              I hope you feel loved today. I hope you know that my heart is with
              you, even when things between us feel complicated.
            </p>
            <p
              className="font-script"
              style={{
                fontSize: "1.15rem",
                lineHeight: 1.85,
                color: "#4A3830",
                marginTop: "16px",
              }}
            >
              I pray for you to find every happiness you deserve — whether that
              is with me, or wherever life takes you.
            </p>
            <p
              className="font-script"
              style={{
                fontSize: "1.25rem",
                lineHeight: 1.85,
                color: "#4A3830",
                marginTop: "24px",
              }}
            >
              Happy Birthday, my love. I am rooting for you with everything I
              have. 💕
            </p>
            <div
              style={{
                marginTop: "32px",
                paddingTop: "20px",
                borderTop: "1px dashed rgba(201,162,74,0.3)",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <p
                className="font-script gold-shimmer"
                style={{ fontSize: "1.6rem", fontWeight: 600 }}
              >
                — With all my heart ♥
              </p>
            </div>
          </div>
        </div>
      </section>
      <footer
        style={{
          background: "linear-gradient(180deg, #EADAD3 0%, #E6D0CA 100%)",
          padding: "64px 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {footerHearts.map((h) => (
          <span
            key={h.id}
            className="footer-heart"
            style={
              {
                bottom: "20%",
                left: `${h.left}%`,
                fontSize: `${h.size}px`,
                "--duration": `${h.duration}s`,
                "--delay": `${h.delay}s`,
              } as React.CSSProperties
            }
          >
            {h.emoji}
          </span>
        ))}
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            className="animate-pulse-heart"
            style={{
              fontSize: "3rem",
              marginBottom: "16px",
              display: "inline-block",
            }}
          >
            🎂
          </div>
          <h2
            className="font-serif"
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              fontWeight: 700,
              color: "#1F1A17",
              marginBottom: "12px",
            }}
          >
            Happy Birthday! 🎂
          </h2>
          <p
            className="font-script"
            style={{
              color: "#C9A24A",
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            March 29th
          </p>
          <p
            style={{ color: "#6F5E55", fontSize: "1rem", marginBottom: "40px" }}
          >
            Made with love, just for you 💕
          </p>
          <div
            style={{
              width: "100%",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(201,162,74,0.4), transparent)",
              marginBottom: "24px",
            }}
          />
          <p style={{ color: "#8B7060", fontSize: "0.8rem" }}>
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#8B7060", textDecoration: "underline" }}
            >
              Built with love using caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
