import { useState, useEffect } from "react";

const PASTEL = {
  bg: "#F5F0EB",
  card: "#FDFAF7",
  sage: "#B8C9B0",
  blush: "#D4B8B0",
  lavender: "#C4B8D4",
  cream: "#EDE4D8",
  text: "#3D3530",
  muted: "#8A7F79",
  border: "#E0D8D0",
  booked: "#B8C9B0",
  empty: "#F0EBE6",
  damage: "#D4B8B0",
  accent: "#A09080",
};

const SUBJECTS = [
  { id: "s1", name: "Mathematics", code: "MATH101", instructor: "Dr. Sharma" },
  { id: "s2", name: "Physics", code: "PHY201", instructor: "Prof. Mehta" },
  { id: "s3", name: "Chemistry", code: "CHEM101", instructor: "Dr. Patel" },
  { id: "s4", name: "Computer Science", code: "CS301", instructor: "Prof. Gupta" },
];

const ROWS = 5;
const COLS = 6;

function generateSeats(bookedMap = {}, damageMap = {}) {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      const id = `${String.fromCharCode(65 + r)}${c + 1}`;
      return {
        id,
        row: r,
        col: c,
        booked: bookedMap[id] || null,
        damaged: damageMap[id] || false,
      };
    })
  );
}

const DEMO_STUDENTS = {
  "STU001": { name: "Aarav Shah", rollNo: "STU001", phone: "9876543210", email: "aarav@edu.in" },
  "STU002": { name: "Priya Mehta", rollNo: "STU002", phone: "9876543211", email: "priya@edu.in" },
};

