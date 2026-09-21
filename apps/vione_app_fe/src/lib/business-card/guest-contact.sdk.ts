// BC-Mobile-3B — Guest Contact browser SDK (owner-side reads).
// All operations now call NestJS backend connect-app endpoints.

import { fetchNestApi } from "../api-client";
import type { GuestContact } from "./guest-contact";

export const GuestContactSDK = {
  /** Owner-scoped list. */
  async listMine(): Promise<GuestContact[]> {
    return fetchNestApi("/connect-app/network/guest-contacts");
  },

  /** Owner-scoped single fetch. */
  async getMine(id: string): Promise<GuestContact | null> {
    return fetchNestApi(`/connect-app/network/guest-contacts/${id}`);
  },

  /** Update private owner labels/notes. */
  async updateOwnerFields(
    id: string,
    patch: { ownerLabel?: string | null; ownerNote?: string | null },
  ): Promise<GuestContact | null> {
    return fetchNestApi(`/connect-app/network/guest-contacts/${id}/owner-fields`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  /** Delete guest contact profile. */
  async deleteMine(id: string): Promise<{ removed: boolean }> {
    return fetchNestApi(`/connect-app/network/guest-contacts/${id}`, {
      method: "DELETE",
    });
  },
};

