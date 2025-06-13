// src/components/MatchDisplay.jsx
import React, { useEffect, useState } from "react";
import "./MatchDisplay.css";
import { CiStreamOn } from "react-icons/ci";

const MatchDisplay = ({ data, error }) => {
  // === AÑADE ESTE CONSOLE.LOG AL PRINCIPIO DEL COMPONENTE ===
  console.log("MatchDisplay: Data prop received from hook:", data);
  // =========================================================

  const [lastValidData, setLastValidData] = useState(null);
  // Estados de resaltado para el marcador principal
  const [highlightLocal, setHighlightLocal] = useState(false);
  const [highlightVisitor, setHighlightVisitor] = useState(false);

  // Efecto para actualizar lastValidData solo cuando 'data' es válido
  useEffect(() => {
    if (data && !error) {
      setLastValidData(data);
    }
  }, [data, error]);

  // Los efectos de resaltado dependen del mainScore de los datos actuales
  useEffect(() => {
    if (data?.mainScore?.changedScores?.local) {
      setHighlightLocal(true);
      const timer = setTimeout(() => setHighlightLocal(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [data?.mainScore?.localScore, data?.mainScore?.changedScores?.local]); // Depende del marcador y la bandera de cambio

  useEffect(() => {
    if (data?.mainScore?.changedScores?.visitor) {
      setHighlightVisitor(true);
      const timer = setTimeout(() => setHighlightVisitor(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [data?.mainScore?.visitorScore, data?.mainScore?.changedScores?.visitor]); // Depende del marcador y la bandera de cambio

  // Lógica de renderizado
  if (error) {
    return <div className="match-container error">Error: {error}</div>;
  }

  if (!lastValidData || !lastValidData.mainScore) {
    // Asegúrate de que al menos el marcador principal esté disponible para mostrar algo
    return (
      <div className="match-container loading">
        Cargando resultado inicial...
      </div>
    );
  }

  const { mainScore, matchStatus, comments } = lastValidData;

  return (
    <div className="match-container">
      {" "}
      <div className=".pure-g live-indicator">
        <CiStreamOn className="live-icon" /> {/* El componente de icono */}
        <span className="live-text">MARCADOR EN VIVO</span>
      </div>
      {/* Marcador Principal */}
      <div className="teams">
        <span className="team-name">
          {mainScore.localTeam || "Equipo Local"}
        </span>
        <span className="separator">-</span>
        <span className="team-name">
          {mainScore.visitorTeam || "Equipo Visitante"}
        </span>
      </div>
      <div className="score">
        <span
          className={`score-number ${highlightLocal ? "highlight-score" : ""}`}
        >
          {mainScore.localScore !== undefined ? mainScore.localScore : "-"}
        </span>
        <span className="score-separator">:</span>
        <span
          className={`score-number ${
            highlightVisitor ? "highlight-score" : ""
          }`}
        >
          {mainScore.visitorScore !== undefined ? mainScore.visitorScore : "-"}
        </span>
      </div>
      <p className="match-datetime">
        🗓 {matchStatus.day || "N/A"} ⌚︎ {matchStatus.time || "N/A"}
      </p>
      {/* Información del Estado del Partido (Fila 2) */}
      {matchStatus && (
        <div className="match-status">
          <p className="status-text">{matchStatus.statusText || "N/A"}</p>
        </div>
      )}
      {/* Comentarios (desde Fila 3 en adelante) */}
      {comments && comments.length > 0 && (
        <div className="match-comments">
          {/* <h3>Comentarios del Partido:</h3>*/}
          <ul className="comments-list">
            {comments.map((comment, index) => (
              <li key={index}>{comment}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MatchDisplay;
