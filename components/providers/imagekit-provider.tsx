"use client";

import {
  createContext,
  useContext,
} from "react";

type ImageKitContextValue = {
  enabled: boolean;
};

const ImageKitContext =
  createContext<ImageKitContextValue>({
    enabled: true,
  });

type ImageKitProviderProps = {
  enabled: boolean;
  children: React.ReactNode;
};

export function ImageKitProvider({
  enabled,
  children,
}: ImageKitProviderProps) {
  return (
    <ImageKitContext.Provider
      value={{ enabled }}
    >
      {children}
    </ImageKitContext.Provider>
  );
}

export function useImageKit() {
  return useContext(ImageKitContext);
}