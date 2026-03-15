import { useState, useEffect } from "react";

const styles = {
  container: {
    margin: 0, padding: "60px 20px", minHeight: "100vh",
    background: "linear-gradient(180deg, #001219 0%, #005f73 100%)",
    color: "#e9d8a6", display: "flex", flexDirection: "column", alignItems: "center",
    fontFamily: "'Sawarabi Mincho', serif",
  },
  // 🗾 日本地図（タイトルの上）
  mapHeader: {
    width: "100%", maxWidth: "240px", height: "auto",
    marginBottom: "30px", opacity: 0.8,
    filter: "drop-shadow(0 0 10px rgba(148, 210, 189, 0.4)) invert(1)",
  },
  card: {
    width: "100%", maxWidth: "360px", background: "rgba(0, 18, 25, 0.85)",
    backdropFilter: "blur(12px)", borderRadius: "30px", padding: "35px 25px",
    border: "1px solid rgba(148, 210, 189, 0.2)", marginBottom: "20px",
    textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
  },
  // 🌟【市松模様・完全抹殺】
  // 画像を「明るさ0、コントラスト1000%」にして一度真っ黒にし、
  // その後 sepia で無理やりオレンジ色に染め上げる力業
  inoAvatar: {
    width: "140px", height: "140px", margin: "0 auto",
    backgroundImage: "url(/image_a879fe.png)",
    backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center",
    // 呪いを解くフィルター
    filter: "brightness(0) saturate(100%) invert(67%) sepia(95%) saturate(3000%) hue-rotate(1deg) brightness(103%) contrast(106%) drop-shadow(0 0 10px #ee9b00)",
  },
  title: { fontSize: "1.9rem", color: "#ee9b00", margin: "20px 0 30px", fontWeight: "bold", lineHeight: "1.4" },
  stationName: { fontSize: "2.6rem", color: "#ee9b00", margin: "10px 0", fontWeight: "bold" },
  label: { fontSize: "0.85rem", color: "#94d2bd", letterSpacing: "0.15em" },
  value: { fontSize: "1.6rem", color: "#ffffff", marginTop: "5px" },
  input: { width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #94d2bd", background: "rgba(255,255,255,0.05)", color: "white", marginTop: "12px", boxSizing: "border-box" },
  button: { marginTop: "30px", padding: "14px 50px", borderRadius: "30px", background: "#ae2012", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "1.1rem" }
};

// 🌟 GAS URLをここに！
const FIXED_GAS_URL = "あなたのGAS URL";

export default function App() {
  const [config, setConfig] = useState({ sheetId: "", stride: "62" });
  const [data, setData] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ino_v6_final");
    if (saved) {
      const p = JSON.parse(saved);
      setConfig(p); setIsReady(true); load(p);
    }
  }, []);

  const load = async (c) => {
    try {
      const res = await fetch(`${FIXED_GAS_URL}?id=${c.sheetId}`);
      const json = await res.json(); setData(json);
    } catch (e) { console.error(e); }
  };

  const save = () => {
    if (!config.sheetId) return alert("スプレッドシートIDを入力してね");
    localStorage.setItem("ino_v6_final", JSON.stringify(config));
    setIsReady(true); load(config);
  };

  if (!isReady) {
    return (
      <div style={styles.container}>
        <img src="/map.png" style={styles.mapHeader} alt="日本地図" />
        <div style={styles.card}>
          <div style={styles.inoAvatar}></div>
          <h2 style={styles.title}>令和の伊能忠敬<br/>旅支度</h2>
          <div style={{textAlign: "left"}}>
            <p style={styles.label}>1. あなたの歩幅 (cm)</p>
            <input style={styles.input} type="number" value={config.stride} onChange={e => setConfig({...config, stride: e.target.value})} />
            <p style={{...styles.label, marginTop: "25px"}}>2. スプレッドシートID</p>
            <input style={styles.input} placeholder="16IY_wB0..." onChange={e => setConfig({...config, sheetId: e.target.value})} />
          </div>
          <button style={styles.button} onClick={save}>測量を開始する</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <img src="/map.png" style={{...styles.mapHeader, maxWidth: "120px", opacity: 0.3, marginBottom: "20px"}} alt="日本地図" />
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
      <button onClick={() => setIsReady(false)} style={{background: "none", border: "none", color: "#94d2bd", cursor: "pointer", textDecoration: "underline", fontSize: "0.9rem", marginTop: "10px"}}>支度をやり直す</button>
    </div>
  );
}
