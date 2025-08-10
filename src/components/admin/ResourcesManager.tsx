"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

export type AdminResource = {
  id: string;
  title: string;
  slug: string;
  isPublic: boolean;
  createdAt: string | Date;
};

export default function ResourcesManager({ initialResources }: { initialResources: AdminResource[] }) {
  const [resources, setResources] = useState<AdminResource[]>(initialResources);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  async function refresh() {
    const res = await fetch("/api/admin/resources");
    const data = await res.json();
    if (res.ok) setResources(data.items);
  }

  useEffect(() => {
    setSelectedIds((prev) => new Set([...prev].filter((id) => resources.some((r) => r.id === id))));
  }, [resources]);

  const allSelected = useMemo(() => resources.length > 0 && resources.every((r) => selectedIds.has(r.id)), [resources, selectedIds]);
  const anySelected = selectedIds.size > 0;

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(resources.map((r) => r.id)));
  }
  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteOne(id: string) {
    setBusyIds((s) => new Set(s).add(id));
    const prev = resources;
    setResources((list) => list.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/admin/resources/${id}`, { method: "POST", body: new URLSearchParams({ _method: "DELETE" }) });
      if (!res.ok) throw new Error("删除失败");
      toast.success("已删除");
      setSelectedIds((sel) => {
        const next = new Set(sel);
        next.delete(id);
        return next;
      });
    } catch (e) {
      toast.error((e as Error).message || "删除失败");
      setResources(prev);
    } finally {
      setBusyIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  }

  async function batchDelete() {
    if (!anySelected) return;
    if (!confirm(`确定删除选中的 ${selectedIds.size} 条资料？此操作不可恢复。`)) return;
    setIsBusy(true);
    const ids = [...selectedIds];
    setResources((list) => list.filter((r) => !selectedIds.has(r.id)));
    try {
      const results = await Promise.allSettled(ids.map((id) => fetch(`/api/admin/resources/${id}`, { method: "POST", body: new URLSearchParams({ _method: "DELETE" }) })));
      const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok));
      if (failed.length > 0) {
        toast.error(`部分失败：${failed.length}/${ids.length}`);
        await refresh();
      } else {
        toast.success("批量删除完成");
      }
      setSelectedIds(new Set());
    } finally {
      setIsBusy(false);
    }
  }

  async function batchSetPublic(isPublic: boolean) {
    if (!anySelected) return;
    setIsBusy(true);
    const ids = [...selectedIds];
    const prev = resources;
    setResources((list) => list.map((r) => (selectedIds.has(r.id) ? { ...r, isPublic } : r)));
    try {
      const payload = JSON.stringify({ isPublic });
      const results = await Promise.allSettled(ids.map((id) => fetch(`/api/admin/resources/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: payload })));
      const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok));
      if (failed.length > 0) {
        toast.error(`部分失败：${failed.length}/${ids.length}`);
        await refresh();
      } else {
        toast.success("批量更新完成");
      }
      setSelectedIds(new Set());
    } catch {
      setResources(prev);
      toast.error("更新失败");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={batchDelete} disabled={!anySelected || isBusy} className="rounded-md border px-3 py-1.5 hover:bg-red-50 text-red-600 border-red-200 disabled:opacity-60">批量删除</button>
        <button onClick={() => batchSetPublic(true)} disabled={!anySelected || isBusy} className="rounded-md border px-3 py-1.5 hover:bg-neutral-100 disabled:opacity-60">批量设为公开</button>
        <button onClick={() => batchSetPublic(false)} disabled={!anySelected || isBusy} className="rounded-md border px-3 py-1.5 hover:bg-neutral-100 disabled:opacity-60">批量设为私有</button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="p-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
              </th>
              <th className="text-left p-3">标题</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">公开</th>
              <th className="text-left p-3">创建时间</th>
              <th className="text-right p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 w-10">
                  <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleOne(r.id)} />
                </td>
                <td className="p-3">{r.title}</td>
                <td className="p-3 text-neutral-600">{r.slug}</td>
                <td className="p-3">{r.isPublic ? "是" : "否"}</td>
                <td className="p-3">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-3 text-right space-x-2">
                  <Link href={`/admin/resources/${r.id}`} className="rounded-md border px-3 py-1 hover:bg-neutral-100">编辑</Link>
                  <button onClick={() => setConfirmId(r.id)} className="rounded-md border px-3 py-1 hover:bg-red-50 text-red-600 border-red-200 disabled:opacity-60" disabled={busyIds.has(r.id)}>
                    {busyIds.has(r.id) ? <span className="inline-flex items-center gap-1"><Loader2 className="h-4 w-4 animate-spin" /> 删除中</span> : "删除"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!confirmId}
        title="确认删除"
        description="删除后无法恢复，是否确认删除该资料？"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteOne(confirmId)}
        busy={isBusy}
      />
    </div>
  );
}

function ConfirmDialog({ open, title, description, onConfirm, onCancel, busy }: { open: boolean; title: string; description?: string; onConfirm: () => void; onCancel: () => void; busy?: boolean; }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-neutral-600 mt-2">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-md border px-4 py-2">取消</button>
          <button onClick={onConfirm} disabled={busy} className="rounded-md border bg-red-600 text-white px-4 py-2 disabled:opacity-60">删除</button>
        </div>
      </div>
    </div>
  );
}
