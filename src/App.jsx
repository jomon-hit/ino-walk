import { useState, useEffect } from "react";

// --- デザイン設定（市松模様を消し去り、余白を作る） ---
const styles = {
  container: {
    margin: 0, padding: "40px 20px", minHeight: "100vh", // 上の余白を増やしたよ
    background: "linear-gradient(180deg, #001219 0%, #005f73 100%)",
    color: "#e9d8a6", display: "flex", flexDirection: "column", alignItems: "center",
    fontFamily: "'Sawarabi Mincho', serif",
  },
  // 🗾 日本地図（タイトルの上に配置）
  mapHeader: {
    width: "100%", maxWidth: "260px", height: "auto",
    marginBottom: "20px", opacity: 0.8, // 下に余白(20px)を追加
    filter: "drop-shadow(0 0 12px rgba(148, 210, 189, 0.5)) invert(1)",
  },
  card: {
    width: "100%", maxWidth: "360px", background: "rgba(0, 18, 25, 0.85)",
    backdropFilter: "blur(12px)", borderRadius: "30px", padding: "30px 25px",
    border: "1px solid rgba(148, 210, 189, 0.2)", marginBottom: "20px",
    textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
  },
  // 🌟 市松模様キラー：背景をオレンジにして、画像で「形」だけを切り抜く
  inoAvatar: {
    width: "140px", height: "140px", margin: "0 auto",
    backgroundColor: "#ee9b00", // これがシルエットの色になる
    maskImage: "url(/image_a879fe.png)",
    WebkitMaskImage: "url(/image_a879fe.png)",
    maskSize: "contain", WebkitMaskSize: "contain",
    maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat",
    maskPosition: "center", WebkitMaskPosition: "center",
    filter: "drop-shadow(0 0 15px rgba(238, 155, 0, 0.6))",
  },
  title: { fontSize: "1.9rem", color: "#ee9b00", margin: "15px 0 25px", fontWeight: "bold", lineHeight: "1.4", letterSpacing: "0.1em" },
  stationName: { fontSize: "2.5rem", color: "#ee9b00", margin: "10px 0", fontWeight: "bold" },
  label: { fontSize: "0.85rem", color: "#94d2bd", letterSpacing: "0.1em", marginBottom: "5px" },
  value: { fontSize: "1.5rem", color: "#ffffff", marginTop: "5px" },
  input: { width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #94d2bd", background: "rgba(255,255,255,0.05)", color: "white", marginTop: "10px", boxSizing: "border-box", fontSize: "1rem" },
  button: { marginTop: "25px", padding: "14px 45px", borderRadius: "30px", background: "#ae2012", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "1.1rem", boxShadow: "0 4px 15px rgba(174, 32, 18, 0.4)" }
};

// 🌟 ここにあなたのGAS URLを貼る（隠蔽用）
const FIXED_GAS_URL = "ここにあなたのGAS URLを貼り付けて！";

export default function App() {
  const [config, setConfig] = useState({ sheetId: "", stride: "62" });
  const [data, setData] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ino_v4_final");
    if (saved) {
      const p = JSON.parse(saved);
      setConfig(p);
      setIsReady(true);
      load(p);
    }
  }, []);

  const load = async (c) => {
    try {
      const res = await fetch(`${FIXED_GAS_URL}?id=${c.sheetId}`);
      const json = await res.json();
      setData(json);
    } catch (e) { console.error(e); }
  };

  const save = () => {
    if (!config.sheetId) return alert("スプレッドシートIDを入力してね");
    localStorage.setItem("ino_v4_final", JSON.stringify(config));
    setIsReady(true);
    load(config);
  };

  if (!isReady) {
    return (
      <div style={styles.container}>
        <img src="/map.png" style={styles.mapHeader} alt="日本地図" />
        <div style={styles.card}>
          <div style={styles.inoAvatar}></div>
          <h2 style={styles.title}>令和の伊能忠敬<br/>旅支度</h2>
          <div style={{textAlign: "left", marginTop: "10px"}}>
            <p style={styles.label}>1. あなたの歩幅 (cm)</p>
            <input style={styles.input} type="number" value={config.stride} onChange={e => setConfig({...config, stride: e.target.value})} />
            <p style={{...styles.label, marginTop: "20px"}}>2. スプレッドシートID</p>
            <input style={styles.input} placeholder="16IY_wB0..." onChange={e => setConfig({...config, sheetId: e.target.value})} />
          </div>
          <button style={styles.button} onClick={save}>測量を開始する</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <img src="/map.png" style={{...styles.mapHeader, maxWidth: "120px", opacity: 0.3, marginBottom: "10px"}} alt="日本地図" />
      <div style={styles.card}>
        <div style={styles.inoAvatar}></div>
        <p style={styles.label}>現在の宿場</p>
        <div style={styles.stationName}>{data?.nowStation || "測量中..."}</div>
        <div style={{color: "#94d2bd", fontSize: "1.1rem"}}>次は {data?.nextStation || "---"}</div>
      </div>
      <div style={{...styles.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "20px"}}>
        <div><div style={styles.label}>累計歩数</div><div style={styles.value}>{data?.stepCount?.toLocaleString() || "--"}</div></div>
        <div><div style={styles.label}>累計距離</div><div style={styles.value}>{data?.totalDist || "--"} km</div></div>
      </div>
      <div style={{...styles.card, background: "rgba(174, 32, 18, 0.2)"}}>
        <div style={styles.label}>測量誤差 (GPSとの差)</div>
        <div style={{...styles.value, color: "#e9d8a6", fontSize: "2.3rem"}}>＋{data?.drift || 0} km</div>
      </div>
      <button onClick={() => setIsReady(false)} style={{background: "none", border: "none", color: "#94d2bd", cursor: "pointer", textDecoration: "underline", fontSize: "0.9rem"}}>支度をやり直す</button>
    </div>
  );
}
