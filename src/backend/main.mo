import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Blob "mo:core/Blob";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import Runtime "mo:core/Runtime";

import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  // Mixin modules for blob storage and access control
  include MixinStorage();
  // Actor state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Type definitions for slot and slot info
  public type Slot = {
    index : Nat;
    blobId : Blob;
    owner : Text;
  };

  public type SlotInfo = {
    index : Nat;
    blobId : ?Blob;
  };

  public type UserProfile = {
    name : Text;
  };

  type SlotId = Nat;

  // Map to store slots
  let slots = Map.empty<SlotId, Slot>();

  // Map to store user profiles
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Internal helper function to get a slot
  func getSlotInternal(index : Nat) : ?Slot {
    slots.get(index);
  };

  // Public function to get a slot - accessible to guests (non-authenticated users)
  public query func getSlotByIndex(index : Nat) : async ?Slot {
    // No authorization check - accessible to all including guests
    getSlotInternal(index);
  };

  // Internal helper function to create a slot
  func createSlotInternal(index : Nat, blobId : Blob) : Slot {
    {
      index;
      blobId;
      owner = "defaultOwner";
    };
  };

  // Public function to create a slot, restricted to admin
  public shared ({ caller }) func createSlot(index : Nat, blobId : Blob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can create slots");
    };

    // Validate slotId (1-10 inclusive)
    if (index < 1 or index > 10) {
      Runtime.trap("Slot index must be between 1 and 10");
    };

    if (getSlotInternal(index).isSome()) {
      Runtime.trap("Slot already taken");
    };

    let newSlot = createSlotInternal(index, blobId);
    slots.add(index, newSlot);
  };

  // Public function to remove a slot, restricted to admin
  public shared ({ caller }) func removeSlot(index : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can remove slots");
    };
    slots.remove(index);
  };

  // Public function to get all slot info - accessible to guests (non-authenticated users)
  public query func getAllSlotInfo() : async [SlotInfo] {
    // No authorization check - accessible to all including guests
    let iter = Nat.range(1, 10).map(
      func(i) {
        {
          index = i;
          blobId = slots.get(i).map(func(slot) { slot.blobId });
        };
      }
    );
    iter.toArray();
  };
};
