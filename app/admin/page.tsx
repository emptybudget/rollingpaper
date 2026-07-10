"use client";

import { useState } from "react";
import Link from "next/link";

interface AdminMessage {
  writerId: number;
  writer: string;
  content: string;
}
interface AdminPerson {
  id: number;
  name: string;
  hasPassword: boolean;
  messages: AdminMessage[];
}

export default function AdminPage() {
  const [adminPassword, setAdminPassword] = useState("");
  const [people, setPeople] = useState<AdminPerson[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(action: string, extra: Record<string, unknown> = {}) {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword, action, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "요청에 실패했어요.");
    return data;
  }

  async function load() {
    setError(null);
    setBusy(true);
    try {
      const data = await call("list");
      setPeople(data.people ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteMessage(recipientId: number, writerId: number) {
    if (!window.confirm("이 메시지를 삭제할까요?")) return;
    setError(null);
    try {
      await call("deleteMessage", { recipientId, writerId });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function resetPassword(personId: number, name: string) {
    if (
      !window.confirm(
        `${name}님의 비밀번호를 초기화할까요?\n(다음에 입력하는 값으로 새로 정해져요)`
      )
    )
      return;
    setError(null);
    try {
      await call("resetPassword", { personId });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <main>
      <Link href="/" className="back">
        ← 메인으로
      </Link>
      <header className="hero" style={{ paddingTop: 8 }}>
        <h1>🔧 관리자</h1>
        <p>잘못 등록된 메시지 삭제 · 비밀번호 초기화</p>
      </header>

      {people === null ? (
        <div className="card">
          <div className="field">
            <label>관리자 비밀번호</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && adminPassword) void load();
              }}
              placeholder="관리자 비밀번호"
              autoFocus
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button
            className="btn"
            disabled={busy || !adminPassword}
            onClick={() => void load()}
          >
            {busy ? "확인 중..." : "들어가기"}
          </button>
        </div>
      ) : (
        <>
          {error && <div className="alert alert-error">{error}</div>}
          {people.map((p) => (
            <div className="card" key={p.id} style={{ marginTop: 14 }}>
              <div className="wizard-head">
                <span>
                  {p.name}{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                    (받은 메시지 {p.messages.length}개)
                  </span>
                </span>
                <button
                  className="btn btn-ghost btn-small"
                  onClick={() => void resetPassword(p.id, p.name)}
                  disabled={!p.hasPassword}
                >
                  {p.hasPassword ? "비번 초기화" : "비번 없음"}
                </button>
              </div>
              {p.messages.length > 0 && (
                <div className="feed" style={{ marginTop: 12 }}>
                  {p.messages.map((m) => (
                    <article key={m.writerId} className="msg">
                      <p className="content">{m.content}</p>
                      <div className="foot">
                        <span className="writer">— {m.writer}</span>
                        <button
                          className="btn btn-ghost btn-small"
                          onClick={() => void deleteMessage(p.id, m.writerId)}
                        >
                          삭제
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </main>
  );
}
