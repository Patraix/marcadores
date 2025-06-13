// src/hooks/useGoogleSheets.js
import { useState, useEffect, useRef } from "react";

const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

export const useGoogleSheets = (sheetName, interval = 5000) => {
  // Por defecto cada 5 segundos
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevDataRef = useRef(null); // Para almacenar los datos anteriores y detectar cambios

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
        // Rango A1:D1 para las primeras cuatro columnas de la primera fila
        const range = `${sheetName}!A1:D1`;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        const newRowData =
          result.values && result.values[0] ? result.values[0] : null;

        if (newRowData) {
          // Mapear los datos a un objeto más legible
          const newFormattedData = {
            localTeam: newRowData[0],
            visitorTeam: newRowData[1],
            localScore: parseInt(newRowData[2], 10),
            visitorScore: parseInt(newRowData[3], 10),
          };

          // Detectar si ha habido cambios en los marcadores
          if (prevDataRef.current) {
            const changedScores = {};
            if (
              prevDataRef.current.localScore !== newFormattedData.localScore
            ) {
              changedScores.local = true;
            }
            if (
              prevDataRef.current.visitorScore !== newFormattedData.visitorScore
            ) {
              changedScores.visitor = true;
            }
            setData({ ...newFormattedData, changedScores }); // Añadir la información de cambios
          } else {
            setData(newFormattedData);
          }
          prevDataRef.current = newFormattedData; // Actualizar los datos previos
        } else {
          setData(null);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching sheet data:", err);
        setError(err.message || "Failed to fetch data.");
        setData(null); // Limpiar datos si hay un error
      } finally {
        setLoading(false);
      }
    };

    // Ejecutar la primera vez
    fetchData();

    // Configurar el intervalo de sondeo
    const pollInterval = setInterval(fetchData, interval);

    // Limpiar el intervalo cuando el componente se desmonte o el sheetName cambie
    return () => clearInterval(pollInterval);
  }, [sheetName, interval]); // Dependencias del useEffect

  return { data, loading, error };
};
