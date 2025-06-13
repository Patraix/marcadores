// src/hooks/useGoogleSheets.jsx
import { useState, useEffect, useRef } from "react";

const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

export const useGoogleSheets = (sheetName, interval = 5000) => {
  // data ahora almacenará un objeto con la estructura deseada
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // prevDataRef almacenará la estructura completa de los datos previos para la detección de cambios
  const prevDataRef = useRef(null);

  useEffect(() => {
    if (!sheetName) {
      setData(null);
      setLoading(false);
      setError("No sheetName provided.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Leer todas las filas de las columnas A a D, ya que no sabemos cuántos comentarios habrá
        const range = `${sheetName}!A:D`;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        const rawRows = result.values || []; // Todas las filas obtenidas

        let newFormattedData = {
          mainScore: null,
          matchStatus: null,
          comments: [],
        };

        // 1. Procesar la primera fila (Marcador Principal)
        if (rawRows.length > 0 && rawRows[0].length >= 4) {
          // Asegura que hay al menos 4 columnas
          newFormattedData.mainScore = {
            localTeam: rawRows[0][0],
            visitorTeam: rawRows[0][1],
            localScore: parseInt(rawRows[0][2], 10),
            visitorScore: parseInt(rawRows[0][3], 10),
          };
        }

        // 2. Procesar la segunda fila (Estado del Partido)
        if (rawRows.length > 1 && rawRows[1].length >= 3) {
          // Asegura que hay al menos 3 columnas
          newFormattedData.matchStatus = {
            day: rawRows[1][0],
            time: rawRows[1][1],
            statusText: rawRows[1][2],
          };
        }

        // 3. Procesar las filas de comentarios (desde la tercera fila en adelante)
        // Se detiene al encontrar una fila vacía (o si el primer elemento es undefined/null)
        for (let i = 2; i < rawRows.length; i++) {
          const row = rawRows[i];
          // Si la fila está vacía (o el primer elemento es null/undefined), paramos
          if (!row || row.length === 0 || !row[0]) {
            break;
          }
          // Asumimos que el comentario principal está en la columna A
          newFormattedData.comments.push(row[0]);
        }

        // Detección de cambios para el resaltado del marcador
        let changedScores = {};
        if (
          newFormattedData.mainScore &&
          prevDataRef.current &&
          prevDataRef.current.mainScore
        ) {
          if (
            prevDataRef.current.mainScore.localScore !==
            newFormattedData.mainScore.localScore
          ) {
            changedScores.local = true;
          }
          if (
            prevDataRef.current.mainScore.visitorScore !==
            newFormattedData.mainScore.visitorScore
          ) {
            changedScores.visitor = true;
          }
        }
        // Adjuntamos la información de cambios al mainScore
        newFormattedData.mainScore = newFormattedData.mainScore
          ? { ...newFormattedData.mainScore, changedScores }
          : null;

        setData(newFormattedData);
        prevDataRef.current = newFormattedData; // Actualizar los datos previos

        setError(null);
      } catch (err) {
        console.error("Error fetching sheet data:", err);
        setError(err.message || "Failed to fetch data.");
        setData(null); // Limpiar datos si hay un error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const pollInterval = setInterval(fetchData, interval);
    return () => clearInterval(pollInterval);
  }, [sheetName, interval]);

  return { data, loading, error };
};
