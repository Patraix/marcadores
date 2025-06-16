// src/components/MatchDisplay.jsx
import React, { useEffect, useState } from "react";
import "./MatchDisplay.css";
import { CiStreamOn } from "react-icons/ci"; // Icono de "Stream On"

const MatchDisplay = ({ data, error, matchName }) => {
  // Console log para depuración (puedes mantenerlo o quitarlo)
  console.log("MatchDisplay: Data prop received from hook:", data);
  console.log("MatchDisplay: Error prop received from hook:", error);

  const [lastValidData, setLastValidData] = useState(null);
  // Reintroducimos los estados locales para controlar el resaltado de cada marcador
  const [highlightLocal, setHighlightLocal] = useState(false);
  const [highlightVisitor, setHighlightVisitor] = useState(false);

  // Efecto para actualizar lastValidData solo cuando 'data' es válido y sin errores.
  // Esto asegura que 'lastValidData' siempre retenga la última versión buena del marcador,
  // incluso si la siguiente petición falla o está en curso.
  useEffect(() => {
    if (data && !error) {
      setLastValidData(data);
    }
  }, [data, error]);

  // Efecto para el resaltado del marcador local
  useEffect(() => {
    // Si la bandera 'changedScores.local' está en los datos, activa el resaltado
    if (data?.mainScore?.changedScores?.local) {
      setHighlightLocal(true);
      // Configura el temporizador para que el resaltado (marco y parpadeo) dure 30 segundos (30000 ms)
      const timer = setTimeout(() => setHighlightLocal(false), 30000);
      return () => clearTimeout(timer); // Limpia el temporizador si el componente se desmonta o el efecto se re-ejecuta
    }
  }, [data?.mainScore?.localScore, data?.mainScore?.changedScores?.local]); // Dependencias: marcador y bandera de cambio

  // Efecto para el resaltado del marcador visitante
  useEffect(() => {
    // Si la bandera 'changedScores.visitor' está en los datos, activa el resaltado
    if (data?.mainScore?.changedScores?.visitor) {
      setHighlightVisitor(true);
      // Configura el temporizador para que el resaltado (marco y parpadeo) dure 30 segundos (30000 ms)
      const timer = setTimeout(() => setHighlightVisitor(false), 30000);
      return () => clearTimeout(timer); // Limpia el temporizador si el componente se desmonta o el efecto se re-ejecuta
    }
  }, [data?.mainScore?.visitorScore, data?.mainScore?.changedScores?.visitor]); // Dependencias: marcador y bandera de cambio

  // Lógica de renderizado ajustada para mostrar siempre la estructura
  // Se usan valores por defecto si 'lastValidData' es null (primera carga sin caché, o error persistente)
  const { mainScore, matchStatus, comments } = lastValidData || {};

  // Aseguramos que los objetos anidados y arrays estén definidos para evitar errores de acceso a propiedades
  const displayMainScore = mainScore || {};
  const displayMatchStatus = matchStatus || {};
  const displayComments = comments || [];

  return (
    <div className="match-container">
      {/* Título del partido: Muestra los nombres de los equipos. */}
      <h1 className="match-title">
        {displayMainScore.localTeam || "Local"} vs{" "}
        {displayMainScore.visitorTeam || "Visitante"}
      </h1>

      {/* Indicador "LIVE" - siempre visible */}
      <div className="live-indicator">
        <CiStreamOn className="live-icon" />
        <span className="live-text">MARCADOR EN VIVO</span>
      </div>

      {/* Nombres de los equipos */}
      <div className="teams">
        <span className="team-name">
          {displayMainScore.localTeam || "Equipo Local"}
        </span>
        <span className="separator">-</span>
        <span className="team-name">
          {displayMainScore.visitorTeam || "Equipo Visitante"}
        </span>
      </div>

      {/* Sección del marcador */}
      <div className="score">
        {/* Marcador Local: aplica la clase highlight-score si highlightLocal es true */}
        <span
          className={`score-number ${highlightLocal ? "highlight-score" : ""}`}
        >
          {displayMainScore.localScore !== undefined
            ? displayMainScore.localScore
            : "-"}
        </span>
        <span className="score-separator">:</span>
        {/* Marcador Visitante: aplica la clase highlight-score si highlightVisitor es true */}
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