export default function App() {
  const [screen, setScreen] = useState("signup");
  const [user, setUser] = useState(null);
  const [signupData, setSignupData] = useState({ name: "", rollNo: "", phone: "", email: "" });
  const [loginData, setLoginData] = useState({ rollNo: "", phone: "" });
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [allSeats, setAllSeats] = useState({});
  const [attendance, setAttendance] = useState({});
  const [toast, setToast] = useState(null);
  const [damageModal, setDamageModal] = useState(null);
  const [damageText, setDamageText] = useState("");
  const [seatInfo, setSeatInfo] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [animating, setAnimating] = useState(false);

  const lectures = selectedSubject
    ? Array.from({ length: 6 }, (_, i) => ({
        id: `L${i + 1}`,
        label: `Lecture ${i + 1}`,
        date: new Date(2026, 2, i + 2).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      }))
    : [];

  const seatKey = selectedSubject && selectedLecture ? `${selectedSubject.id}_${selectedLecture.id}` : null;
  const seats = seatKey ? (allSeats[seatKey] || generateSeats()) : generateSeats();

  function showToast(msg, type = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }

  function navigate(to) {
    setAnimating(true);
    setTimeout(() => {
      setScreen(to);
      setAnimating(false);
    }, 200);
  }

  function handleSignup() {
    if (!signupData.name || !signupData.rollNo || !signupData.phone || !signupData.email) {
      showToast("Please fill all fields", "error");
      return;
    }
    setUser({ ...signupData });
    navigate("home");
    showToast(`Welcome, ${signupData.name}! 🎓`, "success");
  }

  function handleLogin() {
    const found = DEMO_STUDENTS[loginData.rollNo];
    if (found && loginData.phone === found.phone) {
      setUser(found);
      navigate("home");
      showToast(`Welcome back, ${found.name}!`, "success");
    } else if (loginData.rollNo === signupData.rollNo && loginData.phone === signupData.phone && signupData.name) {
      setUser({ ...signupData });
      navigate("home");
      showToast(`Welcome back, ${signupData.name}!`, "success");
    } else {
      showToast("Invalid credentials", "error");
    }
  }

  function bookSeat(seat) {
    if (!seatKey) return;
    if (seat.damaged) { showToast("This seat is reported damaged", "error"); return; }
    if (seat.booked) {
      if (seat.booked.rollNo === user.rollNo) {
        const updated = JSON.parse(JSON.stringify(allSeats[seatKey] || generateSeats()));
        updated[seat.row][seat.col].booked = null;
        setAllSeats(prev => ({ ...prev, [seatKey]: updated }));
        setAttendance(prev => {
          const key = `${selectedSubject.id}_${selectedLecture.id}`;
          const arr = (prev[selectedSubject.id] || []).filter(k => k !== key);
          return { ...prev, [selectedSubject.id]: arr };
        });
        showToast("Seat cancelled", "info");
      } else {
        setSeatInfo(seat.booked);
      }
      return;
    }
    const updated = JSON.parse(JSON.stringify(allSeats[seatKey] || generateSeats()));
    // cancel any previous seat in this lecture
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (updated[r][c].booked?.rollNo === user.rollNo)
          updated[r][c].booked = null;

    updated[seat.row][seat.col].booked = { name: user.name, rollNo: user.rollNo, phone: user.phone };
    setAllSeats(prev => ({ ...prev, [seatKey]: updated }));
    setAttendance(prev => {
      const key = `${selectedSubject.id}_${selectedLecture.id}`;
      const arr = [...new Set([...(prev[selectedSubject.id] || []), key])];
      return { ...prev, [selectedSubject.id]: arr };
    });
    showToast(`Seat ${seat.id} booked! ✓`, "success");
  }

  function reportDamage() {
    if (!damageModal || !damageText.trim()) { showToast("Please describe the issue", "error"); return; }
    const updated = JSON.parse(JSON.stringify(allSeats[seatKey] || generateSeats()));
    updated[damageModal.row][damageModal.col].damaged = true;
    setAllSeats(prev => ({ ...prev, [seatKey]: updated }));
    showToast(`Damage reported for ${damageModal.id}`, "success");
    setDamageModal(null);
    setDamageText("");
  }

  const attendanceCount = (subId) => (attendance[subId] || []).length;
  const attendancePct = (subId) => Math.round((attendanceCount(subId) / 6) * 100);

  const dm = darkMode;
  const bg = dm ? "#1E1A17" : PASTEL.bg;
  const card = dm ? "#2A2420" : PASTEL.card;
  const textColor = dm ? "#EDE4D8" : PASTEL.text;
  const mutedColor = dm ? "#A09080" : PASTEL.muted;
  const borderColor = dm ? "#3D3530" : PASTEL.border;

  const styles = {
    app: { minHeight: "100vh", background: bg, color: textColor, fontFamily: "'Nunito', 'Quicksand', sans-serif", transition: "all 0.3s ease", position: "relative" },
    screen: { maxWidth: 420, margin: "0 auto", padding: "0 0 80px", minHeight: "100vh", opacity: animating ? 0 : 1, transform: animating ? "translateY(8px)" : "translateY(0)", transition: "all 0.2s ease" },
    header: { padding: "20px 24px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    title: { fontSize: 28, fontWeight: 800, letterSpacing: -0.5, color: textColor },
    subtitle: { fontSize: 13, color: mutedColor, fontWeight: 500 },
    card: { background: card, borderRadius: 20, padding: "20px 24px", margin: "0 16px 14px", border: `1px solid ${borderColor}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" },
    input: { width: "100%", padding: "13px 16px", borderRadius: 14, border: `1.5px solid ${borderColor}`, background: dm ? "#251F1C" : PASTEL.cream, color: textColor, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border 0.2s" },
    btn: { width: "100%", padding: "15px", borderRadius: 16, border: "none", background: PASTEL.accent, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3, transition: "transform 0.15s, box-shadow 0.15s" },
    btnGhost: { background: "transparent", border: `1.5px solid ${borderColor}`, color: textColor, width: "100%", padding: "13px", borderRadius: 16, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
    label: { display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: mutedColor, letterSpacing: 0.5, textTransform: "uppercase" },
    tag: (color) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: color + "33", color: color, border: `1px solid ${color}55` }),
    navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: card, borderTop: `1px solid ${borderColor}`, display: "flex", justifyContent: "space-around", padding: "10px 0 20px", zIndex: 100 },
    navItem: (active) => ({ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", opacity: active ? 1 : 0.45, color: active ? PASTEL.accent : mutedColor, transition: "opacity 0.2s" }),
  };

  // Font import
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // ---- SCREENS ----

  if (screen === "signup") return (
    <div style={styles.app}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" />
      <div style={styles.screen}>
        <div style={{ ...styles.header, justifyContent: "flex-end" }}>
          <button onClick={() => setDarkMode(!dm)} style={{ background: dm ? PASTEL.accent : PASTEL.cream, border: "none", borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontSize: 14, color: dm ? "#fff" : textColor, fontWeight: 600 }}>{dm ? "☀️ Light" : "🌙 Dark"}</button>
        </div>
        <div style={{ padding: "10px 24px 30px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
          <h1 style={{ ...styles.title, fontSize: 34, marginBottom: 4 }}>Sign Up</h1>
          <p style={{ color: mutedColor, fontSize: 14 }}>Create your student account</p>
        </div>
        <div style={styles.card}>
          {[["Name", "name", "text", "Your full name"], ["Roll / ID Number", "rollNo", "text", "e.g. STU2024001"], ["Phone Number", "phone", "tel", "10-digit number"], ["Email", "email", "email", "your@email.com"]].map(([label, key, type, ph]) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={styles.label}>{label}</label>
              <input style={styles.input} type={type} placeholder={ph} value={signupData[key]}
                onChange={e => setSignupData(p => ({ ...p, [key]: e.target.value }))} />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>
            <label style={styles.label}>ID Photo</label>
            <div style={{ ...styles.input, display: "flex", alignItems: "center", gap: 10, color: mutedColor, cursor: "pointer" }}>
              <span>📷</span><span style={{ fontSize: 14 }}>Upload ID photo</span>
            </div>
          </div>
          <button style={styles.btn} onClick={handleSignup}>Create Account</button>
          <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: mutedColor }}>
            Already have an account?{" "}
            <span onClick={() => navigate("login")} style={{ color: PASTEL.accent, fontWeight: 700, cursor: "pointer" }}>Sign In</span>
          </p>
        </div>
      </div>
      {toast && <Toast toast={toast} />}
    </div>
  );

  if (screen === "login") return (
    <div style={styles.app}>
      <div style={styles.screen}>
        <div style={{ ...styles.header, justifyContent: "flex-end" }}>
          <button onClick={() => setDarkMode(!dm)} style={{ background: dm ? PASTEL.accent : PASTEL.cream, border: "none", borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontSize: 14, color: dm ? "#fff" : textColor, fontWeight: 600 }}>{dm ? "☀️" : "🌙"}</button>
        </div>
        <div style={{ padding: "10px 24px 30px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👋</div>
          <h1 style={{ ...styles.title, fontSize: 34, marginBottom: 4 }}>Welcome Back</h1>
          <p style={{ color: mutedColor, fontSize: 14 }}>Sign in to your account</p>
        </div>
        <div style={styles.card}>
          {[["Roll / ID Number", "rollNo", "text", "e.g. STU001"], ["Phone Number", "phone", "tel", "Registered phone"]].map(([label, key, type, ph]) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={styles.label}>{label}</label>
              <input style={styles.input} type={type} placeholder={ph} value={loginData[key]}
                onChange={e => setLoginData(p => ({ ...p, [key]: e.target.value }))} />
            </div>
          ))}
          <p style={{ fontSize: 12, color: mutedColor, marginBottom: 16, background: dm ? "#2A2420" : PASTEL.cream, padding: "8px 12px", borderRadius: 10 }}>
            💡 Try: Roll <b>STU001</b>, Phone <b>9876543210</b>
          </p>
          <button style={styles.btn} onClick={handleLogin}>Sign In</button>
          <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: mutedColor }}>
            New here?{" "}
            <span onClick={() => navigate("signup")} style={{ color: PASTEL.accent, fontWeight: 700, cursor: "pointer" }}>Create Account</span>
          </p>
        </div>
      </div>
      {toast && <Toast toast={toast} />}
    </div>
  );

  if (!user) { navigate("signup"); return null; }

  // HOME
  if (screen === "home") return (
    <div style={styles.app}>
      <div style={styles.screen}>
        <div style={{ ...styles.header, paddingBottom: 0 }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: mutedColor }}>Good day,</p>
            <h2 style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800 }}>{user.name} 👋</h2>
          </div>
          <button onClick={() => setDarkMode(!dm)} style={{ background: dm ? PASTEL.accent : PASTEL.cream, border: "none", borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: dm ? "#fff" : textColor, fontWeight: 600 }}>{dm ? "☀️" : "🌙"}</button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 10, margin: "20px 16px 0" }}>
          {[
            { label: "Subjects", val: SUBJECTS.length, icon: "📚" },
            { label: "Avg. Attendance", val: `${Math.round(SUBJECTS.reduce((a, s) => a + attendancePct(s.id), 0) / SUBJECTS.length)}%`, icon: "📊" },
            { label: "Roll No", val: user.rollNo, icon: "🪪" },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: card, borderRadius: 16, padding: "14px 10px", textAlign: "center", border: `1px solid ${borderColor}` }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 18, marginTop: 4 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: mutedColor, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "24px 16px 8px" }}>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: 17 }}>Your Subjects</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: mutedColor }}>Tap to book seats for lectures</p>
        </div>

        {SUBJECTS.map(sub => {
          const pct = attendancePct(sub.id);
          const color = pct >= 75 ? PASTEL.sage : pct >= 50 ? "#D4C87A" : PASTEL.blush;
          return (
            <div key={sub.id} style={{ ...styles.card, cursor: "pointer" }}
              onClick={() => { setSelectedSubject(sub); setSelectedLecture(null); navigate("lectures"); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{sub.name}</div>
                  <div style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>{sub.code} · {sub.instructor}</div>
                </div>
                <span style={styles.tag(color)}>{pct}%</span>
              </div>
              <div style={{ marginTop: 12, background: borderColor, borderRadius: 8, height: 6, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 8, transition: "width 0.6s ease" }} />
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: mutedColor }}>{attendanceCount(sub.id)} / 6 lectures attended</div>
            </div>
          );
        })}
      </div>

      <NavBar screen={screen} navigate={navigate} styles={styles} />
      {toast && <Toast toast={toast} />}
    </div>
  );

  // LECTURES
  if (screen === "lectures") return (
    <div style={styles.app}>
      <div style={styles.screen}>
        <div style={{ ...styles.header, paddingBottom: 0 }}>
          <div>
            <span onClick={() => navigate("home")} style={{ fontSize: 13, color: PASTEL.accent, cursor: "pointer", fontWeight: 700 }}>← Back</span>
            <h2 style={{ margin: "4px 0 0", fontWeight: 800, fontSize: 22 }}>{selectedSubject?.name}</h2>
            <p style={{ margin: 0, fontSize: 12, color: mutedColor }}>{selectedSubject?.code} · {selectedSubject?.instructor}</p>
          </div>
        </div>

        <div style={{ padding: "20px 16px 8px" }}>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>Select a Lecture</h3>
        </div>

        {lectures.map(lec => {
          const key = `${selectedSubject.id}_${lec.id}`;
          const attended = (attendance[selectedSubject.id] || []).includes(key);
          const seatData = allSeats[key];
          const myseat = seatData ? seatData.flat().find(s => s.booked?.rollNo === user.rollNo) : null;
          return (
            <div key={lec.id} style={{ ...styles.card, cursor: "pointer", borderLeft: `4px solid ${attended ? PASTEL.sage : borderColor}` }}
              onClick={() => { setSelectedLecture(lec); navigate("seats"); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{lec.label}</div>
                  <div style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>{lec.date}</div>
                  {myseat && <div style={{ fontSize: 12, color: PASTEL.sage, marginTop: 4, fontWeight: 700 }}>✓ Seat {myseat.id} booked</div>}
                </div>
                {attended
                  ? <span style={styles.tag(PASTEL.sage)}>Present</span>
                  : <span style={styles.tag(PASTEL.muted)}>Book Seat →</span>}
              </div>
            </div>
          );
        })}
      </div>
      <NavBar screen={screen} navigate={navigate} styles={styles} />
      {toast && <Toast toast={toast} />}
    </div>
  );

  // SEATS
  if (screen === "seats") return (
    <div style={styles.app}>
      <div style={styles.screen}>
        <div style={{ ...styles.header, paddingBottom: 0 }}>
          <div>
            <span onClick={() => navigate("lectures")} style={{ fontSize: 13, color: PASTEL.accent, cursor: "pointer", fontWeight: 700 }}>← Back</span>
            <h2 style={{ margin: "4px 0 0", fontWeight: 800, fontSize: 20 }}>{selectedLecture?.label}</h2>
            <p style={{ margin: 0, fontSize: 12, color: mutedColor }}>{selectedSubject?.name} · {selectedLecture?.date}</p>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 12, padding: "14px 16px", flexWrap: "wrap" }}>
          {[["Empty", PASTEL.empty, PASTEL.border], ["Your Seat", PASTEL.lavender, PASTEL.lavender], ["Booked", PASTEL.sage, PASTEL.sage], ["Damaged", PASTEL.blush, PASTEL.blush]].map(([l, bg, border]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: mutedColor, fontWeight: 600 }}>
              <div style={{ width: 16, height: 16, borderRadius: 5, background: bg, border: `1.5px solid ${border}` }} />
              {l}
            </div>
          ))}
        </div>

        {/* Seat grid */}
        <div style={{ margin: "0 16px", background: card, borderRadius: 20, padding: 16, border: `1px solid ${borderColor}` }}>
          <div style={{ textAlign: "center", marginBottom: 16, fontSize: 12, fontWeight: 700, color: mutedColor, letterSpacing: 2, textTransform: "uppercase" }}>🎓 Blackboard / Front</div>
          {seats.map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: 8, marginBottom: 8, justifyContent: "center", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: mutedColor, width: 16 }}>{String.fromCharCode(65 + ri)}</span>
              {row.map(seat => {
                const isMe = seat.booked?.rollNo === user.rollNo;
                const bgColor = seat.damaged ? PASTEL.blush : isMe ? PASTEL.lavender : seat.booked ? PASTEL.sage : dm ? "#2A2420" : PASTEL.empty;
                const borderC = seat.damaged ? PASTEL.blush : isMe ? "#A090C0" : seat.booked ? "#88A880" : borderColor;
                return (
                  <button key={seat.id} title={seat.id}
                    onClick={() => bookSeat(seat)}
                    onContextMenu={e => { e.preventDefault(); if (seatKey) setDamageModal(seat); }}
                    style={{
                      width: 42, height: 42, borderRadius: 10, border: `2px solid ${borderC}`,
                      background: bgColor, cursor: "pointer", fontSize: 10, fontWeight: 700,
                      color: seat.booked || seat.damaged ? "#fff" : mutedColor,
                      transition: "transform 0.15s, box-shadow 0.15s",
                      boxShadow: isMe ? `0 0 0 3px ${PASTEL.lavender}66` : "none",
                      position: "relative",
                    }}>
                    {seat.damaged ? "⚠" : seat.id}
                  </button>
                );
              })}
            </div>
          ))}
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: mutedColor }}>
            Long-press / right-click a seat to report damage
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 10, margin: "14px 16px" }}>
          {[
            { label: "Total", val: ROWS * COLS, color: mutedColor },
            { label: "Booked", val: seats.flat().filter(s => s.booked).length, color: PASTEL.sage },
            { label: "Empty", val: seats.flat().filter(s => !s.booked && !s.damaged).length, color: PASTEL.accent },
            { label: "Damaged", val: seats.flat().filter(s => s.damaged).length, color: PASTEL.blush },
          ].map(stat => (
            <div key={stat.label} style={{ flex: 1, background: card, borderRadius: 14, padding: "12px 8px", textAlign: "center", border: `1px solid ${borderColor}` }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: stat.color }}>{stat.val}</div>
              <div style={{ fontSize: 11, color: mutedColor, fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Seat Info Modal */}
      {seatInfo && (
        <Modal onClose={() => setSeatInfo(null)} card={card} borderColor={borderColor} textColor={textColor} mutedColor={mutedColor}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 36 }}>🪑</div>
            <h3 style={{ margin: "8px 0 2px" }}>Seat Occupied</h3>
            <p style={{ margin: 0, fontSize: 13, color: mutedColor }}>This seat is booked by:</p>
          </div>
          {[["Name", seatInfo.name], ["Roll No.", seatInfo.rollNo], ["Contact", seatInfo.phone]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${borderColor}` }}>
              <span style={{ fontSize: 13, color: mutedColor, fontWeight: 600 }}>{l}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </Modal>
      )}

      {/* Damage Modal */}
      {damageModal && (
        <Modal onClose={() => { setDamageModal(null); setDamageText(""); }} card={card} borderColor={borderColor} textColor={textColor} mutedColor={mutedColor}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 36 }}>⚠️</div>
            <h3 style={{ margin: "8px 0 2px" }}>Report Damage</h3>
            <p style={{ margin: 0, fontSize: 13, color: mutedColor }}>Seat {damageModal?.id} — Describe the issue</p>
          </div>
          <textarea value={damageText} onChange={e => setDamageText(e.target.value)}
            placeholder="e.g. Broken leg, scratched surface, missing bolt..."
            style={{ width: "100%", minHeight: 90, padding: 12, borderRadius: 12, border: `1.5px solid ${borderColor}`, background: dm ? "#251F1C" : PASTEL.cream, color: textColor, fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", marginBottom: 12 }} />
          <button style={{ ...styles.btn, background: PASTEL.blush }} onClick={reportDamage}>Report Damage</button>
        </Modal>
      )}

      <NavBar screen={screen} navigate={navigate} styles={styles} />
      {toast && <Toast toast={toast} />}
    </div>
  );

  // ATTENDANCE
  if (screen === "attendance") return (
    <div style={styles.app}>
      <div style={styles.screen}>
        <div style={styles.header}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: 22 }}>Attendance</h2>
            <p style={{ margin: 0, fontSize: 12, color: mutedColor }}>Track your presence per subject</p>
          </div>
          <div style={{ fontSize: 28 }}>📊</div>
        </div>

        {SUBJECTS.map(sub => {
          const pct = attendancePct(sub.id);
          const count = attendanceCount(sub.id);
          const color = pct >= 75 ? PASTEL.sage : pct >= 50 ? "#D4C87A" : PASTEL.blush;
          const attended = (attendance[sub.id] || []);
          return (
            <div key={sub.id} style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{sub.name}</div>
                  <div style={{ fontSize: 12, color: mutedColor }}>{sub.code}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color }}>{pct}%</div>
                  <div style={{ fontSize: 11, color: mutedColor }}>{count}/6 lecs</div>
                </div>
              </div>
              <div style={{ background: borderColor, borderRadius: 8, height: 8, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 8, transition: "width 0.6s" }} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {lectures.map(lec => {
                  const key = `${sub.id}_${lec.id}`;
                  const present = attended.includes(key);
                  return (
                    <div key={lec.id} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ width: "100%", height: 28, borderRadius: 8, background: present ? color : borderColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                        {present ? "✓" : "·"}
                      </div>
                      <div style={{ fontSize: 9, color: mutedColor, marginTop: 3 }}>{lec.id}</div>
                    </div>
                  );
                })}
              </div>
              {pct < 75 && <div style={{ marginTop: 10, padding: "7px 10px", borderRadius: 10, background: PASTEL.blush + "33", fontSize: 12, color: "#8B4444" }}>⚠️ Below 75% — attend {Math.ceil((0.75 * 6 - count))} more lecture{Math.ceil((0.75 * 6 - count)) > 1 ? "s" : ""}</div>}
            </div>
          );
        })}
      </div>
      <NavBar screen={screen} navigate={navigate} styles={styles} />
      {toast && <Toast toast={toast} />}
    </div>
  );

  // PROFILE
  if (screen === "profile") return (
    <div style={styles.app}>
      <div style={styles.screen}>
        <div style={{ ...styles.header, paddingBottom: 0 }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 22 }}>Profile</h2>
          <button onClick={() => setDarkMode(!dm)} style={{ background: dm ? PASTEL.accent : PASTEL.cream, border: "none", borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: dm ? "#fff" : textColor, fontWeight: 600 }}>{dm ? "☀️" : "🌙"}</button>
        </div>
        <div style={{ textAlign: "center", padding: "24px 0 16px" }}>
          <div style={{ width: 80, height: 80, borderRadius: 40, background: PASTEL.cream, border: `3px solid ${PASTEL.sage}`, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🧑‍🎓</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{user.name}</div>
          <div style={{ fontSize: 13, color: mutedColor, marginTop: 2 }}>{user.rollNo}</div>
        </div>
        <div style={styles.card}>
          {[["📞 Phone", user.phone], ["📧 Email", user.email || "—"], ["🪪 Roll No.", user.rollNo]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${borderColor}` }}>
              <span style={{ fontSize: 14, color: mutedColor, fontWeight: 600 }}>{l}</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ margin: "0 16px" }}>
          <button style={{ ...styles.btnGhost, marginBottom: 10 }} onClick={() => {}}>✏️ Edit Profile</button>
          <button style={{ ...styles.btn, background: PASTEL.blush }} onClick={() => { setUser(null); navigate("login"); }}>Sign Out</button>
        </div>
      </div>
      <NavBar screen={screen} navigate={navigate} styles={styles} />
      {toast && <Toast toast={toast} />}
    </div>
  );

  return null;
}

function NavBar({ screen, navigate, styles }) {
  const tabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "attendance", icon: "📊", label: "Attendance" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];
  return (
    <nav style={styles.navBar}>
      {tabs.map(t => (
        <div key={t.id} style={styles.navItem(screen === t.id)} onClick={() => navigate(t.id)}>
          <span style={{ fontSize: 22 }}>{t.icon}</span>
          <span style={{ fontSize: 10, fontWeight: 700 }}>{t.label}</span>
        </div>
      ))}
    </nav>
  );
}

function Modal({ children, onClose, card, borderColor, textColor }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: card, borderRadius: "24px 24px 0 0", padding: "24px 24px 36px", width: "100%", maxWidth: 420, border: `1px solid ${borderColor}`, color: textColor }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: borderColor, margin: "0 auto 20px" }} />
        {children}
      </div>
    </div>
  );
}

function Toast({ toast }) {
  const colors = { success: "#B8C9B0", error: "#D4B8B0", info: "#C4B8D4" };
  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      background: colors[toast.type] || colors.info,
      color: "#3D3530", padding: "12px 20px", borderRadius: 16,
      fontSize: 14, fontWeight: 700, zIndex: 300,
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      animation: "slideUp 0.3s ease",
      whiteSpace: "nowrap",
    }}>
      {toast.msg}
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}
