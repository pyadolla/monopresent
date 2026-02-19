declare module 'citation-js' {
  class Citation {
    constructor(data?: any)
    static parse: {
      bibtex: {
        text(input: string): any
      }
    }
    format(type: string, options?: Record<string, any>): string
  }

  export = Citation
}
