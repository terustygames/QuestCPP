
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db, auth } from "../firebase";
import {
  defaultMeta,
  type MetaState,
} from "../game/meta";

export async function loadPlayerMeta(): Promise<MetaState> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Player is not authenticated");
  }

  const profileRef = doc(db, "players", user.uid);
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    const meta = defaultMeta();

    await setDoc(profileRef, {
      meta,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return meta;
  }

  const data = snapshot.data();

  return data.meta
    ? {
        ...defaultMeta(),
        ...data.meta,
      } as MetaState
    : defaultMeta();
}

export async function savePlayerMeta(
  meta: MetaState
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Player is not authenticated");
  }

  const profileRef = doc(db, "players", user.uid);

  await setDoc(
    profileRef,
    {
      meta,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
