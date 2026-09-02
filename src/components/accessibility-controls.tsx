import { Moon, Sun, Type } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";
type FontSize = "standard" | "large";

const THEME_STORAGE_KEY = "nexum-theme";
const FONT_SIZE_STORAGE_KEY = "nexum-font-size";

export function AccessibilityControls() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [fontSize, setFontSize] = useState<FontSize>("large");

  useEffect(() => {
    const currentTheme = document.documentElement.dataset.theme;
    const currentFontSize = document.documentElement.dataset.fontSize;

    setTheme(currentTheme === "light" ? "light" : "dark");
    setFontSize(currentFontSize === "standard" ? "standard" : "large");
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }

  function toggleFontSize() {
    const nextFontSize: FontSize = fontSize === "large" ? "standard" : "large";
    document.documentElement.dataset.fontSize = nextFontSize;
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, nextFontSize);
    setFontSize(nextFontSize);
  }

  return (
    <aside className="accessibility-controls" aria-label="Opções de visualização">
      <button
        type="button"
        className="accessibility-control-button"
        onClick={toggleTheme}
        aria-pressed={theme === "light"}
        title={theme === "dark" ? "Ativar modo normal" : "Ativar modo escuro"}
      >
        {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        <span>{theme === "dark" ? "Modo normal" : "Modo escuro"}</span>
      </button>

      <button
        type="button"
        className="accessibility-control-button"
        onClick={toggleFontSize}
        aria-pressed={fontSize === "large"}
        title={fontSize === "large" ? "Usar texto normal" : "Usar texto maior"}
      >
        <Type aria-hidden="true" />
        <span>{fontSize === "large" ? "Texto normal" : "Texto maior"}</span>
      </button>
    </aside>
  );
}
