declare module '@web3-storage/w3up-client' {
  export function create(): Promise<{
    createSpace(name: string): Promise<{
      upload(file: File): Promise<string>;
    }>;
  }>;
} 