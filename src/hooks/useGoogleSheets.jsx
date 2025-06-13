// src/hooks/useGoogleSheets.jsx
import { useState, useEffect, useRef } from "react";

const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

export const useGoogleSheets = (sheetName, interval = 5000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        const range = `${sheetName}!A:D`;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        const rawRows = result.values || []; // Todas las filas obtenidas

        // === AÑADE ESTE CONSOLE.LOG AQUÍ ===
        console.log(
          "useGoogleSheets: Raw rows directly from Google Sheets API:",
          rawRows
        );
        // ===================================

        let newFormattedData = {
          mainScore: null,
          matchStatus: null,
          comments: [],
        };

        // 1. Procesar la primera fila (Marcador Principal)
        if (rawRows.length > 0 && rawRows[0].length >= 4) {
          newFormattedData.mainScore = {
            localTeam: rawRows[0][0],
            visitorTeam: rawRows[0][1],
            localScore: parseInt(rawRows[0][2], 10),
            visitorScore: parseInt(rawRows[0][3], 10),
          };
        } else {
          // === AÑADE ESTE CONSOLE.LOG AQUÍ ===
          console.warn(
            "useGoogleSheets: Primera fila no tiene suficientes datos o no existe para mainScore."
          );
          // ===================================
        }

        // 2. Procesar la segunda fila (Estado del Partido)
        if (rawRows.length > 1 && rawRows[1].length >= 3) {
          newFormattedData.matchStatus = {
            day: rawRows[1][0],
            time: rawRows[1][1],
            statusText: rawRows[1][2],
          };
        } else {
          // === AÑADE ESTE CONSOLE.LOG AQUÍ ===
          console.warn(
            "useGoogleSheets: Segunda fila no tiene suficientes datos o no existe para matchStatus."
          );
          // ===================================
        }

        // 3. Procesar las filas de comentarios (desde la tercera fila en adelante)
        for (let i = 2; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0 || !row[0]) {
            break;
          }
          newFormattedData.comments.push(row[0]);
        }

        // Detección de cambios (el resto de tu lógica de cambio)
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
        newFormattedData.mainScore = newFormattedData.mainScore
          ? { ...newFormattedData.mainScore, changedScores }
          : null;

        // === AÑADE ESTE CONSOLE.LOG AQUÍ ===
        console.log(
          "useGoogleSheets: Formatted data being set to state:",
          newFormattedData
        );
        // ===================================

        setData(newFormattedData);
        prevDataRef.current = newFormattedData;

        setError(null);
      } catch (err) {
        console.error("Error fetching sheet data:", err);
        setError(err.message || "Failed to fetch data.");
        setData(null);
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
