"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MEMBERS } from "@/constants/members";

interface PublicMessage {
  writerId: number;
  writer: string;
  content: string;
  updatedAt: number;
}

export default function RecipientView({
  recipientId,
  recipientName,
  released,
}: {
  recipientId: number;
  recipientName: string;
  released: boolean;
}) {
  if (released) {
    return <ReceivedFeed recipientId={recipientId} />;
  }
  return <WriterFlow writerId={recipientId} writerName={recipientName} />;
}

/* ================================================================== */
/*  공개 전 — 작성자 플로우 (비밀번호 → 34명 순서대로 작성)            */
/* ================================================================== */

type SaveStatus = "idle" | "saving" | "saved" | "error";

function WriterFlow({
  writerId,
  writerName,
}: {
  writerId: number;
  writerName: string;
}) {
  const others = MEMBERS.filter((m) => m.id !== writerId);
  const pwStorageKey = `rp_pw_${writerId}`;

  const [step, setStep] = useState<"auth" | "write">("auth");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const savedRef = useRef<Record<number, string>>({}); // 서버에 저장된 최신값
  const [index, setIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [finished, setFinished] = useState(false);

  const current = others[index];

  // 같은 기기에서 재방문 시 비밀번호 자동 입력 → 자동 이어쓰기
  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem(pwStorageKey)
        : null;
    if (saved) {
      setPassword(saved);
      void authenticate(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function authenticate(pw: string) {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await fetch("/api/writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writerId, password: pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "확인에 실패했어요.");
        window.localStorage.removeItem(pwStorageKey);
        return;
      }
      const loaded = (data.drafts ?? {}) as Record<number, string>;
      setDrafts(loaded);
      savedRef.current = { ...loaded };
      window.localStorage.setItem(pwStorageKey, pw);
      setStep("write");
    } catch {
      setAuthError("네트워크 오류가 발생했어요.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function saveField(recipientId: number): Promise<boolean> {
    const content = drafts[recipientId] ?? "";
    if ((savedRef.current[recipientId] ?? "") === content) return true; // 변경 없음
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/writer/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writerId, recipientId, content, password }),
      });
      if (!res.ok) {
        setSaveStatus("error");
        return false;
      }
      savedRef.current[recipientId] = content;
      setSaveStatus("saved");
      return true;
    } catch {
      setSaveStatus("error");
      return false;
    }
  }

  // 타이핑이 멈추면 1.2초 뒤 자동 저장(중간 저장)
  useEffect(() => {
    if (step !== "write") return;
    const id = current.id;
    if ((drafts[id] ?? "") === (savedRef.current[id] ?? "")) return;
    const t = setTimeout(() => {
      void saveField(id);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts, current, step]);

  async function goTo(nextIndex: number) {
    await saveField(current.id); // 이동 전 저장
    setSaveStatus("idle");
    setIndex(nextIndex);
  }

  async function handleFinish() {
    await saveField(current.id);
    setFinished(true);
  }

  /* ---------- 화면: 비밀번호 ---------- */
  if (step === "auth") {
    return (
      <div className="card">
        <div className="field">
          <label>나만의 비밀번호 (숫자 4자리)</label>
          <p className="hint">
            이 비밀번호로 <b>작성한 내용이 저장</b>되고, 나중에 다시 들어와
            이어서 쓸 수 있어요. 처음이라면 새로 정해 주세요.
          </p>
          <input
            value={password}
            onChange={(e) =>
              setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && /^\d{4}$/.test(password))
                void authenticate(password);
            }}
            inputMode="numeric"
            placeholder="예) 1234"
            maxLength={4}
            autoFocus
          />
        </div>
        {authError && <div className="alert alert-error">{authError}</div>}
        <button
          className="btn"
          disabled={authLoading || !/^\d{4}$/.test(password)}
          onClick={() => void authenticate(password)}
        >
          {authLoading ? "확인 중..." : "시작하기"}
        </button>
      </div>
    );
  }

  /* ---------- 화면: 작성 완료 ---------- */
  const doneCount = others.filter(
    (m) => (drafts[m.id] ?? "").trim() !== ""
  ).length;

  if (finished) {
    return (
      <div className="card count-box">
        <div className="count-num">🎉 {doneCount}</div>
        <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
          총 {others.length}명 중 <b>{doneCount}명</b>에게 마음을 남겼어요.
          <br />
          내용은 자동 저장됐고, 공개일에 다 함께 열어봐요!
          <br />
          언제든 다시 들어와 이어서 쓸 수 있어요.
        </p>
        <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setFinished(false)}
          >
            다시 훑어보기
          </button>
          <Link href="/" className="btn" style={{ textDecoration: "none" }}>
            명단으로
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- 화면: 순서대로 작성 ---------- */
  const isLast = index === others.length - 1;
  const isFirst = index === 0;

  return (
    <>
      {/* 진행 상황 */}
      <div className="card" style={{ paddingBottom: 16 }}>
        <div className="wizard-head">
          <span>
            {index + 1} / {others.length}
          </span>
          <span className="save-status">
            {saveStatus === "saving" && "저장 중..."}
            {saveStatus === "saved" && "저장됨 ✓"}
            {saveStatus === "error" && "저장 실패 (다시 시도돼요)"}
          </span>
        </div>
        <div className="progress">
          <div
            className="progress-bar"
            style={{ width: `${((index + 1) / others.length) * 100}%` }}
          />
        </div>
        <p className="hint" style={{ marginTop: 10 }}>
          작성한 내용은 <b>자동으로 저장</b>돼요. 중간에 그만둬도 괜찮아요!
        </p>
      </div>

      {/* 현재 대상 작성 */}
      <div className="card">
        <label style={{ fontSize: 18 }}>
          <span style={{ color: "var(--primary-dark)" }}>{current.name}</span>
          님에게
        </label>
        <textarea
          value={drafts[current.id] ?? ""}
          onChange={(e) =>
            setDrafts((prev) => ({ ...prev, [current.id]: e.target.value }))
          }
          onBlur={() => void saveField(current.id)}
          placeholder={`${current.name}님에게 하고 싶은 말을 편하게 적어주세요 :)`}
          maxLength={1000}
          autoFocus
        />

        <div className="nav-row">
          <button
            className="btn btn-ghost"
            onClick={() => void goTo(index - 1)}
            disabled={isFirst}
          >
            ← 이전
          </button>
          {isLast ? (
            <button className="btn" onClick={() => void handleFinish()}>
              작성 완료 🎉
            </button>
          ) : (
            <button className="btn" onClick={() => void goTo(index + 1)}>
              다음 →
            </button>
          )}
        </div>
      </div>

      {/* 전체 한눈에 보기 + 아무나 눌러 이동 */}
      <div className="card">
        <label>전체 명단 ({doneCount}명 작성됨)</label>
        <p className="hint">이름을 누르면 그 사람에게 바로 이동해요.</p>
        <div className="select-list" style={{ marginTop: 10 }}>
          {others.map((m, i) => {
            const written = (drafts[m.id] ?? "").trim() !== "";
            const isCur = i === index;
            return (
              <button
                key={m.id}
                className={`chk ${written ? "on" : ""}`}
                style={
                  isCur ? { outline: "2px solid var(--primary)" } : undefined
                }
                onClick={() => void goTo(i)}
              >
                {written ? "✓ " : ""}
                {m.name}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ================================================================== */
/*  공개 후 — 도착한 메시지 피드                                       */
/* ================================================================== */

function ReceivedFeed({ recipientId }: { recipientId: number }) {
  const [messages, setMessages] = useState<PublicMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/message/${recipientId}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "불러오지 못했어요.");
          return;
        }
        setMessages(data.messages ?? []);
      } catch {
        setError("네트워크 오류가 발생했어요.");
      }
    })();
  }, [recipientId]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (messages === null) return <p className="empty">불러오는 중...</p>;
  if (messages.length === 0)
    return <p className="empty">아직 도착한 메시지가 없어요 🥲</p>;

  return (
    <>
      <div className="banner" style={{ marginTop: 8 }}>
        💌 총 {messages.length}개의 메시지가 도착했어요
      </div>
      <div className="feed">
        {messages.map((m) => (
          <article key={m.writerId} className="msg">
            <p className="content">{m.content}</p>
            <div className="foot">
              <span className="writer">— {m.writer}</span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
