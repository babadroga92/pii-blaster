"use client";

import { useEffect, useMemo, useRef } from "react";

type ItemType = "SAFE" | "PII" | "CONF";

type FallingItem = {
  id: number;
  x: number;
  y: number;
  r: number;
  vy: number;
  label: string;
  type: ItemType;
  bg: string; // randomized color not tied to type
};

type Bullet = {
  id: number;
  x: number;
  y: number;
  r: number;
  vy: number;
};

export type GameResult = {
  score: number;
  safeHits: number;
  piiHits: number;
  confHits: number;
};

const GAME_SECONDS = 25;

const SAFE = [
  "Weather forecast",
  "Public website",
  "Cafeteria menu",
  "Press release",
  "Product brochure",
  "Holiday calendar",
  "Job posting",
  "Social media post",
  "Public API docs",
  "Conference agenda",
  "Building hours",
  "Marketing slogan",
  "Earnings announcement",
  "Company blog",
];
const PII = ["Email address", "Phone number", "Home address", "Date of birth", "Passport #"];
const CONF = ["Customer contract", "Payroll sheet", "Incident report", "Source code", "M&A notes"];

// Colors are intentionally NOT correlated with SAFE/PII/CONF
const ITEM_COLORS = ["#1f2937", "#334155", "#4b5563", "#3f3f46", "#0f766e", "#1d4ed8", "#7c3aed", "#9a3412"];

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function circlesOverlap(ax: number, ay: number, ar: number, bx: number, by: number, br: number) {
  const dx = ax - bx;
  const dy = ay - by;
  const rr = ar + br;
  return dx * dx + dy * dy <= rr * rr;
}

