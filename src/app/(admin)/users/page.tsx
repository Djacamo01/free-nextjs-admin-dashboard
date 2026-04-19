import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UsersTable from "@/components/users/UsersTable";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Users | Ordely",
  description: "Gestión de usuarios",
};

export default function UsersPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Users" />
      <UsersTable />
    </div>
  );
}
