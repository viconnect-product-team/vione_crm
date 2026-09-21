// Digital Credentials — FUTURE architecture only (no implementation).
// Defines the shape of a W3C Verifiable Credential + DID mapping so a future
// backend can issue verifiable membership credentials (government ID, university,
// business association) without changing the on-screen card contract.
//
// Nothing here signs or verifies credentials — that requires an issuer service
// with key management. These are types + a builder for the UNSIGNED credential
// subject that an issuer would later sign.

import type { MembershipPass } from "@/lib/membership-pass";

export type DidMethod = "did:web" | "did:key" | "did:ion";

export type CredentialType =
  | "MembershipCredential"
  | "GovernmentIdCredential"
  | "UniversityCredential"
  | "BusinessAssociationCredential";

export type VerifiableCredentialDraft = {
  "@context": string[];
  type: ["VerifiableCredential", CredentialType];
  issuer: string; // DID of the issuing association (assigned by backend)
  issuanceDate: string;
  expirationDate: string | null;
  credentialSubject: {
    id: string; // holder DID (assigned by backend)
    memberCode: string;
    name: string;
    organization: string | null;
    membershipLevel: string | null;
    associationName: string | null;
  };
  // proof is attached by the issuer service — intentionally absent (unsigned draft).
};

export function buildCredentialDraft(
  pass: MembershipPass,
  type: CredentialType = "MembershipCredential",
): VerifiableCredentialDraft {
  return {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", type],
    issuer: pass.associationName
      ? `did:web:association/${encodeURIComponent(pass.associationName)}`
      : "did:web:unknown",
    issuanceDate: pass.issuedAt ?? new Date().toISOString(),
    expirationDate: pass.expiresAt,
    credentialSubject: {
      id: `did:key:member/${encodeURIComponent(pass.memberCode)}`,
      memberCode: pass.memberCode,
      name: pass.memberName,
      organization: pass.organization,
      membershipLevel: pass.membershipLevel,
      associationName: pass.associationName,
    },
  };
}
