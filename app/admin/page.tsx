"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale } from "@/components/LocaleProvider";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";

interface Photo {
  id: string;
  url: string;
  labels?: Record<string, string> | null;
  rating: number;
  wins: number;
  losses: number;
}

export default function AdminPage() {
  const { t } = useLocale();
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [labels, setLabels] = useState<Record<Locale, string>>({ en: "", fr: "", es: "", zh: "", ja: "" });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function login() {
    document.cookie = `admin_secret=${secret}; path=/`;
    const res = await fetch("/api/photos");
    if (res.ok) {
      setAuthed(true);
      setPhotos(await res.json());
    } else {
      setMessage("Wrong secret.");
    }
  }

  async function upload() {
    if (!file) return;
    const missing = LOCALES.filter((l) => !labels[l].trim());
    if (missing.length) {
      setMessage(`Missing label for: ${missing.map((l) => LOCALE_LABELS[l]).join(", ")}`);
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("labels", JSON.stringify(labels));
    const res = await fetch("/admin/upload", { method: "POST", body: form });
    if (res.ok) {
      const photo = await res.json();
      setPhotos((p) => [photo, ...p]);
      setFile(null);
      setLabels({ en: "", fr: "", es: "", zh: "", ja: "" });
      setMessage(t("admin.uploaded"));
    } else {
      setMessage(t("admin.uploadFailed"));
    }
    setUploading(false);
  }

  async function hidePhoto(id: string) {
    await fetch("/admin/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setPhotos((p) => p.filter((ph) => ph.id !== id));
  }

  if (!authed) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 max-w-sm w-full mx-auto">
        <h1 className="text-2xl font-black">{t("admin.loginTitle")}</h1>
        <input
          type="password"
          placeholder={t("admin.secretPlaceholder")}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white outline-none focus:ring-2 focus:ring-rose-500"
        />
        <button onClick={login} className="w-full py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold transition-colors">
          {t("admin.loginButton")}
        </button>
        {message && <p className="text-rose-400 text-sm">{message}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto px-4">
      <h1 className="text-3xl font-black">{t("admin.title")}</h1>

      <div className="bg-zinc-900 rounded-xl p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t("admin.uploadTitle")}</h2>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm text-zinc-400" />
        <div className="grid grid-cols-1 gap-2">
          {LOCALES.map((locale) => (
            <input
              key={locale}
              type="text"
              placeholder={`${LOCALE_LABELS[locale]} label`}
              value={labels[locale]}
              onChange={(e) => setLabels((prev) => ({ ...prev, [locale]: e.target.value }))}
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white outline-none focus:ring-2 focus:ring-rose-500 text-sm"
            />
          ))}
        </div>
        <button onClick={upload} disabled={!file || uploading} className="self-start px-6 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold transition-colors">
          {uploading ? t("admin.uploadingButton") : t("admin.uploadButton")}
        </button>
        {message && <p className="text-emerald-400 text-sm">{message}</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-zinc-900">
            <div className="relative aspect-square">
              <Image src={photo.url} alt={photo.labels?.en ?? "Photo"} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
            </div>
            <div className="p-2 text-xs text-zinc-400">
              <p className="truncate font-medium text-white">{photo.labels?.en ?? "—"}</p>
              <p>ELO: {Math.round(photo.rating)}</p>
              <p>{photo.wins}W / {photo.losses}L</p>
            </div>
            <button onClick={() => hidePhoto(photo.id)} className="absolute top-2 right-2 bg-black/70 hover:bg-rose-600 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all">
              {t("admin.removeButton")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