export default function PiiBlasterCanvas({ onFinish }: { onFinish: (r: GameResult) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const itemsRef = useRef<FallingItem[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const shipXRef = useRef(0);
  const keysRef = useRef({ left: false, right: false, shoot: false });

  const scoreRef = useRef(0);
  const safeHitsRef = useRef(0);
  const piiHitsRef = useRef(0);
  const confHitsRef = useRef(0);

  const startedAt = useMemo(() => Date.now(), []);

  const idCounter = useRef(1);
  const spawnMsRef = useRef(600);
  const baseVyRef = useRef(90);
  const lastSpawnRef = useRef(0);
  const lastShotRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    function resize() {
      const parent = canvas.parentElement!;
      const w = Math.min(parent.clientWidth, 900);
      const h = 520;

      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      shipXRef.current = w / 2;
    }

    resize();
    window.addEventListener("resize", resize);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = true;
      if (e.key === " " || e.key === "Enter") keysRef.current.shoot = true;
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = false;
      if (e.key === " " || e.key === "Enter") keysRef.current.shoot = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    function onPointerMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      shipXRef.current = e.clientX - rect.left;
    }
    function onPointerDown() {
      keysRef.current.shoot = true;
    }
    function onPointerUp() {
      keysRef.current.shoot = false;
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    let lastT = performance.now();

    function spawnItem(nowMs: number, w: number) {
      const roll = Math.random();
      let type: ItemType;
      let label: string;

      // 50% safe, 25% pii, 25% conf
      if (roll < 0.5) {
        type = "SAFE";
        label = pick(SAFE);
      } else if (roll < 0.75) {
        type = "PII";
        label = pick(PII);
      } else {
        type = "CONF";
        label = pick(CONF);
      }

      const r = 34; // circle radius (tweak: 28-38)
      const x = r + Math.random() * (w - r * 2);
      const y = -r - 10;

      const vy = baseVyRef.current + Math.random() * 40;
      const bg = pick(ITEM_COLORS);

      itemsRef.current.push({
        id: idCounter.current++,
        x,
        y,
        r,
        vy,
        label,
        type,
        bg,
      });
    }

    function shoot(nowMs: number) {
      if (nowMs - lastShotRef.current < 160) return;
      lastShotRef.current = nowMs;

      bulletsRef.current.push({
        id: idCounter.current++,
        x: shipXRef.current,
        y: 470,
        r: 4,
        vy: -520,
      });
    }

    function tick(now: number) {
      const dt = Math.min((now - lastT) / 1000, 0.03);
      lastT = now;

      const w = parseFloat(canvas.style.width);
      const h = parseFloat(canvas.style.height);

      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, GAME_SECONDS - elapsed);

      // difficulty ramp
      spawnMsRef.current = Math.max(180, 600 - elapsed * 14);
      baseVyRef.current = 90 + elapsed * 6;

      // ship move
      const shipSpeed = 520;
      if (keysRef.current.left) shipXRef.current -= shipSpeed * dt;
      if (keysRef.current.right) shipXRef.current += shipSpeed * dt;
      shipXRef.current = Math.max(18, Math.min(w - 18, shipXRef.current));

      // shoot
      if (keysRef.current.shoot) shoot(performance.now());

      // spawn
      if (now - lastSpawnRef.current > spawnMsRef.current) {
        lastSpawnRef.current = now;
        spawnItem(now, w);
      }

      // update bullets
      bulletsRef.current = bulletsRef.current
        .map((b) => ({ ...b, y: b.y + b.vy * dt }))
        .filter((b) => b.y > -20);

      // update items
      itemsRef.current = itemsRef.current
        .map((it) => ({ ...it, y: it.y + it.vy * dt }))
        .filter((it) => it.y < h + 100);

      // collisions (one bullet = one hit)
      const remainingItems: FallingItem[] = [];
      const bulletsToRemove = new Set<number>();

      for (const it of itemsRef.current) {
        let hitByBulletId: number | null = null;

        for (const b of bulletsRef.current) {
          if (bulletsToRemove.has(b.id)) continue;

          if (circlesOverlap(it.x, it.y, it.r, b.x, b.y, b.r)) {
            hitByBulletId = b.id;

            if (it.type === "SAFE") {
              scoreRef.current += 10;
              safeHitsRef.current += 1;
            } else if (it.type === "PII") {
              scoreRef.current -= 15;
              piiHitsRef.current += 1;
            } else {
              scoreRef.current -= 20;
              confHitsRef.current += 1;
            }
            break;
          }
        }

        if (hitByBulletId !== null) {
          bulletsToRemove.add(hitByBulletId);
        } else {
          remainingItems.push(it);
        }
      }

      itemsRef.current = remainingItems;
      bulletsRef.current = bulletsRef.current.filter((b) => !bulletsToRemove.has(b.id));

      // draw
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0b0b0b";
      ctx.fillRect(0, 0, w, h);

      // HUD
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px ui-sans-serif, system-ui";
      ctx.fillText(`Time: ${Math.ceil(remaining)}s`, 14, 24);
      ctx.fillText(`Score: ${scoreRef.current}`, 14, 44);
      ctx.fillText(`← → / A D move · Space/Enter shoot`, 14, 64);

      // ship (triangle)
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(shipXRef.current, 485);
      ctx.lineTo(shipXRef.current - 14, 510);
      ctx.lineTo(shipXRef.current + 14, 510);
      ctx.closePath();
      ctx.fill();

      // bullets
      ctx.fillStyle = "#ffffff";
      for (const b of bulletsRef.current) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // items (circles + centered text)
      for (const it of itemsRef.current) {
        ctx.fillStyle = it.bg;
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
ctx.font = "13px ui-sans-serif, system-ui";
ctx.textAlign = "center";
ctx.textBaseline = "middle";

const words = it.label.split(" ");

if (words.length === 1) {
  // Single word
  ctx.fillText(words[0], it.x, it.y);
} else {
  // Two lines max
  const line1 = words[0];
  const line2 = words.slice(1).join(" ");

  ctx.fillText(line1, it.x, it.y - 7);
  ctx.fillText(line2.length > 14 ? line2.slice(0, 13) + "…" : line2, it.x, it.y + 7);
}

// reset defaults
ctx.textAlign = "start";
ctx.textBaseline = "alphabetic";

      }

      // end
      if (remaining <= 0) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;

        onFinish({
          score: scoreRef.current,
          safeHits: safeHitsRef.current,
          piiHits: piiHitsRef.current,
          confHits: confHitsRef.current,
        });
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onFinish, startedAt]);

  return (
    <div className="rounded-xl border p-3 bg-white">
      <canvas ref={canvasRef} />
    </div>
  );
}
