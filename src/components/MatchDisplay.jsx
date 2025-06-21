// src/components/MatchDisplay.jsx
import React, { useEffect, useState } from "react";
import "./MatchDisplay.css";
import { CiStreamOn } from "react-icons/ci"; // Icono de "Stream On"

const MatchDisplay = ({ data, error }) => {
  // Console log para depuración (puedes mantenerlo o quitarlo)
  console.log("MatchDisplay: Data prop received from hook:", data);
  console.log("MatchDisplay: Error prop received from hook:", error);

  const [lastValidData, setLastValidData] = useState(null);
  const [highlightLocal, setHighlightLocal] = useState(false);
  const [highlightVisitor, setHighlightVisitor] = useState(false);

  // Efecto para actualizar lastValidData solo cuando 'data' es válido y sin errores.
  useEffect(() => {
    if (data && !error) {
      setLastValidData(data);
    }
  }, [data, error]);

  // Efecto para el resaltado del marcador local
  useEffect(() => {
    if (data?.mainScore?.changedScores?.local) {
      setHighlightLocal(true);
      const timer = setTimeout(() => setHighlightLocal(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [data?.mainScore?.localScore, data?.mainScore?.changedScores?.local]);

  // Efecto para el resaltado del marcador visitante
  useEffect(() => {
    if (data?.mainScore?.changedScores?.visitor) {
      setHighlightVisitor(true);
      const timer = setTimeout(() => setHighlightVisitor(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [data?.mainScore?.visitorScore, data?.mainScore?.changedScores?.visitor]);

  // Lógica de renderizado ajustada para mostrar siempre la estructura
  const { mainScore, matchStatus, comments } = lastValidData || {};

  const displayMainScore = mainScore || {};
  const displayMatchStatus = matchStatus || {};
  const displayComments = comments || [];

  // Función para construir la URL del logo
  const getTeamLogoPath = (teamName) => {
    if (!teamName) return ""; // No logo if no team name
    const fileName = teamName.toLowerCase().replace(/\s+/g, "") + ".png"; // Convertir a minúsculas y quitar espacios
    // Ruta relativa desde components/ a assets/logos/
    return new URL(`../assets/logos/${fileName}`, import.meta.url).href;
  };

  // Handler para errores de carga de imagen (oculta la imagen rota)
  const handleLogoError = (e) => {
    e.target.onerror = null; // Evita bucles infinitos de error
    e.target.style.display = "none"; // Oculta la imagen si no se carga
    console.error(`Error loading logo for ${e.target.alt}: ${e.target.src}`);
  };

  return (
    <div className="match-container">
      <h1 className="match-title">
        {displayMainScore.localTeam || "Local"} vs{" "}
        {displayMainScore.visitorTeam || "Visitante"}
      </h1>

      <div className="live-indicator">
        <CiStreamOn className="live-icon" />
        <span className="live-text">MARCADOR EN VIVO</span>
      </div>

      {/* === NUEVA SECCIÓN DEL MARCADOR: Dos líneas, una por equipo === */}
      <div className="score-display-new">
        {/* Línea del equipo Local: Nombre, Logo, Resultado */}
        <div className="team-score-line">
          <div className="team-info">
            <span className="team-name">
              {displayMainScore.localTeam || "Equipo Local"}
            </span>
            <img
              src={getTeamLogoPath(displayMainScore.localTeam)}
              alt={`${displayMainScore.localTeam} logo`}
              className="team-logo"
              onError={handleLogoError}
            />
          </div>
          <span
            className={`score-number ${
              highlightLocal ? "highlight-score" : ""
            }`}
          >
            {displayMainScore.localScore !== undefined
              ? displayMainScore.localScore
              : "-"}
          </span>
        </div>

        {/* Línea del equipo Visitante: Nombre, Logo, Resultado */}
        <div className="team-score-line">
          <div className="team-info">
            <span className="team-name">
              {displayMainScore.visitorTeam || "Equipo Visitante"}
            </span>
            <img
              src={getTeamLogoPath(displayMainScore.visitorTeam)}
              alt={`${displayMainScore.visitorTeam} logo`}
              className="team-logo"
              onError={handleLogoError}
            />
          </div>
          <span
            className={`score-number ${
              highlightVisitor ? "highlight-score" : ""
            }`}
          >
            {displayMainScore.visitorScore !== undefined
              ? displayMainScore.visitorScore
              : "-"}
          </span>
        </div>
      </div>
      {/* === FIN NUEVA SECCIÓN DEL MARCADOR === */}

      {/* Fecha y hora del partido */}
      <p className="match-datetime">
        🗓 {displayMatchStatus.day || "N/A"} ⌚︎{" "}
        {displayMatchStatus.time || "N/A"}
      </p>

      {/* Información del Estado del Partido */}
      {displayMatchStatus && (
        <div className="match-status">
          <p className="status-text">
            {displayMatchStatus.statusText || "N/A"}
          </p>
        </div>
      )}

      {/* Comentarios del Partido */}
      {displayComments.length > 0 && (
        <div className="match-comments">
          <ul className="comments-list">
            {displayComments.map((comment, index) => (
              <li key={index}>{comment}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MatchDisplay;
