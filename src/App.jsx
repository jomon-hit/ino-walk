import { useState, useEffect } from "react";

// --- デザイン設定：江戸の夜道をイメージしたダークテーマ ---
const styles = {
  container: {
    margin: 0, padding: "20px", minHeight: "100vh",
    background: "linear-gradient(180deg, #001219 0%, #005f73 100%)",
    color: "#e9d8a6", display: "flex", flexDirection: "column", alignItems: "center",
    fontFamily: "'Sawarabi Mincho', serif",
  },
  card: {
    width: "100%", maxWidth: "380px", background: "rgba(0, 18, 25, 0.85)",
    backdropFilter: "blur(12px)", borderRadius: "30px", padding: "30px 20px",
    border: "1px solid rgba(148, 210, 189, 0.2)", marginBottom: "20px",
    textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
  },
  // 🗾 透過地図：オレンジの円に代わるメインシンボル
  mapSymbol: {
    width: "200px", height: "auto", margin: "0 auto 15px",
    display: "block",
    filter: "drop-shadow(0 0 12px rgba(148, 210, 189, 0.6)) invert(1)",
  },
  title: { fontSize: "1.8rem", color: "#ee9b00", margin: "0 0 25px", fontWeight: "bold", lineHeight: "1.4" },
  stationName: { fontSize: "2.8rem", color: "#ee9b00", margin: "10px 0", fontWeight: "bold", letterSpacing: "0.1em" },
  label: { fontSize: "0.8rem", color: "#94d2bd", letterSpacing: "0.15em", marginBottom: "5px" },
  value: { fontSize: "1.5rem", color: "#ffffff", fontWeight: "500" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "20px", padding: "15px 0", borderTop: "1px solid rgba(148, 210, 189, 0.2)" },
  input: { width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #94d2bd", background: "rgba(255,255,255,0.05)", color: "white", marginTop: "12px", boxSizing: "border-box" },
  button: { marginTop: "30px", padding: "15px 50px", borderRadius: "30px", background: "#ae2012", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "1.1rem", boxShadow: "0 4px 15px rgba(174, 32, 18, 0.4)" }
};

// 🌟 確定したGAS URL
const FIXED_GAS_URL = "https://script.google.com/macros/s/AKfycbwQejve9JLBn5MOvzPN_bdIDIy5JGQqX-HIqA_UQAQFDSGaMeum5h-RNQ080sTvq9flSQ/exec";

export default function App() {
  const [config, setConfig] = useState({ sheetId: "", stride: "62" });
  const [data, setData] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ino_v12_final");
    if (saved) {
      const p = JSON.parse(saved);
      setConfig(p); setIsReady(true); load(p.sheetId);
    }
  }, []);

  const load = async (sheetId) => {
    setLoading(true);
    try {
      const res = await fetch(`${FIXED_GAS_URL}?id=${sheetId}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("通信エラー:", e);
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    if (!config.sheetId) return alert("スプレッドシートIDを入力してね");
    localStorage.setItem("ino_v12_final", JSON.stringify(config));
    setIsReady(true);
    load(config.sheetId);
  };

  // --- セットアップ画面（旅支度） ---
  if (!isReady) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <img src="/map.png" style={styles.mapSymbol} alt="日本地図" />
          <h2 style={styles.title}>令和の伊能忠敬<br/>旅支度</h2>
          <div style={{textAlign: "left"}}>
            <p style={styles.label}>1. あなたの歩幅 (cm)</p>
            <input style={styles.input} type="number" value={config.stride} onChange={e => setConfig({...config, stride: e.target.value})} />
            <p style={{...styles.label, marginTop: "20px"}}>2. スプレッドシートID</p>
            <input style={styles.input} placeholder="16IY_wB0..." value={config.sheetId} onChange={e => setConfig({...config, sheetId: e.target.value})} />
          </div>
          <button style={styles.button} onClick={save}>測量を開始する</button>
        </div>
      </div>
    );
  }

  // --- メインダッシュボード ---
  return (
    <div style={styles.container}>
      {/* メインカード：現在地 */}
      <div style={styles.card}>
        <img src="/map.png" style={{...styles.mapSymbol, width: "120px", opacity: 0.6, marginBottom: "10px"}} alt="" />
        <p style={styles.label}>現在の宿場</p>
        <div style={styles.stationName}>{loading ? "測量中..." : (data?.nowStation || "---")}</div>
        <p style={{color: "#94d2bd", fontSize: "0.9rem"}}>次は {data?.nextStation || "目的地を探索中"}</p>
      </div>

      {/* サブカード：累計データ */}
      <div style={{...styles.card, padding: "20px"}}>
        <div style={styles.grid}>
          <div style={{borderRight: "1px solid rgba(148, 210, 189, 0.2)"}}>
            <p style={styles.label}>累計歩数</p>
            <div style={styles.value}>{Number(data?.stepCount || 0).toLocaleString()}<span style={{fontSize: "0.8rem", marginLeft: "4px"}}>歩</span></div>
          </div>
          <div>
            <p style={styles.label}>累計距離</p>
            <div style={styles.value}>{data?.totalDist || 0}<span style={{fontSize: "0.8rem", marginLeft: "4px"}}>km</span></div>
          </div>
        </div>
      </div>

      {/* 誤差・お遊び要素 */}
      <div style={{...styles.card, background: "rgba(174, 32, 18, 0.15)", border: "1px solid rgba(174, 32, 18, 0.3)"}}>
        <p style={styles.label}>冒険の誤差 (GPSとの差)</p>
        <div style={{...styles.value, color: "#ee9b00", fontSize: "2rem"}}>+{data?.drift || 0} <span style={{fontSize: "1rem"}}>km</span></div>
        <p style={{fontSize: "0.75rem", color: "#94d2bd", marginTop: "5px"}}>寄り道の分だけ、世界は広がります</p>
      </div>

      <button onClick={() => setIsReady(false)} style={{background: "none", border: "none", color: "#94d2bd", cursor: "pointer", textDecoration: "underline", fontSize: "0.9rem", marginTop: "10px", opacity: 0.7}}>
        旅支度をやり直す
      </button>
    </div>
  );
}
