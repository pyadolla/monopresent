declare module 'svg-path-parse' {
  export function pathParse(path: string): {
    relNormalize(options?: { transform?: string }): {
      err: any
      segments: any
      type: any
    }
  }

  export function serializePath(parsed: {
    err: any
    segments: any
    type: any
  }): string
}
