import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Slot {
    owner: string;
    blobId: Uint8Array;
    index: bigint;
}
export interface SlotInfo {
    blobId?: Uint8Array;
    index: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createSlot(index: bigint, blobId: Uint8Array): Promise<void>;
    getAllSlotInfo(): Promise<Array<SlotInfo>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSlotByIndex(index: bigint): Promise<Slot | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeSlot(index: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
