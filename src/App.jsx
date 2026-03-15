import { useState, useEffect } from "react";

const styles = {
  container: {
    margin: 0, padding: "20px", minHeight: "100vh",
    background: "linear-gradient(180deg, #001219 0%, #005f73 100%)",
    color: "#e9d8a6", display: "flex", flexDirection: "column", alignItems: "center",
    fontFamily: "'Sawarabi Mincho', serif",
  },
  card: {
    width: "100%", maxWidth: "360px", 
    background: "rgba(0, 18, 25, 0.8)", 
    backdropFilter: "blur(12px)", 
    borderRadius: "30px", padding: "20px 25px 35px",
    border: "1px solid rgba(148, 210, 189, 0.2)", 
    marginTop: "40px",
    textAlign: "center", 
    boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
    position: "relative",
  },
  // 🗾 日本地図：小さくしてカード内の最上部に配置
  mapSmall: {
    width: "140px", // 逆に小さく！
    height: "auto",
    margin: "0 auto 10px", // 下に少し余白
    display: "block",
    opacity: 0.9,
    filter: "drop-shadow(0 0 8px rgba(148, 210, 189, 0.5)) invert(1)",
  },
  // 🟠 伊能さん（地図の下に並べる）
  inoAvatar: {
    width: "100px", height: "100px", margin: "0 auto 15px",
    backgroundColor: "#ee9b00", borderRadius: "50%",
    boxShadow: "0 0 15px rgba(238, 155, 0, 0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.8rem", color: "#001219", fontWeight: "bold"
  },
  title: { fontSize: "1.7rem", color: "#ee9b00", margin: "0 0 25px", fontWeight: "bold", lineHeight: "1.3" },
  label: { fontSize: "0.85rem", color: "#94d2bd", letterSpacing: "0.1em" },
  input: { width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #94d2bd", background: "rgba(255,255,255,0.05)", color: "white", marginTop: "10px", boxSizing: "border-box" },
  button: { marginTop: "25px", padding: "14px 45px", borderRadius: "25px", background: "#ae2012", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "1.1rem" }
};

// 🌟 GAS URLをここに
const FIXED_GAS_URL = "あなたのGAS URL";

export default function App() {
  const [config, setConfig] = useState({ sheetId: "", stride: "62" });
  const [data, setData] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ino_v9_final");
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
    if (!config.sheetId) return alert("スプレッドシートIDを入れてね");
    localStorage.setItem("ino_v9_final", JSON.stringify(config));
    setIsReady(true); load(config);
  };

  if (!isReady) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          {/* カードの中、一番上に地図を配置 */}
          <img src="/map.png" style={styles.mapSmall} alt="日本地図" />
          
          <div style={styles.inoAvatar}>旅支度中</div>
          
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
        <img src="/map.png" style={{...styles.mapSmall, width: "80px", opacity: 0.5}} alt="" />
        <div style={styles.inoAvatar}>測量中</div>
        <p style={styles.label}>現在の宿場</p>
        <div style={{fontSize: "2.4rem", color: "#ee9b00", fontWeight: "bold"}}>{data?.nowStation || "..."}</div>
      </div>
    </div>
  );
}
