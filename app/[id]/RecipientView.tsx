"use client";

import { useEffect, useState } from "react";
import { MEMBERS } from "@/constants/members";

interface PublicMessage {
  id: string;
  writer: string;
  content: string;
  createdAt: number;
}

interface ApiState {
  released: boolean;
  count?: number;
  messages?: PublicMessage[];
}

type Mode = "single" | "bulk";

export default function RecipientView({
  recipientId,
  recipientName,
}: {
  recipientId: number;
  recipientName: string;
}) {
  const [state, setState] = useState<ApiState | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/message/${recipientId}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as ApiState;
      setState(data);
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientId]);

  if (loading) {
    return <p className="empty">불러오는 중...</p>;
  }

  if (!state) {
    return <p className="empty">잠시 후 다시 시도해 주세요 🙏</p>;
  }

  if (state.released) {
    return (
      <Feed
        recipientId={recipientId}
        messages={state.messages ?? []}
        onChange={load}
      />
    );
  }

  return (
    <WriteArea
      recipientId={recipientId}
      recipientName={recipientName}
      count={state.count ?? 0}
      onSent={load}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  공개 전: 카운트 + 작성 폼 (단일 / 일괄)                            */
/* ------------------------------------------------------------------ */
function WriteArea({
  recipientId,
  recipientName,
  count,
  onSent,
}: {
  recipientId: number;
  recipientName: string;
  count: number;
  onSent: () => void;
}) {
  const [mode, setMode] = useState<Mode>("single");
  const [writer, setWriter] = useState("");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  // 일괄 모드: 본인 이름만 빼고 전체 선택된 상태를 기본값으로 한다.
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(MEMBERS.filter((m) => m.id !== recipientId).map((m) => m.id))
  );
  const [status, setStatus] = useState<
    { type: "error" | "ok"; text: string } | null
  >(null);
  const [sending, setSending] = useState(false);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    setStatus(null);

    if (!writer.trim() || !content.trim()) {
      setStatus({ type: "error", text: "작성자와 내용을 입력해 주세요." });
      return;
    }
    if (!/^\d{4}$/.test(password.trim())) {
      setStatus({
        type: "error",
        text: "삭제용 비밀번호는 숫자 4자리로 입력해 주세요.",
      });
      return;
    }

    const recipientIds =
      mode === "single" ? [recipientId] : Array.from(selected);
    if (recipientIds.length === 0) {
      setStatus({ type: "error", text: "받는 사람을 선택해 주세요." });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientIds,
          writer: writer.trim(),
          content: content.trim(),
          password: password.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", text: data.error ?? "전송에 실패했어요." });
        return;
      }
      setStatus({
        type: "ok",
        text:
          mode === "single"
            ? "메시지를 전달했어요! 💌"
            : `${data.count}명에게 한 번에 전달했어요! 💌`,
      });
      setContent("");
      if (mode === "single") onSent();
    } catch {
      setStatus({ type: "error", text: "네트워크 오류가 발생했어요." });
    } finally {
      setSending(false);
    }
  }

  const allIds = MEMBERS.map((m) => m.id);

  return (
    <>
      <div className="card count-box">
        <div className="count-num">🔥 {count}</div>
        <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
          지금까지 <b>{count}개</b>의 메시지가 도착했어요
          <br />
          내용은 공개일에 다 함께 열어봐요 🤫
        </p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${mode === "single" ? "on" : ""}`}
          onClick={() => setMode("single")}
        >
          {recipientName}님에게
        </button>
        <button
          className={`tab ${mode === "bulk" ? "on" : ""}`}
          onClick={() => setMode("bulk")}
        >
          여러 명에게 한 번에
        </button>
      </div>

      <div className="card">
        {mode === "bulk" && (
          <div className="field">
            <label>받는 사람 선택</label>
            <p className="hint">
              전체에게 같은 글을 보낼 때 편해요. 본인 이름은 체크를 해제하세요.
            </p>
            <div className="select-actions">
              <button
                className="btn btn-ghost btn-small"
                onClick={() => setSelected(new Set(allIds))}
              >
                전체 선택
              </button>
              <button
                className="btn btn-ghost btn-small"
                onClick={() => setSelected(new Set())}
              >
                전체 해제
              </button>
              <span
                style={{
                  marginLeft: "auto",
                  color: "var(--muted)",
                  fontSize: 14,
                }}
              >
                {selected.size}명 선택됨
              </span>
            </div>
            <div className="select-list">
              {MEMBERS.map((m) => {
                const on = selected.has(m.id);
                return (
                  <label key={m.id} className={`chk ${on ? "on" : ""}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(m.id)}
                    />
                    {m.name}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="field">
          <label>작성자 이름</label>
          <input
            value={writer}
            onChange={(e) => setWriter(e.target.value)}
            placeholder="예) 지완"
            maxLength={20}
          />
        </div>

        <div className="field">
          <label>메시지 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="따뜻한 한마디를 남겨 주세요 :)"
            maxLength={1000}
          />
        </div>

        <div className="field">
          <label>삭제용 비밀번호 (숫자 4자리)</label>
          <input
            value={password}
            onChange={(e) =>
              setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            inputMode="numeric"
            placeholder="예) 1234"
            maxLength={4}
          />
          <p className="hint">
            공개 후 내 글을 지우고 싶을 때 필요해요. 꼭 기억해 주세요!
          </p>
        </div>

        {status && (
          <div
            className={`alert ${
              status.type === "error" ? "alert-error" : "alert-ok"
            }`}
          >
            {status.text}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <button className="btn" onClick={submit} disabled={sending}>
            {sending ? "전달 중..." : "마음 전하기 💌"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  공개 후: 피드 + 삭제                                               */
/* ------------------------------------------------------------------ */
function Feed({
  recipientId,
  messages,
  onChange,
}: {
  recipientId: number;
  messages: PublicMessage[];
  onChange: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(messageId: string) {
    setError(null);
    const password = window.prompt(
      "작성할 때 입력한 비밀번호(숫자 4자리)를 입력하세요."
    );
    if (password == null) return;

    setBusyId(messageId);
    try {
      const res = await fetch(`/api/message/${recipientId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "삭제에 실패했어요.");
        return;
      }
      onChange();
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setBusyId(null);
    }
  }

  if (messages.length === 0) {
    return <p className="empty">아직 도착한 메시지가 없어요 🥲</p>;
  }

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="feed">
        {messages.map((m) => (
          <article key={m.id} className="msg">
            <p className="content">{m.content}</p>
            <div className="foot">
              <span className="writer">— {m.writer}</span>
              <button
                className="btn btn-ghost btn-small"
                onClick={() => remove(m.id)}
                disabled={busyId === m.id}
              >
                {busyId === m.id ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
