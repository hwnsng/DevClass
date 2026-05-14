interface Lesson {
  lessonId: number;
  title: string;
  order: number;
  description?: string;
}

interface Props {
  lessons: Lesson[];
  currentLessonId?: number;
  completedCount: number;
  totalCount: number;
  percent: number;
  onSelect: (lesson: Lesson) => void;
}

export default function LessonSidebar({
  lessons,
  currentLessonId,
  completedCount,
  totalCount,
  percent,
  onSelect,
}: Props) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        height: "fit-content",
      }}
    >
      {/* 사이드바 헤더 + 진도율 */}
      <div style={{ background: "#1a1a2e", padding: "18px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>강의 목록</h3>
          <span style={{ color: "#20B486", fontSize: 13, fontWeight: 700 }}>
            {completedCount}/{totalCount}강 완료
          </span>
        </div>
        {/* 진도 바 */}
        <div style={{ height: 5, background: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${percent}%`,
            background: "#20B486",
            borderRadius: 3,
            transition: "width 0.5s ease",
          }} />
        </div>
        <div style={{ textAlign: "right", marginTop: 5 }}>
          <span style={{ color: "#20B486", fontSize: 12, fontWeight: 700 }}>{percent}%</span>
        </div>
      </div>

      {lessons.map((l, i) => {
        const isCompleted = l.order <= completedCount;
        const isCurrent = l.lessonId === currentLessonId;
        return (
          <div
            key={l.lessonId}
            onClick={() => onSelect(l)}
            style={{
              padding: "15px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              background: isCurrent ? "#e8f5f0" : "#fff",
              borderLeft: isCurrent ? "4px solid #20B486" : "4px solid transparent",
              borderBottom: i < lessons.length - 1 ? "1px solid #f5f5f5" : "none",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isCurrent) (e.currentTarget as HTMLDivElement).style.background = "#fafafa";
            }}
            onMouseLeave={(e) => {
              if (!isCurrent) (e.currentTarget as HTMLDivElement).style.background = "#fff";
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
                background: isCompleted ? "#20B486" : isCurrent ? "#e8f5f0" : "#f0f0f0",
                color: isCompleted ? "#fff" : isCurrent ? "#20B486" : "#aaa",
                border: isCurrent && !isCompleted ? "2px solid #20B486" : "none",
              }}
            >
              {isCompleted ? "✓" : l.order}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? "#20B486" : "#333",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {l.title}
              </div>
              {isCurrent && (
                <div style={{ fontSize: 11, color: "#20B486", marginTop: 2 }}>▶ 재생 중</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
