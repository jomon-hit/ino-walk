import { useState, useEffect } from "react";

// --- デザイン設定（日本地図を夜空に浮かび上がらせる） ---
const styles = {
  container: {
    margin: 0, padding: "20px", minHeight: "100vh",
    // 紺色から深緑へのグラデーション（夜明け前の空）
    background: "linear-gradient(180deg, #001219 0%, #005f73 100%)",
    color: "#e9d8a6", display: "flex", flexDirection: "column", alignItems: "center",
    fontFamily: "'Sawarabi Mincho', serif",
  },
  
  // 🗾 日本地図（透過画像をそのまま使う）
  mapSilhouette: {
    width: "100%", maxWidth: "400px", height: "120px",
    // 🌟 ここで透過地図を読み込む（オレンジの円の代わりに）
    background: "url(https://raw.githubusercontent.com/jomo-nee/ino-walk/main/public/map_silhouette.png) no-repeat center/contain", // GitHub上の地図画像パス
    filter: "drop-shadow(0 0 15px rgba(148, 210, 189, 0.4))", // 地図全体をふわっと光らせる
    marginBottom: "20px", // タイトルと少し重ねる
  },

  card: {
    width: "100%", maxWidth: "360px", background: "rgba(0, 18, 25, 0.75)",
    backdropFilter: "blur(12px)", borderRadius: "30px", padding: "25px",
    border: "1px solid rgba(148, 210, 189, 0.2)", marginBottom: "20px",
    textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
  },
  
  // オレンジ色に光るシルエット（透過地図に差し替えたので、不要なら消してもOK）
  // inoAvatar: {
  //   width: "140px", height: "140px", margin: "0 auto",
  //   backgroundColor: "#ee9b00",
  //   WebkitMaskImage: "url(https://raw.githubusercontent.com/jomo-nee/ino-walk/main/public/image_a879fe.png)", // GitHub上の伊能さん画像パス
  //   WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center",
  //   filter: "drop-shadow(0 0 12px rgba(238, 155, 0, 0.5))",
  // },

  title: { fontSize: "2rem", color: "#ee9b00", margin: "10px 0 20px", fontWeight: "bold", lineHeight: "1.2", letterSpacing: "0.05em" },
  stationName: { fontSize: "2.4rem", color: "#ee9b00", margin: "10px 0", fontWeight: "bold" },
  label: { fontSize: "0.8rem", color: "#94d2bd", letterSpacing: "0.1em" },
  value: { fontSize: "1.4rem", color: "#ffffff", marginTop: "5px" },
  input: { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #94d2bd", background: "rgba(255,255,255,0.05)", color: "white", marginTop: "10px", boxSizing: "border-box" },
  button: { marginTop: "20px", padding: "12px 40px", borderRadius: "25px", background: "#ae2012", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }
};

// 🌟 じょもねぇのGAS URL（もらった人には見せない）
const FIXED_GAS_URL = "ここにデプロイしたGASのURLを貼ってね";

export default function App() {
  const [config, setConfig] = useState({ sheetId: "", stride: "62" });
  const [data, setData] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ino_pref_reiva");
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
    if (!config.sheetId) return alert("スプレッドシートIDを入れてね");
    localStorage.setItem("ino_pref_reiva", JSON.stringify(config));
    setIsReady(true);
    load(config);
  };

  if (!isReady) {
    return (
      <div style={styles.container}>
        {/* 最上部：透過日本地図（オレンジの円の代わりに） */}
        <div style={styles.mapSilhouette}></div>

        <div style={styles.card}>
          {/* 伊能さんのシルエットは、地図に差し替えたので不要なら消してもOK */}
          {/* <div style={styles.inoAvatar}></div> */}
          <h2 style={styles.title}>令和の伊能忠敬<br/>旅支度</h2>
          <div style={{textAlign: "left", marginTop: "20px"}}>
            <p style={styles.label}>あなたの歩幅 (cm)</p>
            <input style={styles.input} type="number" value={config.stride} onChange={e => setConfig({...config, stride: e.target.value})} />
            
            <p style={{...styles.label, marginTop: "20px"}}>スプレッドシートID</p>
            <p style={{fontSize: "0.6rem", color: "#94d2bd"}}>※配布されたシートURLの英数字部分をコピー</p>
            <input style={styles.input} placeholder="例: 16IY_wB0..." onChange={e => setConfig({...config, sheetId: e.target.value})} />
          </div>
          <button style={styles.button} onClick={save}>測量を開始する</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* メイン画面にも地図を入れるなら、ここにも `mapSilhouette` を置けばOK */}
      
      <div style={styles.card}>
        <div style={styles.inoAvatar}></div>
        <p style={styles.label}>現在の宿場</p>
        <div style={styles.stationName}>{data?.nowStation || "測量中..."}</div>
        <div style={{color: "#94d2bd"}}>次は {data?.nextStation || "---"}</div>
      </div>

      <div style={{...styles.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "20px"}}>
        <div>
          <div style={styles.label}>累計歩数</div>
          <div style={styles.value}>{data?.stepCount?.toLocaleString() || "--"}</div>
        </div>
        <div>
          <div style={styles.label}>累計距離</div>
          <div style={styles.value}>{data?.totalDist || "--"} km</div>
        </div>
      </div>

      <div style={{...styles.card, background: "rgba(174, 32, 18, 0.2)"}}>
        <div style={styles.label}>冒険の誤差 (GPSとの差)</div>
        <div style={{...styles.value, color: "#e9d8a6", fontSize: "2.2rem"}}>
          ＋{data?.drift || 0} km
        </div>
        <p style={{fontSize: "0.7rem", color: "#94d2bd"}}>寄り道の証です</p>
      </div>

      <button onClick={() => setIsReady(false)} style={{background: "none", border: "none", color: "#94d2bd", cursor: "pointer", textDecoration: "underline"}}>
        支度をやり直す
      </button>
    </div>
  );
}
