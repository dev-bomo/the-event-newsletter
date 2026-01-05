import { useTranslation } from "react-i18next";

export default function LanguagePicker() {
  const { i18n } = useTranslation();

  const languages = [
    { code: "en", label: "English" },
    { code: "ro", label: "Română" },
  ];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="relative inline-block">
      <select
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1.5 pr-8 text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg
          className="fill-current h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}
