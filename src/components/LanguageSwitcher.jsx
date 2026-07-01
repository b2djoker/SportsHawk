import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", key: "english" },
  { code: "hi", key: "hindi" },
  { code: "bn", key: "bengali" },
  { code: "ml", key: "malayalam" },
  { code: "ta", key: "tamil" },
  { code: "te", key: "telugu" },
  { code: "kn", key: "kannada" },
  { code: "as", key: "assamese" },
  { code: "or", key: "odia" }
];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage || i18n.language || "en";

  function changeLanguage(event) {
    i18n.changeLanguage(event.target.value);
    window.localStorage.setItem("sportshawk_language", event.target.value);
  }

  return (
    <select
      aria-label={t("language.select")}
      value={currentLanguage.split("-")[0]}
      onChange={changeLanguage}
      className="h-10 max-w-[132px] rounded-lg border border-slate-200 bg-white px-2 text-xs font-black text-slate-700 outline-none transition focus:border-hawk-green sm:max-w-none sm:px-3"
    >
      {languages.map((language) => (
        <option key={language.code} value={language.code}>
          {t(`language.${language.key}`)}
        </option>
      ))}
    </select>
  );
}
