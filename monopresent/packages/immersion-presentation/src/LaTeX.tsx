import React from 'react'

import Morph from './Morph'

export function InlineMath({
  children,
  ...props
}: {
  children: string
  [key: string]: any
}): React.ReactElement {
  return (
    <Morph inline replace {...props}>
      {children}
    </Morph>
  )
}

export function DisplayMath({
  children,
  ...props
}: {
  children: string
  [key: string]: any
}): React.ReactElement {
  return (
    <Morph display replace {...props}>
      {children}
    </Morph>
  )
}

export const m = (
  template: TemplateStringsArray,
  ...subtitutions: any[]
): React.ReactElement => (
  <InlineMath>{String.raw(template, ...subtitutions)}</InlineMath>
)
// export const m = (
//   template: TemplateStringsArray,
//   ...substitutions: any[]
// ) => (props: Omit<React.ComponentProps<typeof InlineMath>, 'children'> = {}) => (
//   <InlineMath {...props}>
//     {String.raw(template, ...substitutions)}
//   </InlineMath>
// );

const YOFF = '-0.8em';

export const mOffset = (
  template: TemplateStringsArray,
  ...substitutions: any[]
) => (
  props: Omit<React.ComponentProps<typeof InlineMath>, 'children'> = {}
) => {
    const userTransform = props.style?.transform ?? '';
    const combinedTransform = `translateY(${YOFF}) ${userTransform}`.trim();

    return (
      <InlineMath
        {...props}
        style={{
          ...props.style,
          transform: combinedTransform,
        }}
      >
        {String.raw(template, ...substitutions)}
      </InlineMath>
    );
  };


export const M = (
  template: TemplateStringsArray,
  ...subtitutions: any[]
): React.ReactElement => (
  <DisplayMath>{String.raw(template, ...subtitutions)}</DisplayMath>
)
// export const M = (
//   template: TemplateStringsArray,
//   ...substitutions: any[]
// ) => (props: React.ComponentProps<typeof DisplayMath> = {}) => (
//   <DisplayMath {...props}>
//     {String.raw(template, ...substitutions)}
//   </DisplayMath>
// );
