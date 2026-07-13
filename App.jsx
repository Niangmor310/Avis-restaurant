import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

const FONT_LINK_ID = "avis-fonts";

function useFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);
}

function ticketRotation(seed) {
  const n = Array.from(String(seed)).reduce((a, c) => a + c.charCodeAt(0), 0);
  return ((n % 7) - 3) * 0.6;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days} j`;
}

export default function App() {
  useFonts();

  const [entries, setEntries] = useState(null);
  const [name, setName] = useState("");
  const [dish, setDish] = useState("");
  const [impression, setImpression] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [thanks, setThanks] = useState(false);

  const [ownerOpen, setOwnerOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [actionBusy, setActionBusy] = useState(null);

  // Charger uniquement les avis approuvés (visible publiquement)
  const loadApproved = useCallback(async () => {
    const { data, error } = await supabase
      .from("avis")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (!error) setEntries(data);
  }, []);

  // Charger tous les avis (propriétaire connecté)
  const loadAll = useCallback(async () => {
    const { data, error } = await supabase
      .from("avis")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setEntries(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadAll();
    } else {
      loadApproved();
    }
  }, [session, loadAll, loadApproved]);

  const approved = (entries || []).filter((e) => e.status === "approved");
  const pending = (entries || []).filter((e) => e.status === "pending");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!impression.trim()) {
      setError("Dites-nous au moins un mot sur votre passage.");
      return;
    }
    setSubmitting(true);
    const { error: insertError } = await supabase.from("avis").insert({
      name: name.trim() || "Anonyme",
      dish: dish.trim() || null,
      impression: impression.trim(),
      status: "pending",
    });
    if (insertError) {
      setError("Impossible d'enregistrer votre avis. Réessayez.");
    } else {
      setName("");
      setDish("");
      setImpression("");
      setThanks(true);
      setTimeout(() => setThanks(false), 4000);
      if (session) loadAll();
    }
    setSubmitting(false);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError("Identifiants incorrects.");
    else {
      setEmail("");
      setPassword("");
    }
    setLoggingIn(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setOwnerOpen(false);
  }

  async function updateStatus(entry, status) {
    setActionBusy(entry.id);
    const { error } = await supabase.from("avis").update({ status }).eq("id", entry.id);
    if (!error) setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status } : e)));
    setActionBusy(null);
  }

  async function removeEntry(entry) {
    setActionBusy(entry.id);
    const { error } = await supabase.from("avis").delete().eq("id", entry.id);
    if (!error) setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    setActionBusy(null);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#2B3A32",
        backgroundImage:
          "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.04), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.03), transparent 45%)",
        fontFamily: "'Work Sans', sans-serif",
        color: "#1E1E1E",
        padding: "0 0 80px",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: #C1652F; color: #FAF6EE; }
        input:focus, textarea:focus { outline: 3px solid #C1652F; outline-offset: 2px; }
        .avis-btn { transition: transform 0.15s ease, background 0.15s ease; }
        .avis-btn:hover { transform: translateY(-1px); }
        .avis-btn:active { transform: translateY(0); }
      `}</style>

      <header
        style={{
          textAlign: "center",
          padding: "56px 24px 40px",
          borderBottom: "1px solid rgba(250,246,238,0.15)",
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#8A9A8C",
            marginBottom: 14,
          }}
        >
          Livre d'or · Impressions des convives
        </div>
        <h1
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 600,
            fontSize: "clamp(32px, 5vw, 52px)",
            color: "#FAF6EE",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Racontez-nous votre passage
        </h1>
        <p style={{ color: "#C7D2C8", maxWidth: 480, margin: "16px auto 0", fontSize: 15, lineHeight: 1.6 }}>
          Un mot, un plat, une ambiance — laissez votre impression épinglée pour les prochains clients.
        </p>
      </header>

      <div style={{ maxWidth: 560, margin: "-24px auto 0", padding: "0 20px" }}>
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#FAF6EE",
            borderRadius: 4,
            padding: "28px 28px 24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            borderTop: "6px solid #C1652F",
          }}
        >
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#2B3A32", marginBottom: 6 }}>
            Votre prénom (facultatif)
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Camille"
            maxLength={40}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 3, border: "1px solid #D8D0BE", background: "#fff", fontSize: 14, marginBottom: 16 }}
          />
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#2B3A32", marginBottom: 6 }}>
            Plat ou moment marquant (facultatif)
          </label>
          <input
            value={dish}
            onChange={(e) => setDish(e.target.value)}
            placeholder="Ex. Le risotto aux champignons"
            maxLength={60}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 3, border: "1px solid #D8D0BE", background: "#fff", fontSize: 14, marginBottom: 16 }}
          />
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#2B3A32", marginBottom: 6 }}>
            Votre impression
          </label>
          <textarea
            value={impression}
            onChange={(e) => setImpression(e.target.value)}
            placeholder="Dites-nous ce que vous avez ressenti…"
            maxLength={400}
            rows={3}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 3, border: "1px solid #D8D0BE", background: "#fff", fontSize: 14, resize: "vertical", marginBottom: 8 }}
          />
          {error && <div style={{ color: "#B33B1E", fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button
              className="avis-btn"
              type="submit"
              disabled={submitting}
              style={{ background: "#C1652F", color: "#FAF6EE", border: "none", borderRadius: 3, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Envoi…" : "Épingler mon avis"}
            </button>
          </div>
        </form>
        {thanks && (
          <div style={{ background: "#3E5245", color: "#F2E9D8", borderRadius: 3, padding: "12px 16px", marginTop: 14, fontSize: 13, textAlign: "center" }}>
            Merci ! Votre avis a bien été reçu et sera visible dès sa validation par le restaurant.
          </div>
        )}
        <p style={{ textAlign: "center", fontSize: 12, color: "#8A9A8C", marginTop: 12 }}>
          Chaque avis est relu par le restaurant avant publication.
        </p>
      </div>

      <div style={{ maxWidth: 720, margin: "48px auto 0", padding: "0 20px" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8A9A8C", marginBottom: 20, textAlign: "center" }}>
          {entries === null ? "Chargement des avis…" : approved.length === 0 ? "Aucun avis publié pour l'instant" : `${approved.length} avis épinglé${approved.length > 1 ? "s" : ""}`}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
          {approved.map((e) => (
            <div key={e.id} style={{ background: "#F2E9D8", borderRadius: 2, padding: "18px 18px 16px", boxShadow: "0 8px 18px rgba(0,0,0,0.18)", transform: `rotate(${ticketRotation(e.id)}deg)`, borderTop: "3px dashed #C1652F" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 16, color: "#2B3A32" }}>{e.name}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#8A9A8C" }}>{timeAgo(e.created_at)}</span>
              </div>
              {e.dish && <div style={{ fontSize: 12, fontWeight: 500, color: "#C1652F", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{e.dish}</div>}
              <p style={{ fontSize: 14, lineHeight: 1.55, color: "#1E1E1E", margin: 0 }}>{e.impression}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 56 }}>
        <button
          onClick={() => setOwnerOpen(true)}
          style={{ background: "transparent", border: "1px solid rgba(250,246,238,0.3)", color: "#C7D2C8", borderRadius: 20, padding: "8px 18px", fontSize: 12, cursor: "pointer", letterSpacing: "0.05em" }}
        >
          Espace propriétaire
        </button>
      </div>

      {ownerOpen && (
        <div
          onClick={() => setOwnerOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(30,30,30,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#FAF6EE", borderRadius: 6, padding: 28, width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 30px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 22, color: "#2B3A32", margin: 0 }}>Espace propriétaire</h2>
              <button onClick={() => setOwnerOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8A9A8C" }}>×</button>
            </div>

            {!session ? (
              <form onSubmit={handleLogin}>
                <p style={{ fontSize: 13, color: "#5A5A5A", marginBottom: 14 }}>
                  Connectez-vous avec le compte créé dans Supabase pour gérer les avis.
                </p>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: "100%", padding: "10px 12px", borderRadius: 3, border: "1px solid #D8D0BE", fontSize: 14, marginBottom: 8 }} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" style={{ width: "100%", padding: "10px 12px", borderRadius: 3, border: "1px solid #D8D0BE", fontSize: 14, marginBottom: 10 }} />
                {loginError && <div style={{ color: "#B33B1E", fontSize: 13, marginBottom: 10 }}>{loginError}</div>}
                <button type="submit" disabled={loggingIn} style={{ background: "#C1652F", color: "#FAF6EE", border: "none", borderRadius: 3, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  {loggingIn ? "Connexion…" : "Se connecter"}
                </button>
              </form>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: "#5A5A5A" }}>Connecté : {session.user.email}</span>
                  <button onClick={handleLogout} style={{ background: "none", border: "1px solid #D8D0BE", borderRadius: 3, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: "#5A5A5A" }}>
                    Déconnexion
                  </button>
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, color: "#2B3A32", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  En attente de validation ({pending.length})
                </div>
                {pending.length === 0 && <div style={{ fontSize: 13, color: "#8A9A8C", marginBottom: 20 }}>Aucun avis en attente.</div>}
                {pending.map((e) => (
                  <div key={e.id} style={{ border: "1px solid #E5DDCB", borderRadius: 4, padding: 14, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <strong style={{ fontSize: 14, color: "#2B3A32" }}>{e.name}</strong>
                      <span style={{ fontSize: 11, color: "#8A9A8C", fontFamily: "'JetBrains Mono', monospace" }}>{timeAgo(e.created_at)}</span>
                    </div>
                    {e.dish && <div style={{ fontSize: 12, color: "#C1652F", marginBottom: 6 }}>{e.dish}</div>}
                    <p style={{ fontSize: 13, color: "#1E1E1E", marginBottom: 10 }}>{e.impression}</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button disabled={actionBusy === e.id} onClick={() => updateStatus(e, "approved")} style={{ background: "#3E5245", color: "#fff", border: "none", borderRadius: 3, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Approuver</button>
                      <button disabled={actionBusy === e.id} onClick={() => removeEntry(e)} style={{ background: "transparent", color: "#B33B1E", border: "1px solid #B33B1E", borderRadius: 3, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Refuser</button>
                    </div>
                  </div>
                ))}

                <div style={{ fontSize: 13, fontWeight: 600, color: "#2B3A32", margin: "20px 0 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Publiés ({approved.length})
                </div>
                {approved.map((e) => (
                  <div key={e.id} style={{ border: "1px solid #E5DDCB", borderRadius: 4, padding: 14, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <strong style={{ fontSize: 14, color: "#2B3A32" }}>{e.name}</strong>
                      <span style={{ fontSize: 11, color: "#8A9A8C", fontFamily: "'JetBrains Mono', monospace" }}>{timeAgo(e.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#1E1E1E", marginBottom: 10 }}>{e.impression}</p>
                    <button disabled={actionBusy === e.id} onClick={() => removeEntry(e)} style={{ background: "transparent", color: "#B33B1E", border: "1px solid #B33B1E", borderRadius: 3, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Retirer</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
