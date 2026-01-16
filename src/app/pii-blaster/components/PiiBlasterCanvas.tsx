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

const GAME_SECONDS = 60;

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
  "Company blog",
  "Office location",
  "Public roadmap",
  "Event invitation",
  "Training schedule",
  "Webinar recording",
  "User guide",
  "FAQ page",
  "Help article",
  "Public pricing",
  "Feature overview",
  "Release notes",
  "Community forum",
  "Open source license",
  "Support hours",
  "Contact page",
  "Public announcement",
  "Brand guidelines",
];


const PII = [
  "Facial geometry",
  "Voice signature",
  "SSN",
  "Date of birth",
  "GPS location",
  "Vehicle VIN",
  "License plate",
  "Email address",
  "Login credentials",
];

const CONF = ["Customer contract", "Payroll sheet", "Incident report", "Source code", "Pricing strategy"];

// Colors are intentionally NOT correlated with SAFE/PII/CONF
const ITEM_COLORS = ["#1f2937", "#334155", "#4b5563", "#3f3f46", "#0f766e", "#1d4ed8", "#7c3aed", "#9a3412"];

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function circleHitsBullet(item: FallingItem, bullet: Bullet) {
  const dx = item.x - bullet.x;
  const dy = item.y - bullet.y;
  const rr = item.r + bullet.r;
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
  const spawnMsRef = useRef(660);
  const baseVyRef = useRef(90);
  const lastSpawnRef = useRef(0);
  const lastShotRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    function resize() {
      const parent = canvas.parentElement!;
      const w = parent.clientWidth;


      // ✅ Give more vertical play space (taller canvas)
      // You can tweak these numbers, but this already feels much better.
      const desired = 720;
      const maxByViewport = Math.max(520, window.innerHeight - 220);
      const h = Math.min(desired, maxByViewport);

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
      if (roll < 0.6) {
        type = "SAFE";
        label = pick(SAFE);
      } else if (roll < 0.80) {
        type = "PII";
        label = pick(PII);
      } else {
        type = "CONF";
        label = pick(CONF);
      }

      const r = 34;
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

    function shoot(nowMs: number, shipY: number) {
      if (nowMs - lastShotRef.current < 160) return;
      lastShotRef.current = nowMs;

      bulletsRef.current.push({
        id: idCounter.current++,
        x: shipXRef.current,
        y: shipY - 18, // ✅ always relative to bottom
        r: 4,
        vy: -520,
      });
    }

    function tick(now: number) {
      const dt = Math.min((now - lastT) / 1000, 0.03);
      lastT = now;

      const w = parseFloat(canvas.style.width);
      const h = parseFloat(canvas.style.height);

      // ✅ ship sits at the bottom of the canvas now, no matter the height
      const shipY = h - 30;

      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, GAME_SECONDS - elapsed);

      const rampStart = 45;
      const rampElapsed = Math.max(0, elapsed - rampStart);

      // difficulty ramp starts after 45s
      spawnMsRef.current = Math.max(180, 600 - rampElapsed * 14);
      baseVyRef.current = 90 + rampElapsed * 6;


      // ship move
      const shipSpeed = 520;
      if (keysRef.current.left) shipXRef.current -= shipSpeed * dt;
      if (keysRef.current.right) shipXRef.current += shipSpeed * dt;
      shipXRef.current = clamp(shipXRef.current, 18, w - 18);

      // shoot
      if (keysRef.current.shoot) shoot(performance.now(), shipY);

      // spawn
      if (now - lastSpawnRef.current > spawnMsRef.current) {
        lastSpawnRef.current = now;
        spawnItem(now, w);
      }

      bulletsRef.current = bulletsRef.current
        .map((b) => ({ ...b, y: b.y + b.vy * dt }))
        .filter((b) => b.y > -30);

      itemsRef.current = itemsRef.current
        .map((it) => ({ ...it, y: it.y + it.vy * dt }))
        .filter((it) => it.y < h + 120);

      // collisions (one bullet = one hit)
      const remainingItems: FallingItem[] = [];
      const bulletsToRemove = new Set<number>();

      for (const it of itemsRef.current) {
        let hitByBulletId: number | null = null;

        for (const b of bulletsRef.current) {
          if (bulletsToRemove.has(b.id)) continue;

          if (circleHitsBullet(it, b)) {
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
      ctx.font = "18px ui-sans-serif, system-ui";
      ctx.fillText(`Time: ${Math.ceil(remaining)}s`, 16, 28);
      ctx.fillText(`Score: ${scoreRef.current}`, 16, 54);

      // ship
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(shipXRef.current, shipY - 18);
      ctx.lineTo(shipXRef.current - 14, shipY + 10);
      ctx.lineTo(shipXRef.current + 14, shipY + 10);
      ctx.closePath();
      ctx.fill();

      // bullets
      ctx.fillStyle = "#ffffff";
      for (const b of bulletsRef.current) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // items (circles + wrapped-ish label)
      for (const it of itemsRef.current) {
        // circle
        ctx.fillStyle = it.bg;
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
        ctx.stroke();

        // label (simple 2-line split at space)
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px ui-sans-serif, system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const parts = it.label.split(" ");
        if (parts.length <= 1) {
          ctx.fillText(it.label, it.x, it.y);
        } else {
          const mid = Math.ceil(parts.length / 2);
          const line1 = parts.slice(0, mid).join(" ");
          const line2 = parts.slice(mid).join(" ");
          ctx.fillText(line1, it.x, it.y - 8);
          ctx.fillText(line2, it.x, it.y + 8);
        }

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
