"use client";
import { useEffect, useRef, useState } from "react";
import { bookmarkApi, getLocalUserId } from "@/app/lib/api";

const UPLOADS_BASE = "http://localhost:8080/uploads";
const POSITION_SAVE_INTERVAL = 5000; // 5초마다 재생 위치 저장

interface Bookmark {
  bookmarkId: number;
  positionSeconds: number;
  note: string;
}

interface Props {
  lessonId?: number;
  videoUrl?: string;
  title?: string;
  resumePosition?: number;       // 이어보기 위치 (초)
  onTimeUpdate?: (seconds: number) => void; // 재생 위치 콜백 (부모에 전달)
}

export default function VideoPlayer({ lessonId, videoUrl, title, resumePosition, onTimeUpdate }: Props) {
  const src = videoUrl ? `${UPLOADS_BASE}/${videoUrl}` : null;
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const userId = getLocalUserId(0);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  // 이어보기: 영상이 로드되면 마지막 위치로 이동
  useEffect(() => {
    if (videoRef.current && resumePosition && resumePosition > 0) {
      videoRef.current.currentTime = resumePosition;
    }
  }, [resumePosition, src]);

  // 북마크 목록 로드
  useEffect(() => {
    if (!lessonId) return;
    bookmarkApi.getLessonBookmarks(lessonId, userId)
      .then(setBookmarks)
      .catch(() => {});
  }, [lessonId]);

  // 재생 위치 자동 저장 (5초마다)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onTimeUpdate) return;

    const handleTimeUpdate = () => {
      if (saveTimer.current) return; // 이미 타이머 실행 중
      saveTimer.current = setTimeout(() => {
        onTimeUpdate(Math.floor(video.currentTime));
        saveTimer.current = null;
      }, POSITION_SAVE_INTERVAL);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [onTimeUpdate, src]);

  // 북마크 추가
  const handleAddBookmark = async () => {
    if (!videoRef.current || !lessonId) return;
    const position = Math.floor(videoRef.current.currentTime);
    try {
      const bm = await bookmarkApi.addBookmark(lessonId, {
        userId,
        positionSeconds: position,
        note: bookmarkNote,
      });
      setBookmarks((prev) => [...prev, bm].sort((a, b) => a.positionSeconds - b.positionSeconds));
      setBookmarkNote("");
      setShowNoteInput(false);
    } catch (e: any) {
      alert("북마크 추가 실패: " + e.message);
    }
  };

  // 북마크 삭제
  const handleDeleteBookmark = async (bookmarkId: number) => {
    await bookmarkApi.deleteBookmark(bookmarkId, userId);
    setBookmarks((prev) => prev.filter((b) => b.bookmarkId !== bookmarkId));
  };

  // 북마크 위치로 이동
  const seekTo = (seconds: number) => {
    if (videoRef.current) videoRef.current.currentTime = seconds;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
      {src ? (
        <>
          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, background: "#000" }}>
            <video
              ref={videoRef}
              key={src}
              controls
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "#000" }}
            >
              <source src={src} type="video/mp4" />
            </video>
          </div>

          {/* 북마크 툴바 */}
          <div style={{ background: "#1a1a2e", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* 북마크 추가 */}
            {!showNoteInput ? (
              <button
                onClick={() => setShowNoteInput(true)}
                style={{ background: "rgba(32,180,134,0.2)", color: "#20B486", border: "1px solid #20B486", borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}
              >
                🔖 북마크 추가
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  value={bookmarkNote}
                  onChange={(e) => setBookmarkNote(e.target.value)}
                  placeholder="메모 (선택)"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "6px 10px", color: "#fff", fontSize: 13, width: 140 }}
                  onKeyDown={(e) => e.key === "Enter" && handleAddBookmark()}
                />
                <button
                  onClick={handleAddBookmark}
                  style={{ background: "#20B486", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}
                >
                  추가
                </button>
                <button
                  onClick={() => setShowNoteInput(false)}
                  style={{ background: "none", color: "#888", border: "none", cursor: "pointer", fontSize: 13 }}
                >
                  취소
                </button>
              </div>
            )}

            {/* 북마크 목록 토글 */}
            {bookmarks.length > 0 && (
              <button
                onClick={() => setShowBookmarks(!showBookmarks)}
                style={{ background: "none", color: "#aaa", border: "none", cursor: "pointer", fontSize: 13 }}
              >
                {showBookmarks ? "▲" : "▼"} 북마크 {bookmarks.length}개
              </button>
            )}
          </div>

          {/* 북마크 목록 */}
          {showBookmarks && bookmarks.length > 0 && (
            <div style={{ background: "#12122a", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {bookmarks.map((bm) => (
                <div key={bm.bookmarkId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => seekTo(bm.positionSeconds)}
                    style={{ background: "rgba(32,180,134,0.15)", color: "#20B486", border: "none", borderRadius: 5, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600, flexShrink: 0 }}
                  >
                    {formatTime(bm.positionSeconds)}
                  </button>
                  <span style={{ color: "#ccc", fontSize: 13, flex: 1 }}>{bm.note || "메모 없음"}</span>
                  <button
                    onClick={() => handleDeleteBookmark(bm.bookmarkId)}
                    style={{ background: "none", color: "#666", border: "none", cursor: "pointer", fontSize: 14 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, background: "#1a1a2e" }}>
          <div style={{ width: 72, height: 72, background: "rgba(32,180,134,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
            ▶
          </div>
          <p style={{ color: "#aaa", fontSize: 15 }}>
            {title ? "업로드된 영상이 없습니다." : "레슨을 선택하세요"}
          </p>
        </div>
      )}
    </div>
  );
}
