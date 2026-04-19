import { apiJson } from "./client";

export interface ContactRelationshipDto {
  id: string;
  contactId: string;
  relatedContactId: string;
  relatedContactName: string;
  relationshipType: string;
  label?: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
}

export interface ContactWithHierarchyDto {
  id: string;
  displayName: string;
  contactType: "individual" | "company";
  parentContactId?: string;
  parentContactName?: string;
  roles: string[];
  primaryEmail: string;
  primaryPhone: string;
  children: { id: string; displayName: string; contactType: string; roles: string[] }[];
  relationships: ContactRelationshipDto[];
}

export interface CreateContactRelationshipDto {
  relatedContactId: string;
  relationshipType: string;
  label?: string;
  isPrimary?: boolean;
  notes?: string;
}

export const getContactRelationships = (contactId: string) =>
  apiJson<ContactRelationshipDto[]>(`/api/contacts/${contactId}/relationships`);

export const getContactHierarchy = (contactId: string) =>
  apiJson<ContactWithHierarchyDto>(`/api/contacts/${contactId}/relationships/hierarchy`);

export const createContactRelationship = (contactId: string, dto: CreateContactRelationshipDto) =>
  apiJson<ContactRelationshipDto>(`/api/contacts/${contactId}/relationships`, {
    method: "POST",
    body: JSON.stringify(dto),
    headers: { "Content-Type": "application/json" },
  });

export const deleteContactRelationship = (contactId: string, relationshipId: string) =>
  apiJson<void>(`/api/contacts/${contactId}/relationships/${relationshipId}`, { method: "DELETE" });
