import { apiFetch } from "./client";
import type { Profile, ProfileUpdate } from "../../types/profile";

export async function getProfile(): Promise<Profile> {
  return apiFetch<Profile>("/me", { method: "GET" });
}

export async function updateProfile(update: ProfileUpdate): Promise<Profile> {
  return apiFetch<Profile>("/me", {
    method: "PUT",
    body: JSON.stringify(update),
  });
}

