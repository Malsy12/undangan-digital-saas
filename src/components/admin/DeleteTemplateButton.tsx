"use client";

import { useTransition } from "react";
import { deleteTemplateAction } from "@/app/admin/templates/actions";

export default function DeleteTemplateButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Hapus tema "${name}"? Tindakan ini tidak bisa dibatalkan.`)) {
      return;
    }
    startTransition(() => {
      deleteTemplateAction(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      {isPending ? "Menghapus..." : "Hapus"}
    </button>
  );
}
