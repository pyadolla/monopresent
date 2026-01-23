import React from "react";

/* eslint-disable jsx-a11y/iframe-has-title, jsx-a11y/alt-text,  */
/* eslint-disable no-unused-vars */

import { useState } from "react";

import {
  AnimateSVG,
  Morph,
  m,
  M,
  Show,
  Notes,
  Portal,
  timeline,
  range,
  themes,
} from "immersion-presentation";

import "immersion-presentation/dist/index.css";
import step from "immersion-presentation/dist/step.macro.js";

const {
  Presentation,
  Slide,
  BibliographySlide,
  TitleSlide,
  TableOfContentsSlide,
  SectionSlide,
  QuestionSlide,
  ConclusionSlide,
  Figure,
  List,
  Item,
  Cite,
  Box,
  Qed,
} = themes.modern;

const children = ['\\g1{E}\\g2{=}\\g3{mc}^{\\g5{2}}','\\frac{\\g1{\\partial E}}{\\g1{\\partial c}}\\g2{=}\\g5{2}\\g3{mc}']
const children0 =['E=mc^{2}', '\\frac{\\partial E}{\\partial c}= 2mc']
function App() {
  return (
    <Presentation>
      {/* <Slide steps={[1, 2, 3]}>The step is {step}!</Slide> */}
      <TitleSlide title="My Title" subtitle="Very good title" names="Payman Y" date="November 12, 2024"></TitleSlide>
      <SectionSlide section="First Section"></SectionSlide>
      <Slide steps={[1, 2, 3, 4, 5]} header={'Show me a list!'}>
        Here's the list:
        <List step={step} style={{ 'paddingLeft': '0', 'marginLeft': '0', fontSize: '100%'}}>
          <Item name="Item 1">Content for item 1</Item>
          <Item name="Item 2">This is a sentence</Item>
          <Item name="Item 3">Content for item 3</Item>
          <Item name="Equation">
            <Show when={step>=4}>
              <Morph display>
                {children[step-4]}
              </Morph>
            </Show>
          </Item>
        </List>
      </Slide>
      <Slide steps={[1, 2, 3]}>The step is {step}!</Slide> 
    </Presentation>
  );
}

export default App;
