import { useState, useEffect } from "react";

const styles = {
  container: {
    margin: 0, padding: "20px", minHeight: "100vh",
    background: "linear-gradient(180deg, #001219 0%, #005f73 100%)",
    color: "#e9d8a6", display: "flex", flexDirection: "column", alignItems: "center",
    fontFamily: "'Sawarabi Mincho', serif",
  },
  card: {
    width: "100%", maxWidth: "360px", background: "rgba(0, 18, 25, 0.8)",
    backdropFilter: "blur(12px)", borderRadius: "30px", padding: "30px 25px",
    border: "1px solid rgba(148, 210, 189, 0.2)", marginTop: "40px",
    textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
  },
  // 🗾 透過地図をシンボルとしてカード内に配置
  mapSymbol: {
    width: "180px", height: "auto", margin: "0 auto 20px",
    display: "block",
    filter: "drop-shadow(0 0 10px rgba(148, 210, 189, 0.5)) invert(1)",
  },
  title: { fontSize: "1.8rem", color: "#ee9b00", margin: "0 0 25px", fontWeight: "bold", lineHeight: "1.4" },
  label: { fontSize: "0.85rem", color: "#94d2bd", letterSpacing: "0.15em" },
  input: { width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #94d2bd", background: "rgba(255,255,255,0.05)", color: "white", marginTop: "12px", boxSizing: "border-box" },
  button: { marginTop: "30px", padding: "14px 50px", borderRadius: "30px", background: "#ae2012", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "1.1rem" }
};

// 🌟 GAS URL
const FIXED_GAS_URL = "ここにあなたのGAS URLを貼り付けてね";

export default function App() {
  const [config, setConfig] = useState({ sheetId: "", stride: "62" });
  const [data, setData] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ino_v11_final");
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
    localStorage.setItem("ino_v11_final", JSON.stringify(config));
    setIsReady(true); load(config);
  };

  if (!isReady) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          {/* カードの中、タイトルの上に透過地図を配置 */}
          <img src="/map.png" style={styles.mapSymbol} alt="日本地図" />
          
          <h2 style={styles.title}>令和の伊能忠敬<br/>旅支度</h2>
          
          <div style={{textAlign: "left"}}>
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
      <div style={styles.card}>
        <img src="/map.png" style={{...styles.mapSymbol, width: "120px", opacity: 0.6}} alt="" />
        <p style={styles.label}>現在の宿場</p>
        <div style={{fontSize: "2.6rem", color: "#ee9b00", fontWeight: "bold"}}>{data?.nowStation || "..."}</div>
      </div>
      {/* 統計グリッドや誤差のカードをここに続ける */}
      <button onClick={() => setIsReady(false)} style={{background: "none", border: "none", color: "#94d2bd", cursor: "pointer", textDecoration: "underline", fontSize: "0.9rem", marginTop: "20px"}}>支度をやり直す</button>
    </div>
  );
}
