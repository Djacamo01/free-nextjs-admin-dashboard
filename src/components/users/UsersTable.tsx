"use client";

import { fetchUsers, ClientHttpError } from "@/api";
import type { CurrentUser } from "@/api/user";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { labelContactRole } from "@/constants/publicEnums";
import { formatShortDateTime } from "@/lib/formatDate";
import React, { useEffect, useState } from "react";

export default function UsersTable() {
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchUsers()
      .then((data) => {
        if (!cancelled) setUsers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            err instanceof ClientHttpError
              ? err.message
              : "No se pudo cargar la lista de usuarios.";
          setError(msg);
          setUsers([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400">
        Cargando usuarios…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 px-5 py-6 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[900px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Nombre
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Email
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Rol
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Estado
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Creado
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Actualizado
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No hay usuarios.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                      {u.name}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                      {u.email}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                      {labelContactRole(u.role)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <Badge
                        size="sm"
                        color={u.active ? "success" : "error"}
                      >
                        {u.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                      {formatShortDateTime(u.createdAt)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                      {formatShortDateTime(u.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
