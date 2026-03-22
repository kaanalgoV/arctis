import { useEffect, useRef } from "react";
import type { FeedItem } from "./Dashboard";

export function LiveFeed({ items }: { items: FeedItem[] }) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [items.length]);

  return (
    <div className="live-feed">
      <div className="live-feed__header">
        <span className="live-feed__dot" />
        Live Feed
      </div>
      <div className="live-feed__list" ref={listRef}>
        {items.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", textAlign: "center", padding: "2rem 0" }}>
            Warte auf Analyse-Daten...
          </div>
        )}
        {items.map((item) => (
          <div key={item.id} className={`live-feed__item live-feed__item--${item.severity}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className={`live-feed__severity live-feed__severity--${item.severity}`}>
                {item.severity === "stop" ? "STOP" : item.severity === "caution" ? "WARN" : item.severity === "ok" ? "OK" : "INFO"}
              </span>
              <span className="live-feed__time">{item.time}</span>
            </div>
            <div className="live-feed__message">{item.message}</div>
          </div>
        ))}
      </div>
      <div className="live-feed__count">
        {items.length} Hinweise
      </div>
    </div>
  );
}
