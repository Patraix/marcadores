// src/components/MatchDisplay.jsx
import React, { useEffect, useState } from "react";
import "./MatchDisplay.css";

const MatchDisplay = ({ data, error }) => {
  const [highlightLocal, setHighlightLocal] = useState(false);
  const [highlightVisitor, setHighlightVisitor] = useState(false);
  // Añadimos un estado para almacenar los últimos datos válidos
  const [lastValidData, setLastValidData] = useState(null);

  // Efecto para manejar el resaltado temporal del marcador local
  useEffect(() => {
    if (data?.changedScores?.local) {
      setHighlightLocal(true);
      const timer = setTimeout(() => setHighlightLocal(false), 2000); // Resaltar por 2 segundos
      return () => clearTimeout(timer);
    }
  }, [data?.localScore, data?.changedScores?.local]);

  // Efecto para manejar el resaltado temporal del marcador visitante
  useEffect(() => {
    if (data?.changedScores?.visitor) {
      setHighlightVisitor(true);
      const timer = setTimeout(() => setHighlightVisitor(false), 2000); // Resaltar por 2 segundos
      return () => clearTimeout(timer);
    }
  }, [data?.visitorScore, data?.changedScores?.visitor]);

  // Nuevo useEffect para actualizar lastValidData solo cuando 'data' es válido
  useEffect(() => {
    if (data && !error) {
      // Si hay datos y no hay error
      setLastValidData(data);
    }
  }, [data, error]); // Depende de 'data' y 'error'

  // Si hay un error, mostramos el mensaje de error.
  if (error) {
    return <div className="match-container error">Error: {error}</div>;
  }

  // Si no hay datos válidos (ni actuales ni previos), mostramos un mensaje inicial
  // Esto solo ocurrirá en la primera carga o si no se pudo obtener ningún dato inicialmente.
  if (!lastValidData) {
    return (
      <div className="match-container loading">
        Cargando resultado inicial...
      </div>
    );
  }

  // Si tenemos lastValidData, lo usamos para mostrar el partido
  // El indicador 'loading' ya no bloqueará la visualización.
  const displayData = lastValidData;

  return (
    <div className="match-container">
      <h1 className="match-title">Resultado del Partido</h1>
      <div className="teams">
        <span className="team-name">
          {displayData.localTeam || "Equipo Local"}
        </span>
        <span className="separator">-</span>
        <span className="team-name">
          {displayData.visitorTeam || "Equipo Visitante"}
        </span>
      </div>
      <div className="score">
        <span
          className={`score-number ${highlightLocal ? "highlight-score" : ""}`}
        >
          {displayData.localScore !== undefined ? displayData.localScore : "-"}
        </span>
        <span className="score-separator">:</span>
        <span
          className={`score-number ${
            highlightVisitor ? "highlight-score" : ""
          }`}
        >
          {displayData.visitorScore !== undefined
            ? displayData.visitorScore
            : "-"}
        </span>
      </div>
    </div>
  );
};

export default MatchDisplay;
