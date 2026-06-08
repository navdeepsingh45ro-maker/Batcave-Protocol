"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  downloadBackup,
  createSnapshot,
  listSnapshots,
  deleteSnapshot,
  restoreSnapshot,
  validateBackupFile,
  importBackup,
  getStorageStats,
} from "@/lib/storage";
import type { BackupSnapshot, ImportValidationResult } from "@/lib/storage";
import { audioManager } from "@/lib/audioManager";

type VaultView = "overview" | "snapshots" | "import";

const itemVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function StatPill({ label, value, dim = false }: { label: string; value: string | number; dim?: boolean }) {
  return (
    <div className="border border-white/5 bg-black/35 p-2.5 space-y-0.5">
      <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">{label}</p>
      <p className={`font-display text-sm ${dim ? "text-white/40" : "text-frost"}`}>{value}</p>
    </div>
  );
}

export default function DataVaultPanel() {
  const [view, setView] = useState<VaultView>("overview");
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [stats, setStats] = useState(() => getStorageStats());
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [importRaw, setImportRaw] = useState<string | null>(null);
  const [importValidation, setImportValidation] = useState<ImportValidationResult | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [restoring, setRestoring] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshAll = useCallback(() => {
    setSnapshots(listSnapshots());
    setStats(getStorageStats());
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Export ────────────────────────────────────────────────
  const handleExport = () => {
    audioManager.playClick();
    try {
      downloadBackup("Manual export");
      showToast("✓ Backup downloaded successfully", "ok");
    } catch (e) {
      showToast(`Export failed: ${e}`, "err");
    }
  };

  // ── Manual Snapshot ───────────────────────────────────────
  const handleManualSnapshot = () => {
    audioManager.playClick();
    try {
      createSnapshot("Manual snapshot");
      refreshAll();
      showToast("✓ Snapshot saved", "ok");
    } catch (e) {
      showToast(`Snapshot failed: ${e}`, "err");
    }
  };

  // ── Restore Snapshot ──────────────────────────────────────
  const handleRestore = (id: string) => {
    audioManager.playClick();
    setRestoring(id);
    setTimeout(() => {
      const result = restoreSnapshot(id);
      setRestoring(null);
      if (result.ok) {
        showToast("✓ Snapshot restored. Reload the page to see changes.", "ok");
        refreshAll();
      } else {
        showToast(`Restore failed: ${result.error}`, "err");
      }
    }, 400);
  };

  // ── Delete Snapshot ───────────────────────────────────────
  const handleDeleteSnapshot = (id: string) => {
    audioManager.playClick();
    deleteSnapshot(id);
    refreshAll();
    showToast("Snapshot deleted", "ok");
  };

  // ── Import File Pick ──────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result as string;
      setImportRaw(raw);
      setImportValidation(validateBackupFile(raw));
    };
    reader.readAsText(file);
  };

  // ── Apply Import ──────────────────────────────────────────
  const handleApplyImport = () => {
    if (!importRaw) return;
    audioManager.playClick();
    const result = importBackup(importRaw, { mode: importMode });
    if (result.ok) {
      showToast(`✓ Import applied (${importMode} mode). Reload to see data.`, "ok");
      setImportRaw(null);
      setImportValidation(null);
      refreshAll();
    } else {
      showToast(`Import failed: ${result.errors.join(", ")}`, "err");
    }
  };

  const usedPercent = Math.min(
    100,
    Math.round((stats.estimatedSizeBytes / (5 * 1024 * 1024)) * 100) // vs 5MB localStorage limit
  );

  return (
    <div className="panel p-4 flex flex-col min-h-0 gap-3 w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-signal/80">Infrastructure</p>
          <h2 className="font-display text-xl uppercase text-frost">Data Vault</h2>
        </div>
        {/* Sub-tabs */}
        <div className="flex items-center gap-1 border border-white/8 bg-black/40 p-1 rounded-sm">
          {(["overview", "snapshots", "import"] as VaultView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => { audioManager.playClick(); setView(v); }}
              className={`px-3 py-1 font-mono text-[9px] uppercase tracking-wider rounded-sm transition-all duration-200 ${
                view === v
                  ? "border border-signal/40 bg-signal/10 text-signal"
                  : "text-white/35 hover:text-white/60"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`px-3 py-2 border font-mono text-xs ${
              toast.type === "ok"
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                : "border-signal/30 bg-signal/5 text-signal"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── OVERVIEW TAB ──────────────────────────────────────── */}
      {view === "overview" && (
        <motion.div
          initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } }, hidden: {} }}
          className="flex-1 flex flex-col gap-4 overflow-y-auto"
        >
          {/* Storage Usage */}
          <motion.div variants={itemVariants} className="border border-white/8 bg-black/40 p-3 space-y-2">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="uppercase tracking-wider text-white/40">localStorage Usage</span>
              <span className="text-frost">{formatBytes(stats.estimatedSizeBytes)} / ~5 MB</span>
            </div>
            <div className="h-2 bg-white/5 rounded overflow-hidden">
              <div
                className={`h-full rounded transition-all duration-700 ${usedPercent > 80 ? "bg-signal/70" : usedPercent > 50 ? "bg-warning/70" : "bg-emerald-400/70"}`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
            <p className="font-mono text-[9px] text-white/25">{stats.populatedKeys}/{stats.totalKeys} modules populated</p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {stats.keys.map((k) => (
              <StatPill
                key={k.key}
                label={k.key.replace("batcave.", "").replace(/\.[^.]+$/, "")}
                value={k.itemCount > 0 ? `${k.itemCount} records` : "Empty"}
                dim={k.itemCount === 0}
              />
            ))}
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="py-3 border border-emerald-400/35 bg-emerald-400/5 text-emerald-400 font-display text-xs uppercase tracking-wider hover:bg-emerald-400/15 transition-all duration-200"
            >
              ↓ Export Full Backup (.json)
            </button>
            <button
              type="button"
              onClick={handleManualSnapshot}
              className="py-3 border border-frost/30 bg-frost/5 text-frost font-display text-xs uppercase tracking-wider hover:bg-frost/10 transition-all duration-200"
            >
              ◎ Save Snapshot Now
            </button>
          </motion.div>

          {/* Key registry details */}
          <motion.div variants={itemVariants} className="border border-white/5 bg-black/25 p-3 space-y-1">
            <p className="font-mono text-[9px] uppercase tracking-wider text-white/30 mb-2">Storage Registry</p>
            {stats.keys.map((k) => (
              <div key={k.key} className="flex items-center justify-between font-mono text-[9px] py-0.5 border-b border-white/[0.03]">
                <span className="text-white/40 font-medium">{k.key}</span>
                <span className="text-white/25">{formatBytes(k.sizeBytes)}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* ── SNAPSHOTS TAB ─────────────────────────────────────── */}
      {view === "snapshots" && (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">
              {snapshots.length}/30 snapshots stored
            </p>
            <button
              type="button"
              onClick={handleManualSnapshot}
              className="px-3 py-1.5 border border-frost/25 bg-frost/5 text-frost font-mono text-[9px] uppercase tracking-wider hover:bg-frost/10 transition-all"
            >
              + New Snapshot
            </button>
          </div>

          {snapshots.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center py-16">
              <p className="font-mono text-xs text-white/20">
                No snapshots yet.<br />
                <span className="text-white/15 text-[10px]">Auto-snapshots are created after every check-in.</span>
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className={`border p-3 space-y-2 transition-all duration-300 ${
                    restoring === snap.id
                      ? "border-signal/30 bg-signal/5 animate-pulse"
                      : "border-white/8 bg-black/35 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-white/50">{snap.trigger}</p>
                      <p className="font-display text-xs text-frost mt-0.5">{formatDate(snap.createdAt)}</p>
                    </div>
                    <span className="font-mono text-[8px] text-white/25">{formatBytes(snap.sizeBytes)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRestore(snap.id)}
                      disabled={!!restoring}
                      className="flex-1 py-1.5 border border-warning/30 bg-warning/5 text-warning font-mono text-[9px] uppercase tracking-wider hover:bg-warning/10 transition-all disabled:opacity-40"
                    >
                      {restoring === snap.id ? "Restoring…" : "↺ Restore"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSnapshot(snap.id)}
                      className="px-3 py-1.5 border border-white/10 bg-white/[0.02] text-white/30 font-mono text-[9px] uppercase hover:border-signal/30 hover:text-signal transition-all"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── IMPORT TAB ─────────────────────────────────────────── */}
      {view === "import" && (
        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto">
          {/* Upload area */}
          <div
            className="border border-dashed border-white/15 bg-black/20 p-8 text-center cursor-pointer hover:border-signal/30 hover:bg-signal/[0.02] transition-all duration-200"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const raw = ev.target?.result as string;
                setImportRaw(raw);
                setImportValidation(validateBackupFile(raw));
              };
              reader.readAsText(file);
            }}
          >
            <p className="font-mono text-xs text-white/30 uppercase tracking-wider">Drop backup .json here</p>
            <p className="font-mono text-[9px] text-white/15 mt-1">or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Validation result */}
          {importValidation && (
            <div className={`border p-3 space-y-2 ${importValidation.valid ? "border-emerald-500/25 bg-emerald-500/[0.03]" : "border-signal/25 bg-signal/[0.03]"}`}>
              <div className="flex items-center justify-between">
                <span className={`font-mono text-[10px] uppercase tracking-wider ${importValidation.valid ? "text-emerald-400" : "text-signal"}`}>
                  {importValidation.valid ? "✓ Valid Backup" : "✗ Invalid File"}
                </span>
                <span className="font-mono text-[9px] text-white/30">{importValidation.keyCount} keys detected</span>
              </div>

              {importValidation.version && (
                <p className="font-mono text-[9px] text-white/40">Schema version: {importValidation.version}</p>
              )}

              {importValidation.stats && (
                <div className="grid grid-cols-3 gap-2 font-mono text-[9px]">
                  <div><span className="text-white/30 block">Beliefs</span><span className="text-frost">{importValidation.stats.beliefEntries}</span></div>
                  <div><span className="text-white/30 block">Activities</span><span className="text-frost">{importValidation.stats.foundationActivities}</span></div>
                  <div><span className="text-white/30 block">Protocols</span><span className="text-frost">{importValidation.stats.countermeasureLogs}</span></div>
                </div>
              )}

              {importValidation.errors.length > 0 && (
                <div className="space-y-0.5">
                  {importValidation.errors.map((e, i) => (
                    <p key={i} className="font-mono text-[9px] text-signal">✗ {e}</p>
                  ))}
                </div>
              )}

              {importValidation.warnings.length > 0 && (
                <div className="space-y-0.5">
                  {importValidation.warnings.map((w, i) => (
                    <p key={i} className="font-mono text-[9px] text-warning">⚠ {w}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Import Mode + Apply */}
          {importValidation?.valid && (
            <div className="space-y-3">
              <div className="border border-white/8 bg-black/35 p-3 space-y-2">
                <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">Import Mode</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { audioManager.playClick(); setImportMode("merge"); }}
                    className={`py-2 border font-mono text-[9px] uppercase tracking-wider transition-all ${
                      importMode === "merge"
                        ? "border-frost/40 bg-frost/10 text-frost"
                        : "border-white/10 text-white/35 hover:text-white/60"
                    }`}
                  >
                    Merge
                    <span className="block text-[8px] opacity-60 mt-0.5 normal-case">Keep existing + add new</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { audioManager.playClick(); setImportMode("replace"); }}
                    className={`py-2 border font-mono text-[9px] uppercase tracking-wider transition-all ${
                      importMode === "replace"
                        ? "border-signal/40 bg-signal/10 text-signal"
                        : "border-white/10 text-white/35 hover:text-white/60"
                    }`}
                  >
                    Replace
                    <span className="block text-[8px] opacity-60 mt-0.5 normal-case">Overwrite all data</span>
                  </button>
                </div>
                {importMode === "replace" && (
                  <p className="font-mono text-[9px] text-signal/70">
                    ⚠ Replace mode will overwrite all current data. A safety snapshot will be created first.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleApplyImport}
                className="w-full py-3 border border-emerald-400/35 bg-emerald-400/10 text-emerald-400 font-display text-sm uppercase tracking-wider hover:bg-emerald-400/20 transition-all duration-200"
              >
                Apply Import ({importMode} mode)
              </button>
            </div>
          )}

          {!importRaw && (
            <div className="border border-white/5 bg-black/20 p-4 space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-wider text-white/25">Import Guidelines</p>
              <div className="space-y-1 font-mono text-[9px] text-white/20">
                <p>• Only import Batcave .json backup files</p>
                <p>• Merge mode is safe — existing data is never deleted</p>
                <p>• Replace mode creates a safety snapshot first</p>
                <p>• Reload the page after importing to reflect changes</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
